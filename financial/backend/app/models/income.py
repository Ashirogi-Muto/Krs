"""Income transaction model."""
import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, Numeric, Date, DateTime, ForeignKey, Text
from sqlalchemy.orm import relationship
from app.database import Base

class Income(Base):
    __tablename__ = "income"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    transaction_id = Column(String(30), unique=True, index=True, nullable=False)
    date = Column(Date, index=True, nullable=False)
    source = Column(String(200), index=True, nullable=False)
    category_id = Column(String(36), ForeignKey("categories.id"), index=True, nullable=False)
    amount = Column(Numeric(12, 2), nullable=False)
    payment_method_id = Column(String(36), ForeignKey("payment_methods.id"), nullable=False)
    received_by = Column(String(100), nullable=False)
    reference_number = Column(String(100), nullable=True)
    notes = Column(Text, nullable=True)
    project_id = Column(String(36), ForeignKey("projects.id"), index=True, nullable=True)
    status = Column(String(20), default="CLEARED", index=True, nullable=False)  # "CLEARED", "CANCELLED"
    created_by = Column(String(36), ForeignKey("users.id"), nullable=False)
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False)
    updated_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc), nullable=False)

    category = relationship("Category")
    payment_method = relationship("PaymentMethod")
    creator = relationship("User")
    project = relationship("Project", back_populates="incomes")
