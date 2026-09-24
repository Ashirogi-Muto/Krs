"""Budget and itemized allocation schemas."""
from datetime import date, datetime
from decimal import Decimal
from typing import Optional, List, Literal
from pydantic import BaseModel, Field

class BudgetItemCreate(BaseModel):
    category_id: str
    allocated_amount: Decimal = Field(..., ge=Decimal("0.00"), max_digits=12, decimal_places=2)

class BudgetItemResponse(BaseModel):
    id: str
    category_id: str
    category_name: Optional[str] = None
    allocated_amount: Decimal
    actual_spent: Decimal
    remaining: Decimal
    utilization_pct: float

    model_config = {"from_attributes": True}

class BudgetCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=150)
    project_id: Optional[str] = None
    period_start: date
    period_end: date
    total_budget: Decimal = Field(..., gt=Decimal("0.00"), max_digits=12, decimal_places=2)
    items: List[BudgetItemCreate] = []

class BudgetUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=150)
    status: Optional[Literal["DRAFT", "ACTIVE", "CLOSED", "CANCELLED"]] = None
    total_budget: Optional[Decimal] = Field(None, gt=Decimal("0.00"), max_digits=12, decimal_places=2)

class BudgetResponse(BaseModel):
    id: str
    name: str
    project_id: Optional[str] = None
    project_name: Optional[str] = None
    period_start: date
    period_end: date
    total_budget: Decimal
    status: str
    actual_spent: Decimal
    remaining: Decimal
    utilization_pct: float
    items: List[BudgetItemResponse] = []
    created_at: datetime

    model_config = {"from_attributes": True}
