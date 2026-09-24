"""Budget and itemized category allocation models."""
import uuid
from datetime import datetime, timezone
from decimal import Decimal
from sqlalchemy import Column, String, Numeric, Date, DateTime, ForeignKey, Text
from sqlalchemy.orm import relationship
from app.database import Base

class Budget(Base):
    __tablename__ = "budgets"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    name = Column(String(150), nullable=False)
    project_id = Column(String(36), ForeignKey("projects.id"), index=True, nullable=True)
    period_start = Column(Date, nullable=False)
    period_end = Column(Date, nullable=False)
    total_budget = Column(Numeric(12, 2), nullable=False)
    status = Column(String(20), default="ACTIVE", index=True, nullable=False)  # "DRAFT", "ACTIVE", "CLOSED", "CANCELLED"
    created_by = Column(String(36), ForeignKey("users.id"), nullable=False)
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False)
    updated_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc), nullable=False)

    project = relationship("Project", back_populates="budgets")
    creator = relationship("User")
    items = relationship("BudgetItem", back_populates="budget", cascade="all, delete-orphan")

class BudgetItem(Base):
    __tablename__ = "budget_items"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    budget_id = Column(String(36), ForeignKey("budgets.id", ondelete="CASCADE"), index=True, nullable=False)
    category_id = Column(String(36), ForeignKey("categories.id"), index=True, nullable=False)
    allocated_amount = Column(Numeric(12, 2), nullable=False)

    budget = relationship("Budget", back_populates="items")
    category = relationship("Category")
