"""Income management endpoints."""
from datetime import date
from typing import Optional, List
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from sqlalchemy import func
from app.database import get_db
from app.models.user import User
from app.models.income import Income
from app.models.document import Document, DocumentLink
from app.schemas.income import IncomeCreate, IncomeUpdate, IncomeResponse, IncomeAttachmentItem
from app.api.deps import get_current_user, require_role, validate_csrf
from app.services.audit_service import record_audit

router = APIRouter(prefix="/api/income", tags=["Income"])

def generate_income_transaction_id(db: Session) -> str:
    """Generate the next unique business transaction ID (e.g. INC-001)."""
    existing = db.query(Income.transaction_id).filter(
        Income.transaction_id.like("INC-%")
    ).all()
    max_num = 0
    for (tx_id,) in existing:
        try:
            num = int(tx_id.split("-")[1])
            if num > max_num:
                max_num = num
        except (IndexError, ValueError):
            pass
    return f"INC-{max_num + 1:03d}"

def serialize_income(inc: Income, db: Session) -> IncomeResponse:
    doc_links = db.query(DocumentLink).filter(
        DocumentLink.entity_type == "INCOME",
        DocumentLink.entity_id == inc.id
    ).all()
    attachments = [
        IncomeAttachmentItem(
            id=dl.document.id,
            filename=dl.document.filename,
            mime_type=dl.document.mime_type,
            file_size=dl.document.file_size,
            document_type=getattr(dl.document, "document_type", "OTHER") or "OTHER"
        )
        for dl in doc_links
        if dl.document
    ]

    project_name = inc.project.name if inc.project else None

    return IncomeResponse(
        id=inc.id,
        transaction_id=inc.transaction_id,
        date=inc.date,
        source=inc.source,
        category_id=inc.category_id,
        category_name=inc.category.name if inc.category else None,
        amount=inc.amount,
        payment_method_id=inc.payment_method_id,
        payment_method_name=inc.payment_method.name if inc.payment_method else None,
        received_by=inc.received_by,
        reference_number=inc.reference_number,
        notes=inc.notes,
        project_id=inc.project_id,
        project_name=project_name,
        status=inc.status,
        created_by=inc.created_by,
        created_at=inc.created_at,
        updated_at=inc.updated_at,
        attachments=attachments
    )

