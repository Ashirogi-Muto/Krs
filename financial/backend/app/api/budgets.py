"""Budgets and category allocation API router."""
from decimal import Decimal
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.budget import Budget, BudgetItem
from app.models.category import Category
from app.models.project import Project
from app.models.user import User
from app.api.deps import get_current_user, require_editor, validate_csrf
from app.schemas.budget import (
    BudgetCreate,
    BudgetUpdate,
    BudgetResponse,
    BudgetItemCreate,
    BudgetItemResponse
)
from app.services.calc_service import compute_budget_actuals
from app.services.audit_service import record_audit

router = APIRouter(
    prefix="/api/budgets",
    tags=["budgets"]
)

def _build_budget_response(db: Session, budget: Budget) -> BudgetResponse:
    actuals = compute_budget_actuals(db, budget)
    project_name = budget.project.name if budget.project else None

    item_responses = [
        BudgetItemResponse(
            id=it["id"],
            category_id=it["category_id"],
            category_name=it["category_name"],
            allocated_amount=it["allocated_amount"],
            actual_spent=it["actual_spent"],
            remaining=it["remaining"],
            utilization_pct=it["utilization_pct"]
        )
        for it in actuals["items"]
    ]

    return BudgetResponse(
        id=budget.id,
        name=budget.name,
        project_id=budget.project_id,
        project_name=project_name,
        period_start=budget.period_start,
        period_end=budget.period_end,
        total_budget=budget.total_budget,
        status=budget.status,
        actual_spent=actuals["actual_spent"],
        remaining=actuals["remaining"],
        utilization_pct=actuals["utilization_pct"],
        items=item_responses,
        created_at=budget.created_at
    )

@router.get("", response_model=List[BudgetResponse])
def get_budgets(
    status_filter: Optional[str] = Query(None, alias="status"),
    project_id: Optional[str] = Query(None),
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user)
):
    """List all budgets with live actual spend metrics."""
    query = db.query(Budget)
    if status_filter:
        query = query.filter(Budget.status == status_filter.upper())
    if project_id:
        query = query.filter(Budget.project_id == project_id)

    budgets = query.order_by(Budget.period_start.desc()).all()
    return [_build_budget_response(db, b) for b in budgets]

