"""Append-only audit log model."""
import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, DateTime, ForeignKey, JSON
from app.database import Base

class AuditLog(Base):
    __tablename__ = "audit_logs"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String(36), ForeignKey("users.id"), nullable=True)
    user_name = Column(String(100), nullable=False)
    action = Column(String(50), nullable=False)  # "CREATE", "UPDATE", "PAYMENT", "CANCEL", "UPLOAD_DOC", "DELETE_DOC"
    entity_type = Column(String(50), nullable=False)  # "INCOME", "EXPENSE", "DOCUMENT"
    entity_id = Column(String(100), index=True, nullable=False)
    before_data = Column(JSON, nullable=True)
    after_data = Column(JSON, nullable=True)
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), index=True, nullable=False)