@router.get("", response_model=List[IncomeResponse])
def list_income(
    month: Optional[str] = Query(None, description="Filter by YYYY-MM"),
    category_id: Optional[str] = None,
    payment_method_id: Optional[str] = None,
    search: Optional[str] = None,
    status_filter: Optional[str] = Query(None, alias="status"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """List all income records with optional filtering (Shared KRS Ledger)."""
    query = db.query(Income)

    if month:
        try:
            year, m_num = map(int, month.split("-"))
            start_dt = date(year, m_num, 1)
            end_dt = date(year + 1, 1, 1) if m_num == 12 else date(year, m_num + 1, 1)
            query = query.filter(Income.date >= start_dt, Income.date < end_dt)
        except Exception:
            pass

    if category_id:
        query = query.filter(Income.category_id == category_id)
    if payment_method_id:
        query = query.filter(Income.payment_method_id == payment_method_id)
    if status_filter:
        query = query.filter(Income.status == status_filter.upper())
    if search:
        s = f"%{search.strip()}%"
        query = query.filter(
            (Income.source.ilike(s)) |
            (Income.transaction_id.ilike(s)) |
            (Income.reference_number.ilike(s)) |
            (Income.notes.ilike(s))
        )

    records = query.order_by(Income.date.desc()).all()
    return [serialize_income(r, db) for r in records]

@router.get("/{income_id}", response_model=IncomeResponse)
def get_income_detail(
    income_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Retrieve details for a single income record."""
    inc = db.query(Income).filter(
        (Income.id == income_id) | (Income.transaction_id == income_id)
    ).first()
    if not inc:
        raise HTTPException(status_code=404, detail="Income record not found")
    return serialize_income(inc, db)

@router.post("", response_model=IncomeResponse, status_code=status.HTTP_201_CREATED, dependencies=[Depends(validate_csrf)])
def create_income(
    income_data: IncomeCreate,
    current_user: User = Depends(require_role("EDITOR")),
    db: Session = Depends(get_db)
):
    """Create a new income record (Editor only)."""
    tx_id = generate_income_transaction_id(db)

    new_inc = Income(
        transaction_id=tx_id,
        date=income_data.date,
        source=income_data.source,
        category_id=income_data.category_id,
        amount=income_data.amount,
        payment_method_id=income_data.payment_method_id,
        received_by=income_data.received_by,
        reference_number=income_data.reference_number,
        notes=income_data.notes,
        project_id=income_data.project_id,
        status="CLEARED",
        created_by=current_user.id
    )
    db.add(new_inc)
    db.flush()  # one transaction with its audit entry (committed below)
    db.refresh(new_inc)

    record_audit(
        db=db,
        user_id=current_user.id,
        user_name=current_user.name,
        action="CREATE",
        entity_type="INCOME",
        entity_id=new_inc.transaction_id,
        after_data={
            "source": new_inc.source,
            "amount": new_inc.amount,
            "date": new_inc.date,
            "category_id": new_inc.category_id,
            "project_id": new_inc.project_id
        }
    )
    db.commit()

    return serialize_income(new_inc, db)

@router.put("/{income_id}", response_model=IncomeResponse, dependencies=[Depends(validate_csrf)])
def update_income(
    income_id: str,
    update_data: IncomeUpdate,
    current_user: User = Depends(require_role("EDITOR")),
    db: Session = Depends(get_db)
):
    """Update an existing income record (Editor only)."""
    inc = db.query(Income).filter(
        (Income.id == income_id) | (Income.transaction_id == income_id)
    ).first()
    if not inc:
        raise HTTPException(status_code=404, detail="Income record not found")

    before_data = {
        "source": inc.source,
        "amount": inc.amount,
        "date": inc.date,
        "category_id": inc.category_id,
        "project_id": inc.project_id,
        "notes": inc.notes
    }

    if update_data.date is not None:
        inc.date = update_data.date
    if update_data.source is not None:
        inc.source = update_data.source
    if update_data.category_id is not None:
        inc.category_id = update_data.category_id
    if update_data.amount is not None:
        inc.amount = update_data.amount
    if update_data.payment_method_id is not None:
        inc.payment_method_id = update_data.payment_method_id
    if update_data.received_by is not None:
        inc.received_by = update_data.received_by
    if update_data.reference_number is not None:
        inc.reference_number = update_data.reference_number
    if update_data.notes is not None:
        inc.notes = update_data.notes
    if update_data.project_id is not None:
        inc.project_id = update_data.project_id

    db.flush()  # one transaction with its audit entry (committed below)
    db.refresh(inc)

    after_data = {
        "source": inc.source,
        "amount": inc.amount,
        "date": inc.date,
        "category_id": inc.category_id,
        "project_id": inc.project_id,
        "notes": inc.notes
    }

    record_audit(
        db=db,
        user_id=current_user.id,
        user_name=current_user.name,
        action="UPDATE",
        entity_type="INCOME",
        entity_id=inc.transaction_id,
        before_data=before_data,
        after_data=after_data
    )
    db.commit()

    return serialize_income(inc, db)

@router.post("/{income_id}/cancel", response_model=IncomeResponse, dependencies=[Depends(validate_csrf)])
def cancel_income(
    income_id: str,
    current_user: User = Depends(require_role("EDITOR")),
    db: Session = Depends(get_db)
):
    """Non-destructively cancel/void an income record (Editor only)."""
    inc = db.query(Income).filter(Income.id == income_id).first()
    if not inc:
        raise HTTPException(status_code=404, detail="Income record not found")

    before_status = inc.status
    inc.status = "CANCELLED"
    db.flush()  # one transaction with its audit entry (committed below)
    db.refresh(inc)

    record_audit(
        db=db,
        user_id=current_user.id,
        user_name=current_user.name,
        action="CANCEL",
        entity_type="INCOME",
        entity_id=inc.transaction_id,
        before_data={"status": before_status},
        after_data={"status": "CANCELLED"}
    )
    db.commit()

    return serialize_income(inc, db)
