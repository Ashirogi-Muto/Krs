"""Controlled data import API router (Admin only)."""
from fastapi import APIRouter, Depends, UploadFile, File, HTTPException, status
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.user import User
from app.api.deps import require_admin, validate_csrf
from app.schemas.import_data import ImportPreviewResponse, ImportConfirmRequest, ImportResultResponse
from app.services.import_service import preview_import_file, commit_staged_import

router = APIRouter(
    prefix="/api/import",
    tags=["import"],
    dependencies=[Depends(require_admin), Depends(validate_csrf)]
)

@router.post("/preview", response_model=ImportPreviewResponse)
async def preview_file(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    admin: User = Depends(require_admin)
):
    """Upload and dry-run validate an XLSX/CSV spreadsheet without committing changes."""
    content = await file.read()
    if not content:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Uploaded file is empty."
        )
    return preview_import_file(file_bytes=content, filename=file.filename or "import.xlsx", db=db)

@router.post("/commit", response_model=ImportResultResponse)
def commit_import(
    confirm_in: ImportConfirmRequest,
    db: Session = Depends(get_db),
    admin: User = Depends(require_admin)
):
    """Commit previously staged and validated data rows into the database atomically."""
    return commit_staged_import(
        import_key=confirm_in.import_key,
        duplicate_action=confirm_in.duplicate_action,
        admin_user=admin,
        db=db
    )
