"""Income schemas."""
from datetime import date, datetime
from decimal import Decimal
from typing import Optional, List
from pydantic import BaseModel, Field, field_validator

class IncomeCreate(BaseModel):
    date: date
    source: str = Field(..., min_length=1, max_length=200)
    category_id: str
    amount: Decimal = Field(..., gt=Decimal("0.00"), max_digits=12, decimal_places=2)
    payment_method_id: str
    received_by: str = Field(..., min_length=1, max_length=100)
    reference_number: Optional[str] = Field(None, max_length=100)
    notes: Optional[str] = None
    project_id: Optional[str] = None

    @field_validator("source", "received_by")
    @classmethod
    def strip_text(cls, v: str) -> str:
        s = v.strip()
        if not s:
            raise ValueError("Field cannot be empty or whitespace only")
        return s

class IncomeUpdate(BaseModel):
    date: Optional[date] = None
    source: Optional[str] = Field(None, min_length=1, max_length=200)
    category_id: Optional[str] = None
    amount: Optional[Decimal] = Field(None, gt=Decimal("0.00"), max_digits=12, decimal_places=2)
    payment_method_id: Optional[str] = None
    received_by: Optional[str] = Field(None, min_length=1, max_length=100)
    reference_number: Optional[str] = None
    notes: Optional[str] = None
    project_id: Optional[str] = None

class IncomeAttachmentItem(BaseModel):
    id: str
    filename: str
    mime_type: str
    file_size: int
    document_type: Optional[str] = "OTHER"

class IncomeResponse(BaseModel):
    id: str
    transaction_id: str
    date: date
    source: str
    category_id: str
    category_name: Optional[str] = None
    amount: Decimal
    payment_method_id: str
    payment_method_name: Optional[str] = None
    received_by: str
    reference_number: Optional[str] = None
    notes: Optional[str] = None
    project_id: Optional[str] = None
    project_name: Optional[str] = None
    status: str
    created_by: str
    created_at: datetime
    updated_at: datetime
    attachments: List[IncomeAttachmentItem] = []

    model_config = {"from_attributes": True}
