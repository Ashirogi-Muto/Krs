"""Dashboard endpoints."""
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.user import User
from app.models.expense import Expense
from app.schemas.dashboard import DashboardResponse
from app.schemas.expense import ExpenseResponse, ExpenseAttachmentItem
from app.api.deps import get_current_user
from app.services.calc_service import calculate_kpis, calculate_monthly_cash_flow, calculate_category_breakdown, is_expense_overdue

router = APIRouter(prefix="/api/dashboard", tags=["Dashboard"])

def serialize_expense(exp: Expense, db: Session) -> ExpenseResponse:
    overdue = is_expense_overdue(exp)
    attachments = []
    for link in exp.category.Base.metadata.tables if False else []:  # placeholder for type checker
        pass
    # Query document links
    from app.models.document import DocumentLink, Document
    doc_links = db.query(DocumentLink).filter(
        DocumentLink.entity_type == "EXPENSE",
        DocumentLink.entity_id == exp.id
    ).all()
    for dl in doc_links:
        d = dl.document
        attachments.append(ExpenseAttachmentItem(
            id=d.id,
            filename=d.filename,
            mime_type=d.mime_type,
            file_size=d.file_size
        ))

    return ExpenseResponse(
        id=exp.id,
        transaction_id=exp.transaction_id,
        bill_date=exp.bill_date,
        description=exp.description,
        category_id=exp.category_id,
        category_name=exp.category.name if exp.category else None,
        vendor=exp.vendor,
        total_amount=exp.total_amount,
        amount_paid=exp.amount_paid,
        amount_pending=exp.amount_pending,
        status=exp.status,
        is_overdue=overdue,
        due_date=exp.due_date,
        payment_date=exp.payment_date,
        payment_method_id=exp.payment_method_id,
        payment_method_name=exp.payment_method.name if exp.payment_method else None,
        reference_number=exp.reference_number,
        notes=exp.notes,
        created_by=exp.created_by,
        created_at=exp.created_at,
        updated_at=exp.updated_at,
        attachments=attachments
    )

@router.get("", response_model=DashboardResponse)
def get_dashboard(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Retrieve full dashboard data including KPIs, cashflow, and expense summaries."""
    kpis = calculate_kpis(db)
    monthly_cash_flow = calculate_monthly_cash_flow(db, months_limit=12)
    category_breakdown = calculate_category_breakdown(db)

    recent_raw = db.query(Expense).filter(
        Expense.status != "CANCELLED"
    ).order_by(Expense.bill_date.desc()).limit(5).all()

    pending_raw = db.query(Expense).filter(
        Expense.status != "CANCELLED",
        Expense.status != "PAID"
    ).order_by(Expense.due_date.asc().nullslast()).all()
    pending_filtered = [e for e in pending_raw if e.amount_pending > 0][:10]

    recent_expenses = [serialize_expense(e, db) for e in recent_raw]
    pending_expenses = [serialize_expense(e, db) for e in pending_filtered]

    return DashboardResponse(
        kpis=kpis,
        monthly_cash_flow=monthly_cash_flow,
        category_breakdown=category_breakdown,
        recent_expenses=recent_expenses,
        pending_expenses=pending_expenses
    )
