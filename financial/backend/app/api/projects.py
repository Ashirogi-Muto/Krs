"""Projects and Events accounting API router."""
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.project import Project
from app.models.income import Income
from app.models.expense import Expense
from app.models.user import User
from app.api.deps import get_current_user, require_editor, validate_csrf
from app.schemas.project import (
    ProjectCreate,
    ProjectUpdate,
    ProjectSummaryResponse,
    ProjectDetailResponse,
    ProjectTransactionItem
)
from app.services.calc_service import compute_project_financials
from app.services.audit_service import record_audit

router = APIRouter(
    prefix="/api/projects",
    tags=["projects"]
)

@router.get("", response_model=List[ProjectSummaryResponse])
def get_projects(
    status_filter: Optional[str] = Query(None, alias="status"),
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user)
):
    """List all projects with calculated live financial metrics."""
    query = db.query(Project)
    if status_filter:
        query = query.filter(Project.status == status_filter.upper())
    
    projects = query.order_by(Project.created_at.desc()).all()
    results = []
    for p in projects:
        financials = compute_project_financials(db, p)
        results.append(
            ProjectSummaryResponse(
                id=p.id,
                name=p.name,
                code=p.code,
                description=p.description,
                start_date=p.start_date,
                end_date=p.end_date,
                status=p.status,
                budget_amount=p.budget_amount,
                total_income=financials["total_income"],
                total_expenses_paid=financials["total_expenses_paid"],
                pending_obligations=financials["pending_obligations"],
                net_cash_flow=financials["net_cash_flow"],
                budget_remaining=financials["budget_remaining"],
                created_at=p.created_at
            )
        )
    return results

@router.post("", response_model=ProjectSummaryResponse, status_code=status.HTTP_201_CREATED, dependencies=[Depends(require_editor), Depends(validate_csrf)])
def create_project(
    project_in: ProjectCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Create a new project or event ledger."""
    code_clean = project_in.code.strip().upper()
    existing = db.query(Project).filter(Project.code == code_clean).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Project code '{code_clean}' already exists."
        )

    project = Project(
        name=project_in.name.strip(),
        code=code_clean,
        description=project_in.description,
        start_date=project_in.start_date,
        end_date=project_in.end_date,
        status=project_in.status,
        budget_amount=project_in.budget_amount,
        created_by=current_user.id
    )
    db.add(project)
    db.flush()

    record_audit(
        db=db,
        user_id=current_user.id,
        user_name=current_user.name,
        action="PROJECT_CREATED",
        entity_type="PROJECT",
        entity_id=project.id,
        before_data=None,
        after_data={
            "name": project.name,
            "code": project.code,
            "status": project.status,
            "budget_amount": float(project.budget_amount) if project.budget_amount is not None else None
        }
    )
    db.commit()
    db.refresh(project)

    financials = compute_project_financials(db, project)
    return ProjectSummaryResponse(
        id=project.id,
        name=project.name,
        code=project.code,
        description=project.description,
        start_date=project.start_date,
        end_date=project.end_date,
        status=project.status,
        budget_amount=project.budget_amount,
        total_income=financials["total_income"],
        total_expenses_paid=financials["total_expenses_paid"],
        pending_obligations=financials["pending_obligations"],
        net_cash_flow=financials["net_cash_flow"],
        budget_remaining=financials["budget_remaining"],
        created_at=project.created_at
    )

@router.get("/{project_id}", response_model=ProjectDetailResponse)
def get_project_detail(
    project_id: str,
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user)
):
    """Retrieve detailed project financials and list of tagged transactions."""
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Project not found.")

    financials = compute_project_financials(db, project)

    incomes = db.query(Income).filter(Income.project_id == project_id).order_by(Income.date.desc()).all()
    expenses = db.query(Expense).filter(Expense.project_id == project_id).order_by(Expense.bill_date.desc()).all()

    income_items = [
        ProjectTransactionItem(
            id=inc.id,
            transaction_id=inc.transaction_id,
            type="INCOME",
            date=inc.date,
            title=inc.source,
            amount=inc.amount,
            status=inc.status
        )
        for inc in incomes
    ]

    expense_items = [
        ProjectTransactionItem(
            id=exp.id,
            transaction_id=exp.transaction_id,
            type="EXPENSE",
            date=exp.bill_date,
            title=exp.vendor,
            amount=exp.total_amount,
            status=exp.status
        )
        for exp in expenses
    ]

    return ProjectDetailResponse(
        id=project.id,
        name=project.name,
        code=project.code,
        description=project.description,
        start_date=project.start_date,
        end_date=project.end_date,
        status=project.status,
        budget_amount=project.budget_amount,
        total_income=financials["total_income"],
        total_expenses_paid=financials["total_expenses_paid"],
        pending_obligations=financials["pending_obligations"],
        net_cash_flow=financials["net_cash_flow"],
        budget_remaining=financials["budget_remaining"],
        created_at=project.created_at,
        incomes=income_items,
        expenses=expense_items
    )

@router.put("/{project_id}", response_model=ProjectSummaryResponse, dependencies=[Depends(require_editor), Depends(validate_csrf)])
def update_project(
    project_id: str,
    project_update: ProjectUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Update project details or status."""
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Project not found.")

    before_data = {
        "name": project.name,
        "status": project.status,
        "budget_amount": float(project.budget_amount) if project.budget_amount is not None else None
    }

    if project_update.name is not None:
        project.name = project_update.name.strip()
    if project_update.description is not None:
        project.description = project_update.description
    if project_update.start_date is not None:
        project.start_date = project_update.start_date
    if project_update.end_date is not None:
        project.end_date = project_update.end_date
    if project_update.status is not None:
        project.status = project_update.status
    if project_update.budget_amount is not None:
        project.budget_amount = project_update.budget_amount

    record_audit(
        db=db,
        user_id=current_user.id,
        user_name=current_user.name,
        action="PROJECT_UPDATED",
        entity_type="PROJECT",
        entity_id=project.id,
        before_data=before_data,
        after_data={
            "name": project.name,
            "status": project.status,
            "budget_amount": float(project.budget_amount) if project.budget_amount is not None else None
        }
    )
    db.commit()
    db.refresh(project)

    financials = compute_project_financials(db, project)
    return ProjectSummaryResponse(
        id=project.id,
        name=project.name,
        code=project.code,
        description=project.description,
        start_date=project.start_date,
        end_date=project.end_date,
        status=project.status,
        budget_amount=project.budget_amount,
        total_income=financials["total_income"],
        total_expenses_paid=financials["total_expenses_paid"],
        pending_obligations=financials["pending_obligations"],
        net_cash_flow=financials["net_cash_flow"],
        budget_remaining=financials["budget_remaining"],
        created_at=project.created_at
    )

@router.delete("/{project_id}", status_code=status.HTTP_204_NO_CONTENT, dependencies=[Depends(require_editor), Depends(validate_csrf)])
def delete_project(
    project_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Delete a project only if it has no associated income or expense transactions."""
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Project not found.")

    has_income = db.query(Income).filter(Income.project_id == project_id).first()
    has_expense = db.query(Expense).filter(Expense.project_id == project_id).first()
    if has_income or has_expense:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot delete project that is associated with existing income or expense transactions."
        )

    record_audit(
        db=db,
        user_id=current_user.id,
        user_name=current_user.name,
        action="PROJECT_DELETED",
        entity_type="PROJECT",
        entity_id=project.id,
        before_data={"code": project.code, "name": project.name}
    )
    db.delete(project)
    db.commit()
