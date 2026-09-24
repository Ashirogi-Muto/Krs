"""Append-only audit trail logging service."""
from datetime import date, datetime
from decimal import Decimal
from typing import Optional, Any, Dict
from sqlalchemy.orm import Session
from app.models.audit_log import AuditLog

def sanitize_for_audit_json(data: Any) -> Any:
    """Recursively convert Decimals, dates, and UUIDs to JSON-serializable values."""
    if isinstance(data, dict):
        return {k: sanitize_for_audit_json(v) for k, v in data.items() if not k.startswith("_")}
    elif isinstance(data, list):
        return [sanitize_for_audit_json(v) for v in data]
    elif isinstance(data, Decimal):
        return float(data)
    elif isinstance(data, (date, datetime)):
        return data.isoformat()
    return data

def record_audit(
    db: Session,
    user_id: Optional[str],
    user_name: str,
    action: str,
    entity_type: str,
    entity_id: str,
    before_data: Optional[Dict[str, Any]] = None,
    after_data: Optional[Dict[str, Any]] = None
) -> AuditLog:
    """Create an immutable append-only audit record."""
    clean_before = sanitize_for_audit_json(before_data) if before_data else None
    clean_after = sanitize_for_audit_json(after_data) if after_data else None

    entry = AuditLog(
        user_id=user_id,
        user_name=user_name,
        action=action,
        entity_type=entity_type,
        entity_id=str(entity_id),
        before_data=clean_before,
        after_data=clean_after
    )
    db.add(entry)
    db.flush()
    return entry
