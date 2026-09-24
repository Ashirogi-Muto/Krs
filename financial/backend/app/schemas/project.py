"""Project and event accounting schemas."""
from datetime import date, datetime
from decimal import Decimal
from typing import Optional, List, Literal
from pydantic import BaseModel, Field, field_validator

class ProjectCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=150)
    code: str = Field(..., min_length=2, max_length=30)
    description: Optional[str] = None
    start_date: Optional[date] = None
    end_date: Optional[date] = None
    status: Literal["PLANNED", "ACTIVE", "COMPLETED", "CANCELLED"] = "PLANNED"
    budget_amount: Optional[Decimal] = Field(None, ge=Decimal("0.00"), max_digits=12, decimal_places=2)

    @field_validator("name", "code")
    @classmethod
    def clean_strings(cls, v: str) -> str:
        s = v.strip()
        if not s:
            raise ValueError("Field cannot be empty")
        return s.upper() if len(v) <= 30 and not " " in v else s

class ProjectUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=150)
    description: Optional[str] = None
    start_date: Optional[date] = None
    end_date: Optional[date] = None
    status: Optional[Literal["PLANNED", "ACTIVE", "COMPLETED", "CANCELLED"]] = None
    budget_amount: Optional[Decimal] = Field(None, ge=Decimal("0.00"), max_digits=12, decimal_places=2)

class ProjectSummaryResponse(BaseModel):
    id: str
    name: str
    code: str
    description: Optional[str] = None
    start_date: Optional[date] = None
    end_date: Optional[date] = None
    status: str
    budget_amount: Optional[Decimal] = None
    total_income: Decimal
    total_expenses_paid: Decimal
    pending_obligations: Decimal
    net_cash_flow: Decimal
    budget_remaining: Optional[Decimal] = None
    created_at: datetime

    model_config = {"from_attributes": True}

class ProjectTransactionItem(BaseModel):
    id: str
    transaction_id: str
    type: str  # "INCOME" or "EXPENSE"
    date: date
    title: str
    amount: Decimal
    status: str

class ProjectDetailResponse(ProjectSummaryResponse):
    incomes: List[ProjectTransactionItem] = []
    expenses: List[ProjectTransactionItem] = []
