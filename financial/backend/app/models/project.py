"""Project/Event dimensional accounting model."""
import uuid
from datetime import datetime, timezone
from decimal import Decimal
from sqlalchemy import Column, String, Numeric, Date, DateTime, ForeignKey, Text
from sqlalchemy.orm import relationship
from app.database import Base

class Project(Base):
    __tablename__ = "projects"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    name = Column(String(150), nullable=False)
    code = Column(String(30), unique=True, index=True, nullable=False)  # e.g. "HACK26"
    description = Column(Text, nullable=True)
    start_date = Column(Date, nullable=True)
    end_date = Column(Date, nullable=True)
    status = Column(String(20), default="PLANNED", index=True, nullable=False)  # "PLANNED", "ACTIVE", "COMPLETED", "CANCELLED"
    budget_amount = Column(Numeric(12, 2), nullable=True)
    created_by = Column(String(36), ForeignKey("users.id"), nullable=False)
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False)
    updated_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc), nullable=False)

    creator = relationship("User")
    incomes = relationship("Income", back_populates="project")
    expenses = relationship("Expense", back_populates="project")
    budgets = relationship("Budget", back_populates="project")
