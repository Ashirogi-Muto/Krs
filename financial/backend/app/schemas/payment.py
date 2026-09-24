"""Payment clearance and payment history schemas."""
from datetime import date, datetime
from decimal import Decimal
from typing import Optional
from pydantic import BaseModel, Field

class ExpensePaymentCreate(BaseModel):
    amount: Decimal = Field(..., gt=Decimal("0.00"), max_digits=12, decimal_places=2)
    payment_date: date
    payment_method_id: Optional[str] = None
    reference_number: Optional[str] = Field(None, max_length=100)
    notes: Optional[str] = None

class ExpensePaymentResponse(BaseModel):
    id: str
    expense_id: str
    amount: Decimal
    payment_date: date
    payment_method_id: Optional[str] = None
    payment_method_name: Optional[str] = None
    reference_number: Optional[str] = None
    notes: Optional[str] = None
    created_by: str
    creator_name: Optional[str] = None
    created_at: datetime

    model_config = {"from_attributes": True}
