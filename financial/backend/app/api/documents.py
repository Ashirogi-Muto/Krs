"""Document upload, secure streaming, and document vault endpoints."""
import re
import unicodedata
from typing import List, Optional
from urllib.parse import quote
from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, Form
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.user import User
from app.models.income import Income
from app.models.expense import Expense
from app.models.document import Document, DocumentLink
from app.schemas.document import DocumentResponse
from app.api.deps import get_current_user, require_role, validate_csrf
from app.services.storage_service import get_storage_provider
from app.services.audit_service import record_audit
from app.config import settings

UPLOAD_CHUNK = 1024 * 1024


def content_disposition(filename: str, disposition: str = "inline") -> str:
    """Header value that is safe for any filename: ASCII fallback + RFC 5987 UTF-8 name, no quotes/CR/LF."""
    name = (filename or "document").replace("\r", " ").replace("\n", " ").strip() or "document"
    ascii_name = unicodedata.normalize("NFKD", name).encode("ascii", "ignore").decode("ascii")
    ascii_name = re.sub(r'["\\;]', "_", ascii_name).strip() or "document"
    return f"{disposition}; filename=\"{ascii_name}\"; filename*=UTF-8''{quote(name, safe='')}"


async def read_limited(file: UploadFile, limit: int) -> bytes:
    """Read an upload in chunks and stop as soon as it is larger than `limit` (never loads a huge body)."""
    chunks, size = [], 0
    while True:
        chunk = await file.read(UPLOAD_CHUNK)
        if not chunk:
            break
        size += len(chunk)
        if size > limit:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"File exceeds maximum allowed size of {limit // (1024 * 1024)}MB",
            )
        chunks.append(chunk)
    return b"".join(chunks)

router = APIRouter(prefix="/api/documents", tags=["Documents"])

@router.get("", response_model=List[DocumentResponse])
def list_documents(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """List all stored documents and their transaction associations (Shared KRS Vault)."""
    docs = db.query(Document).order_by(Document.uploaded_at.desc()).all()
    results = []
    for d in docs:
        entity_type = None
        entity_id = None
        tx_id = None
        project_name = None
        if d.links:
            link = d.links[0]
            entity_type = link.entity_type
            entity_id = link.entity_id
            if entity_type == "EXPENSE":
                exp = db.query(Expense).filter(Expense.id == entity_id).first()
                if exp:
                    tx_id = exp.transaction_id
                    project_name = exp.project.name if exp.project else None
            elif entity_type == "INCOME":
                inc = db.query(Income).filter(Income.id == entity_id).first()
                if inc:
                    tx_id = inc.transaction_id
                    project_name = inc.project.name if inc.project else None

        results.append(DocumentResponse(
            id=d.id,
            filename=d.filename,
            mime_type=d.mime_type,
            file_size=d.file_size,
            checksum_sha256=d.checksum_sha256,
            document_type=getattr(d, "document_type", "OTHER") or "OTHER",
            uploaded_by=d.uploaded_by,
            uploader_name=d.uploader.name if d.uploader else None,
            uploaded_at=d.uploaded_at,
            entity_type=entity_type,
            entity_id=entity_id,
            transaction_id=tx_id,
            project_name=project_name
        ))
    return results

@router.post("/upload", response_model=DocumentResponse, status_code=status.HTTP_201_CREATED, dependencies=[Depends(validate_csrf)])
async def upload_document(
    file: UploadFile = File(...),
    entity_type: str = Form(...),  # "INCOME" or "EXPENSE"
    entity_id: str = Form(...),    # Entity UUID or transaction_id
    document_type: str = Form("INVOICE"),  # "INVOICE", "RECEIPT", "PAYMENT_PROOF", "QUOTE", "CONTRACT", "OTHER"
    current_user: User = Depends(require_role("EDITOR")),
    db: Session = Depends(get_db)
):
    """Upload a receipt/invoice and atomically link it to a transaction (Editor only)."""
    clean_type = entity_type.strip().upper()
    if clean_type not in ("INCOME", "EXPENSE"):
        raise HTTPException(status_code=400, detail="entity_type must be either 'INCOME' or 'EXPENSE'")

    clean_doc_type = document_type.strip().upper()
    valid_doc_types = {"INVOICE", "RECEIPT", "PAYMENT_PROOF", "QUOTE", "CONTRACT", "OTHER"}
    if clean_doc_type not in valid_doc_types:
        clean_doc_type = "OTHER"

    # Validate target entity exists
    project_name = None
    if clean_type == "EXPENSE":
        target = db.query(Expense).filter((Expense.id == entity_id) | (Expense.transaction_id == entity_id)).first()
        if not target:
            raise HTTPException(status_code=404, detail="Target expense transaction not found")
        real_entity_id = target.id
        tx_display_id = target.transaction_id
        project_name = target.project.name if target.project else None
    else:
        target = db.query(Income).filter((Income.id == entity_id) | (Income.transaction_id == entity_id)).first()
        if not target:
            raise HTTPException(status_code=404, detail="Target income transaction not found")
        real_entity_id = target.id
        tx_display_id = target.transaction_id
        project_name = target.project.name if target.project else None

    storage = get_storage_provider()
    content = await read_limited(file, settings.MAX_UPLOAD_SIZE_BYTES)

    # Save to storage with validation
    try:
        storage_key, mime_type, file_size, checksum = storage.save_file(
            file_bytes=content,
            original_filename=file.filename or "receipt.jpg"
        )
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Storage service failure")

    # Atomic DB linking with storage cleanup on failure
    try:
        doc = Document(
            filename=file.filename or "unnamed_document",
            storage_key=storage_key,
            mime_type=mime_type,
            file_size=file_size,
            checksum_sha256=checksum,
            document_type=clean_doc_type,
            uploaded_by=current_user.id
        )
        db.add(doc)
        db.flush()

        link = DocumentLink(
            document_id=doc.id,
            entity_type=clean_type,
            entity_id=real_entity_id
        )
        db.add(link)
        db.flush()
        record_audit(
            db=db,
            user_id=current_user.id,
            user_name=current_user.name,
            action="UPLOAD_DOC",
            entity_type=clean_type,
            entity_id=tx_display_id,
            after_data={
                "document_id": doc.id,
                "filename": doc.filename,
                "file_size": doc.file_size,
                "document_type": doc.document_type
            }
        )
        db.commit()  # document, link and audit entry together
        db.refresh(doc)
    except Exception as exc:
        db.rollback()
        # Clean up orphaned file from storage
        storage.delete_file(storage_key)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to record document metadata. Staged file has been safely removed."
        )

    return DocumentResponse(
        id=doc.id,
        filename=doc.filename,
        mime_type=doc.mime_type,
        file_size=doc.file_size,
        checksum_sha256=doc.checksum_sha256,
        document_type=doc.document_type,
        uploaded_by=doc.uploaded_by,
        uploader_name=current_user.name,
        uploaded_at=doc.uploaded_at,
        entity_type=clean_type,
        entity_id=real_entity_id,
        transaction_id=tx_display_id,
        project_name=project_name
    )

