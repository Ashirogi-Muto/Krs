"""Expense transaction model."""
import uuid
from datetime import datetime, timezone
from decimal import Decimal
from sqlalchemy import Column, String, Numeric, Date, DateTime, ForeignKey, Text
from sqlalchemy.orm import relationship
from app.database import Base

class Expense(Base):
    __tablename__ = "expenses"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    transaction_id = Column(String(30), unique=True, index=True, nullable=False)
    bill_date = Column(Date, index=True, nullable=False)
    description = Column(String(255), nullable=False)
    category_id = Column(String(36), ForeignKey("categories.id"), index=True, nullable=False)
    vendor = Column(String(200), index=True, nullable=False)
    total_amount = Column(Numeric(12, 2), nullable=False)
    amount_paid = Column(Numeric(12, 2), default=Decimal("0.00"), nullable=False)
    status = Column(String(20), default="PENDING", index=True, nullable=False)  # "PENDING", "PARTIALLY_PAID", "PAID", "CANCELLED"
    due_date = Column(Date, index=True, nullable=True)
    payment_date = Column(Date, nullable=True)
    payment_method_id = Column(String(36), ForeignKey("payment_methods.id"), nullable=True)
    reference_number = Column(String(100), nullable=True)
    notes = Column(Text, nullable=True)
    project_id = Column(String(36), ForeignKey("projects.id"), index=True, nullable=True)
    created_by = Column(String(36), ForeignKey("users.id"), nullable=False)
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False)
    updated_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc), nullable=False)

    category = relationship("Category")
    payment_method = relationship("PaymentMethod")
    creator = relationship("User")
    project = relationship("Project", back_populates="expenses")
    payments = relationship("ExpensePayment", back_populates="expense", cascade="all, delete-orphan", order_by="ExpensePayment.payment_date.desc()")

    @property
    def amount_pending(self) -> Decimal:
        """Derived pending obligation (total_amount - amount_paid)."""
        tot = Decimal(str(self.total_amount)) if self.total_amount is not None else Decimal("0.00")
        paid = Decimal(str(self.amount_paid)) if self.amount_paid is not None else Decimal("0.00")
        return max(Decimal("0.00"), tot - paid)
