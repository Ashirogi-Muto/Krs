"""In-app notifications model."""
import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, Boolean, DateTime, ForeignKey, Text
from sqlalchemy.orm import relationship
from app.database import Base

class Notification(Base):
    __tablename__ = "notifications"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), index=True, nullable=False)
    type = Column(String(30), nullable=False)  # "OVERDUE_BILL", "DUE_SOON", "PAYMENT_RECORDED", "TRANSACTION_UPDATED", "SYSTEM"
    title = Column(String(150), nullable=False)
    message = Column(Text, nullable=False)
    entity_type = Column(String(30), nullable=True)  # "EXPENSE", "INCOME", "PROJECT", "BUDGET"
    entity_id = Column(String(100), nullable=True)
    is_read = Column(Boolean, default=False, index=True, nullable=False)
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False)

    user = relationship("User")
