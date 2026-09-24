"""Expense and bill payment schemas."""
from datetime import date, datetime
from decimal import Decimal
from typing import Optional, List
from pydantic import BaseModel, Field, field_validator, model_validator
from app.schemas.payment import ExpensePaymentResponse

class ExpenseCreate(BaseModel):
    bill_date: date
    description: str = Field(..., min_length=1, max_length=255)
    category_id: str
    vendor: str = Field(..., min_length=1, max_length=200)
    total_amount: Decimal = Field(..., gt=Decimal("0.00"), max_digits=12, decimal_places=2)
    amount_paid: Decimal = Field(default=Decimal("0.00"), ge=Decimal("0.00"), max_digits=12, decimal_places=2)
    due_date: Optional[date] = None
    payment_date: Optional[date] = None
    payment_method_id: Optional[str] = None
    reference_number: Optional[str] = Field(None, max_length=100)
    notes: Optional[str] = None
    project_id: Optional[str] = None

    @field_validator("description", "vendor")
    @classmethod
    def strip_text(cls, v: str) -> str:
        s = v.strip()
        if not s:
            raise ValueError("Field cannot be empty or whitespace only")
        return s

    @model_validator(mode="after")
    def validate_amounts(self):
        if self.amount_paid > self.total_amount:
            raise ValueError(f"Amount paid (₹{self.amount_paid}) cannot exceed total bill amount (₹{self.total_amount})")
        return self

class ExpenseUpdate(BaseModel):
    bill_date: Optional[date] = None
    description: Optional[str] = Field(None, min_length=1, max_length=255)
    category_id: Optional[str] = None
    vendor: Optional[str] = Field(None, min_length=1, max_length=200)
    total_amount: Optional[Decimal] = Field(None, gt=Decimal("0.00"), max_digits=12, decimal_places=2)
    amount_paid: Optional[Decimal] = Field(None, ge=Decimal("0.00"), max_digits=12, decimal_places=2)
    due_date: Optional[date] = None
    payment_date: Optional[date] = None
    payment_method_id: Optional[str] = None
    reference_number: Optional[str] = None
    notes: Optional[str] = None
    project_id: Optional[str] = None

class PaymentRecordRequest(BaseModel):
    payment_amount: Decimal = Field(..., gt=Decimal("0.00"), max_digits=12, decimal_places=2)
    payment_date: date
    payment_method_id: str
    reference_number: Optional[str] = Field(None, max_length=100)
    notes: Optional[str] = None

class ExpenseAttachmentItem(BaseModel):
    id: str
    filename: str
    mime_type: str
    file_size: int
    document_type: Optional[str] = "OTHER"

class ExpenseResponse(BaseModel):
    id: str
    transaction_id: str
    bill_date: date
    description: str
    category_id: str
    category_name: Optional[str] = None
    vendor: str
    total_amount: Decimal
    amount_paid: Decimal
    amount_pending: Decimal
    status: str
    is_overdue: bool
    due_date: Optional[date] = None
    payment_date: Optional[date] = None
    payment_method_id: Optional[str] = None
    payment_method_name: Optional[str] = None
    reference_number: Optional[str] = None
    notes: Optional[str] = None
    project_id: Optional[str] = None
    project_name: Optional[str] = None
    created_by: str
    created_at: datetime
    updated_at: datetime
    attachments: List[ExpenseAttachmentItem] = []
    payments: List[ExpensePaymentResponse] = []

    model_config = {"from_attributes": True}