@router.post("", response_model=BudgetResponse, status_code=status.HTTP_201_CREATED, dependencies=[Depends(require_editor), Depends(validate_csrf)])
def create_budget(
    budget_in: BudgetCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Create a new budget and allocate category amounts."""
    if budget_in.period_start > budget_in.period_end:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="period_start cannot be after period_end"
        )

    if budget_in.project_id:
        proj = db.query(Project).filter(Project.id == budget_in.project_id).first()
        if not proj:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Referenced project does not exist.")

    # Validate items sum
    allocated_sum = sum((item.allocated_amount for item in budget_in.items), Decimal("0.00"))
    if allocated_sum > budget_in.total_budget:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Sum of item allocations (₹{allocated_sum}) exceeds total budget (₹{budget_in.total_budget})"
        )

    budget = Budget(
        name=budget_in.name.strip(),
        project_id=budget_in.project_id,
        period_start=budget_in.period_start,
        period_end=budget_in.period_end,
        total_budget=budget_in.total_budget,
        status="ACTIVE",
        created_by=current_user.id
    )
    db.add(budget)
    db.flush()

    for item_in in budget_in.items:
        cat = db.query(Category).filter(Category.id == item_in.category_id).first()
        if not cat:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=f"Category '{item_in.category_id}' does not exist.")
        item = BudgetItem(
            budget_id=budget.id,
            category_id=item_in.category_id,
            allocated_amount=item_in.allocated_amount
        )
        db.add(item)

    db.flush()

    record_audit(
        db=db,
        user_id=current_user.id,
        user_name=current_user.name,
        action="BUDGET_CREATED",
        entity_type="BUDGET",
        entity_id=budget.id,
        before_data=None,
        after_data={
            "name": budget.name,
            "total_budget": float(budget.total_budget),
            "project_id": budget.project_id,
            "items_count": len(budget_in.items)
        }
    )
    db.commit()
    db.refresh(budget)

    return _build_budget_response(db, budget)

@router.get("/{budget_id}", response_model=BudgetResponse)
def get_budget_detail(
    budget_id: str,
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user)
):
    """Retrieve details for a single budget with itemized variance."""
    budget = db.query(Budget).filter(Budget.id == budget_id).first()
    if not budget:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Budget not found.")
    return _build_budget_response(db, budget)

@router.put("/{budget_id}", response_model=BudgetResponse, dependencies=[Depends(require_editor), Depends(validate_csrf)])
def update_budget(
    budget_id: str,
    budget_update: BudgetUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Update budget meta information."""
    budget = db.query(Budget).filter(Budget.id == budget_id).first()
    if not budget:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Budget not found.")

    before_data = {
        "name": budget.name,
        "status": budget.status,
        "total_budget": float(budget.total_budget)
    }

    if budget_update.name is not None:
        budget.name = budget_update.name.strip()
    if budget_update.status is not None:
        budget.status = budget_update.status
    if budget_update.total_budget is not None:
        budget.total_budget = budget_update.total_budget

    record_audit(
        db=db,
        user_id=current_user.id,
        user_name=current_user.name,
        action="BUDGET_UPDATED",
        entity_type="BUDGET",
        entity_id=budget.id,
        before_data=before_data,
        after_data={
            "name": budget.name,
            "status": budget.status,
            "total_budget": float(budget.total_budget)
        }
    )
    db.commit()
    db.refresh(budget)

    return _build_budget_response(db, budget)

@router.post("/{budget_id}/items", response_model=BudgetResponse, dependencies=[Depends(require_editor), Depends(validate_csrf)])
def add_or_update_budget_item(
    budget_id: str,
    item_in: BudgetItemCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Add or update an item allocation inside a budget."""
    budget = db.query(Budget).filter(Budget.id == budget_id).first()
    if not budget:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Budget not found.")

    cat = db.query(Category).filter(Category.id == item_in.category_id).first()
    if not cat:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Referenced category does not exist.")

    existing_item = db.query(BudgetItem).filter(
        BudgetItem.budget_id == budget_id,
        BudgetItem.category_id == item_in.category_id
    ).first()

    if existing_item:
        existing_item.allocated_amount = item_in.allocated_amount
    else:
        new_item = BudgetItem(
            budget_id=budget_id,
            category_id=item_in.category_id,
            allocated_amount=item_in.allocated_amount
        )
        db.add(new_item)

    db.flush()
    record_audit(
        db=db,
        user_id=current_user.id,
        user_name=current_user.name,
        action="BUDGET_ITEM_SAVED",
        entity_type="BUDGET",
        entity_id=budget.id,
        before_data=None,
        after_data={"category_id": item_in.category_id, "allocated_amount": float(item_in.allocated_amount)}
    )
    db.commit()
    db.refresh(budget)
    return _build_budget_response(db, budget)

@router.delete("/{budget_id}/items/{item_id}", response_model=BudgetResponse, dependencies=[Depends(require_editor), Depends(validate_csrf)])
def delete_budget_item(
    budget_id: str,
    item_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Remove an item allocation from a budget."""
    budget = db.query(Budget).filter(Budget.id == budget_id).first()
    if not budget:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Budget not found.")

    item = db.query(BudgetItem).filter(BudgetItem.id == item_id, BudgetItem.budget_id == budget_id).first()
    if not item:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Budget item not found.")

    db.delete(item)
    db.flush()
    record_audit(
        db=db,
        user_id=current_user.id,
        user_name=current_user.name,
        action="BUDGET_ITEM_DELETED",
        entity_type="BUDGET",
        entity_id=budget.id,
        before_data={"item_id": item_id}
    )
    db.commit()
    db.refresh(budget)
    return _build_budget_response(db, budget)

@router.delete("/{budget_id}", status_code=status.HTTP_204_NO_CONTENT, dependencies=[Depends(require_editor), Depends(validate_csrf)])
def delete_budget(
    budget_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Delete a budget and all its item allocations."""
    budget = db.query(Budget).filter(Budget.id == budget_id).first()
    if not budget:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Budget not found.")

    record_audit(
        db=db,
        user_id=current_user.id,
        user_name=current_user.name,
        action="BUDGET_DELETED",
        entity_type="BUDGET",
        entity_id=budget.id,
        before_data={"name": budget.name, "total_budget": float(budget.total_budget)}
    )
    db.delete(budget)
    db.commit()
