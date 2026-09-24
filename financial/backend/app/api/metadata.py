"""Metadata endpoints for categories and payment methods."""
from typing import List, Optional
from pydantic import BaseModel
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.user import User
from app.models.category import Category
from app.models.payment_method import PaymentMethod
from app.api.deps import get_current_user

router = APIRouter(prefix="/api/metadata", tags=["Metadata"])

class CategoryItem(BaseModel):
    id: str
    name: str
    type: str
    is_active: bool

    model_config = {"from_attributes": True}

class PaymentMethodItem(BaseModel):
    id: str
    name: str
    is_active: bool

    model_config = {"from_attributes": True}

@router.get("/categories", response_model=List[CategoryItem])
def get_categories(
    type: Optional[str] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """List available transaction categories."""
    query = db.query(Category).filter(Category.is_active == True)
    if type:
        query = query.filter(Category.type == type.upper())
    return query.order_by(Category.name.asc()).all()

@router.get("/payment-methods", response_model=List[PaymentMethodItem])
def get_payment_methods(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """List available payment clearance methods."""
    return db.query(PaymentMethod).filter(PaymentMethod.is_active == True).order_by(PaymentMethod.name.asc()).all()