@router.get("/{document_id}/stream")
def stream_document(
    document_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Securely stream attached document content after verifying user authentication."""
    doc = db.query(Document).filter(Document.id == document_id).first()
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")

    storage = get_storage_provider()
    try:
        stream = storage.get_file_stream(doc.storage_key)
    except FileNotFoundError:
        raise HTTPException(status_code=404, detail="Document file not found in storage vault")
    except Exception:
        raise HTTPException(status_code=500, detail="Error streaming file from storage")

    headers = {
        "Content-Disposition": content_disposition(doc.filename),
        "X-Content-Type-Options": "nosniff",
        # The portal previews PDFs/images in an iframe of its own pages; other sites still can't frame it
        "X-Frame-Options": "SAMEORIGIN",
        "Content-Security-Policy": "frame-ancestors 'self'",
        "Cache-Control": "private, no-store",
    }
    return StreamingResponse(stream, media_type=doc.mime_type, headers=headers)

@router.delete("/{document_id}", dependencies=[Depends(validate_csrf)])
def delete_document(
    document_id: str,
    current_user: User = Depends(require_role("EDITOR")),
    db: Session = Depends(get_db)
):
    """Delete a document and its transaction links (Editor only)."""
    doc = db.query(Document).filter(Document.id == document_id).first()
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")

    storage = get_storage_provider()
    storage_key = doc.storage_key
    filename = doc.filename

    db.delete(doc)
    record_audit(
        db=db,
        user_id=current_user.id,
        user_name=current_user.name,
        action="DELETE_DOC",
        entity_type="DOCUMENT",
        entity_id=document_id,
        before_data={"filename": filename}
    )
    db.commit()  # delete and audit entry together

    # Remove binary from storage only once the database change is saved
    storage.delete_file(storage_key)

    return {"message": "Document deleted successfully"}
