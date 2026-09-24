"""Expense payment clearance history model."""
import uuid
from datetime import datetime, timezone
from decimal import Decimal
from sqlalchemy import Column, String, Numeric, Date, DateTime, ForeignKey, Text
from sqlalchemy.orm import relationship
from app.database import Base

class ExpensePayment(Base):
    __tablename__ = "expense_payments"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    expense_id = Column(String(36), ForeignKey("expenses.id", ondelete="CASCADE"), index=True, nullable=False)
    amount = Column(Numeric(12, 2), nullable=False)
    payment_date = Column(Date, index=True, nullable=False)
    payment_method_id = Column(String(36), ForeignKey("payment_methods.id"), nullable=True)
    reference_number = Column(String(100), nullable=True)
    notes = Column(Text, nullable=True)
    created_by = Column(String(36), ForeignKey("users.id"), nullable=False)
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False)
    updated_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc), nullable=False)

    expense = relationship("Expense", back_populates="payments")
    payment_method = relationship("PaymentMethod")
    creator = relationship("User")
