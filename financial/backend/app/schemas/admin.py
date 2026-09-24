"""Admin schemas for user, category, and payment method management."""
from datetime import datetime
from typing import Optional, Literal
import re
from pydantic import BaseModel, Field, field_validator

class UserCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=100)
    email: str = Field(..., min_length=5, max_length=255)
    role: Literal["VIEWER", "EDITOR", "ADMIN"]
    password: str = Field(..., min_length=8, max_length=128)

    @field_validator("email")
    @classmethod
    def validate_email(cls, v: str) -> str:
        s = v.strip().lower()
        if not re.match(r"^[^@\s]+@[^@\s]+\.[^@\s]+$", s):
            raise ValueError("Invalid email address format")
        return s

    @field_validator("name")
    @classmethod
    def strip_name(cls, v: str) -> str:
        s = v.strip()
        if not s:
            raise ValueError("Name cannot be empty")
        return s

class UserUpdateRole(BaseModel):
    role: Literal["VIEWER", "EDITOR", "ADMIN"]

class UserUpdateStatus(BaseModel):
    is_active: bool

class UserResetPassword(BaseModel):
    new_password: str = Field(..., min_length=8, max_length=128)

class UserListItem(BaseModel):
    id: str
    name: str
    email: str
    role: str
    is_active: bool
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}

class CategoryCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=100)
    type: Literal["INCOME", "EXPENSE"]

class CategoryStatusUpdate(BaseModel):
    is_active: bool

class CategoryResponse(BaseModel):
    id: str
    name: str
    type: str
    is_active: bool

    model_config = {"from_attributes": True}

class PaymentMethodCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=50)

class PaymentMethodStatusUpdate(BaseModel):
    is_active: bool

class PaymentMethodResponse(BaseModel):
    id: str
    name: str
    is_active: bool

    model_config = {"from_attributes": True}
