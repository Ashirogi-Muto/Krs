"""Read-only audit log endpoint (Append-only immutability enforced)."""
from typing import List, Optional
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.user import User
from app.models.audit_log import AuditLog
from app.schemas.audit import AuditLogResponse
from app.api.deps import get_current_user

router = APIRouter(prefix="/api/audit-logs", tags=["Audit Trail"])

@router.get("", response_model=List[AuditLogResponse])
def get_audit_logs(
    limit: int = Query(50, ge=1, le=200),
    offset: int = Query(0, ge=0),
    entity_type: Optional[str] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Retrieve immutable audit history (Read-only; No PUT/PATCH/DELETE exists)."""
    query = db.query(AuditLog)
    if entity_type:
        query = query.filter(AuditLog.entity_type == entity_type.upper())
    logs = query.order_by(AuditLog.created_at.desc()).offset(offset).limit(limit).all()
    return logs
