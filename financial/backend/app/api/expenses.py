"""Consolidated Expense & Bill management endpoints."""
from datetime import date
from decimal import Decimal
from typing import Optional, List
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.user import User
from app.models.expense import Expense
from app.models.expense_payment import ExpensePayment
from app.models.document import DocumentLink
from app.schemas.expense import ExpenseCreate, ExpenseUpdate, PaymentRecordRequest, ExpenseResponse, ExpenseAttachmentItem
from app.schemas.payment import ExpensePaymentResponse
from app.api.deps import get_current_user, require_role, validate_csrf
from app.services.calc_service import is_expense_overdue, derive_expense_status
from app.services.audit_service import record_audit
from app.services.payment_service import record_expense_payment

router = APIRouter(prefix="/api/expenses", tags=["Expenses"])

def generate_expense_transaction_id(db: Session) -> str:
    """Generate the next unique business transaction ID (e.g. EXP-001)."""
    existing = db.query(Expense.transaction_id).filter(
        Expense.transaction_id.like("EXP-%")
    ).all()
    max_num = 0
    for (tx_id,) in existing:
        try:
            num = int(tx_id.split("-")[1])
            if num > max_num:
                max_num = num
        except (IndexError, ValueError):
            pass
    return f"EXP-{max_num + 1:03d}"

def serialize_expense_item(exp: Expense, db: Session) -> ExpenseResponse:
    overdue = is_expense_overdue(exp)
    doc_links = db.query(DocumentLink).filter(
        DocumentLink.entity_type == "EXPENSE",
        DocumentLink.entity_id == exp.id
    ).all()
    attachments = [
        ExpenseAttachmentItem(
            id=dl.document.id,
            filename=dl.document.filename,
            mime_type=dl.document.mime_type,
            file_size=dl.document.file_size,
            document_type=getattr(dl.document, "document_type", "OTHER") or "OTHER"
        )
        for dl in doc_links
        if dl.document
    ]

    payments = [
        ExpensePaymentResponse(
            id=p.id,
            expense_id=p.expense_id,
            amount=p.amount,
            payment_date=p.payment_date,
            payment_method_id=p.payment_method_id,
            payment_method_name=p.payment_method.name if p.payment_method else None,
            reference_number=p.reference_number,
            notes=p.notes,
            created_by=p.created_by,
            creator_name=p.creator.name if p.creator else None,
            created_at=p.created_at
        )
        for p in exp.payments
    ] if hasattr(exp, "payments") and exp.payments else []

    project_name = exp.project.name if exp.project else None

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
        project_id=exp.project_id,
        project_name=project_name,
        created_by=exp.created_by,
        created_at=exp.created_at,
        updated_at=exp.updated_at,
        attachments=attachments,
        payments=payments
    )

@router.get("", response_model=List[ExpenseResponse])
def list_expenses(
    month: Optional[str] = Query(None, description="Filter by YYYY-MM"),
    category_id: Optional[str] = None,
    payment_method_id: Optional[str] = None,
    status_filter: Optional[str] = Query(None, alias="status"),
    search: Optional[str] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """List all expenses/bills with rich filtering (Shared KRS Ledger)."""
    query = db.query(Expense)

    if month:
        try:
            year, m_num = map(int, month.split("-"))
            start_dt = date(year, m_num, 1)
            end_dt = date(year + 1, 1, 1) if m_num == 12 else date(year, m_num + 1, 1)
            query = query.filter(Expense.bill_date >= start_dt, Expense.bill_date < end_dt)
        except Exception:
            pass

    if category_id:
        query = query.filter(Expense.category_id == category_id)
    if payment_method_id:
        query = query.filter(Expense.payment_method_id == payment_method_id)
    
    if status_filter:
        s_upper = status_filter.upper()
        if s_upper == "OVERDUE":
            # Dynamic filter for overdue
            today = date.today()
            query = query.filter(
                Expense.status.notin_(["PAID", "CANCELLED"]),
                Expense.due_date.isnot(None),
                Expense.due_date < today,
                (Expense.total_amount - Expense.amount_paid) > 0
            )
        elif s_upper == "PENDING":
            # Include PENDING and PARTIALLY_PAID that still have pending amounts
            query = query.filter(
                Expense.status.in_(["PENDING", "PARTIALLY_PAID"]),
                (Expense.total_amount - Expense.amount_paid) > 0
            )
        else:
            query = query.filter(Expense.status == s_upper)

    if search:
        s = f"%{search.strip()}%"
        query = query.filter(
            (Expense.description.ilike(s)) |
            (Expense.vendor.ilike(s)) |
            (Expense.transaction_id.ilike(s)) |
            (Expense.reference_number.ilike(s)) |
            (Expense.notes.ilike(s))
        )

    records = query.order_by(Expense.bill_date.desc()).all()
    return [serialize_expense_item(r, db) for r in records]

@router.get("/{expense_id}", response_model=ExpenseResponse)
def get_expense_detail(
    expense_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Retrieve detailed expense information including payment history and attachments."""
    exp = db.query(Expense).filter(
        (Expense.id == expense_id) | (Expense.transaction_id == expense_id)
    ).first()
    if not exp:
        raise HTTPException(status_code=404, detail="Expense record not found")
    return serialize_expense_item(exp, db)

@router.post("", response_model=ExpenseResponse, status_code=status.HTTP_201_CREATED, dependencies=[Depends(validate_csrf)])
def create_expense(
    expense_data: ExpenseCreate,
    current_user: User = Depends(require_role("EDITOR")),
    db: Session = Depends(get_db)
):
    """Create a new expense or bill entry (Editor only)."""
    tx_id = generate_expense_transaction_id(db)
    computed_status = derive_expense_status(expense_data.total_amount, expense_data.amount_paid)

    new_exp = Expense(
        transaction_id=tx_id,
        bill_date=expense_data.bill_date,
        description=expense_data.description,
        category_id=expense_data.category_id,
        vendor=expense_data.vendor,
        total_amount=expense_data.total_amount,
        amount_paid=expense_data.amount_paid,
        status=computed_status,
        due_date=expense_data.due_date,
        payment_date=expense_data.payment_date,
        payment_method_id=expense_data.payment_method_id,
        reference_number=expense_data.reference_number,
        notes=expense_data.notes,
        project_id=expense_data.project_id,
        created_by=current_user.id
    )
    db.add(new_exp)
    db.flush()

    # If initial payment made, record in canonical payment history
    if expense_data.amount_paid > Decimal("0.00"):
        init_pmt = ExpensePayment(
            expense_id=new_exp.id,
            amount=expense_data.amount_paid,
            payment_date=expense_data.payment_date or expense_data.bill_date,
            payment_method_id=expense_data.payment_method_id,
            reference_number=expense_data.reference_number,
            notes="Initial bill clearance",
            created_by=current_user.id
        )
        db.add(init_pmt)

    db.flush()  # one transaction with its audit entry (committed below)
    db.refresh(new_exp)

    record_audit(
        db=db,
        user_id=current_user.id,
        user_name=current_user.name,
        action="CREATE",
        entity_type="EXPENSE",
        entity_id=new_exp.transaction_id,
        after_data={
            "description": new_exp.description,
            "vendor": new_exp.vendor,
            "total_amount": new_exp.total_amount,
            "amount_paid": new_exp.amount_paid,
            "project_id": new_exp.project_id,
            "status": new_exp.status
        }
    )
    db.commit()

    return serialize_expense_item(new_exp, db)

@router.put("/{expense_id}", response_model=ExpenseResponse, dependencies=[Depends(validate_csrf)])
def update_expense(
    expense_id: str,
    update_data: ExpenseUpdate,
    current_user: User = Depends(require_role("EDITOR")),
    db: Session = Depends(get_db)
):
    """Update an existing expense (Editor only)."""
    exp = db.query(Expense).filter((Expense.id == expense_id) | (Expense.transaction_id == expense_id)).first()
    if not exp:
        raise HTTPException(status_code=404, detail="Expense record not found")

    # The paid amount only changes through "Record payment" (keeps the payment history); the bill total can't go
    # below what has already been paid.
    new_tot = update_data.total_amount if update_data.total_amount is not None else exp.total_amount
    if exp.amount_paid > new_tot:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=f"Total amount (₹{new_tot}) cannot be less than what is already paid (₹{exp.amount_paid})"
        )

    before_data = {
        "description": exp.description,
        "vendor": exp.vendor,
        "total_amount": exp.total_amount,
        "amount_paid": exp.amount_paid,
        "project_id": exp.project_id,
        "status": exp.status
    }

    if update_data.bill_date is not None:
        exp.bill_date = update_data.bill_date
    if update_data.description is not None:
        exp.description = update_data.description
    if update_data.category_id is not None:
        exp.category_id = update_data.category_id
    if update_data.vendor is not None:
        exp.vendor = update_data.vendor
    if update_data.total_amount is not None:
        exp.total_amount = update_data.total_amount
    if update_data.due_date is not None:
        exp.due_date = update_data.due_date
    if update_data.payment_date is not None:
        exp.payment_date = update_data.payment_date
    if update_data.payment_method_id is not None:
        exp.payment_method_id = update_data.payment_method_id
    if update_data.reference_number is not None:
        exp.reference_number = update_data.reference_number
    if update_data.notes is not None:
        exp.notes = update_data.notes
    if update_data.project_id is not None:
        exp.project_id = update_data.project_id

    # Re-derive status if not explicitly cancelled
    if exp.status != "CANCELLED":
        exp.status = derive_expense_status(exp.total_amount, exp.amount_paid, exp.status)

    db.flush()  # one transaction with its audit entry (committed below)
    db.refresh(exp)

    after_data = {
        "description": exp.description,
        "vendor": exp.vendor,
        "total_amount": exp.total_amount,
        "amount_paid": exp.amount_paid,
        "project_id": exp.project_id,
        "status": exp.status
    }

    record_audit(
        db=db,
        user_id=current_user.id,
        user_name=current_user.name,
        action="UPDATE",
        entity_type="EXPENSE",
        entity_id=exp.transaction_id,
        before_data=before_data,
        after_data=after_data
    )
    db.commit()

    return serialize_expense_item(exp, db)

@router.post("/{expense_id}/payment", response_model=ExpenseResponse, dependencies=[Depends(validate_csrf)])
@router.post("/{expense_id}/payments", response_model=ExpenseResponse, dependencies=[Depends(validate_csrf)])
def record_payment(
    expense_id: str,
    payment_data: PaymentRecordRequest,
    current_user: User = Depends(require_role("EDITOR")),
    db: Session = Depends(get_db)
):
    """Record a partial or full payment clearance toward an outstanding bill with atomic audit logging."""
    record_expense_payment(
        db=db,
        expense_id=expense_id,
        amount=payment_data.payment_amount,
        payment_date=payment_data.payment_date,
        payment_method_id=payment_data.payment_method_id,
        reference_number=payment_data.reference_number,
        notes=payment_data.notes,
        actor=current_user
    )

    exp = db.query(Expense).filter(
        (Expense.id == expense_id) | (Expense.transaction_id == expense_id)
    ).first()
    return serialize_expense_item(exp, db)

@router.post("/{expense_id}/cancel", response_model=ExpenseResponse, dependencies=[Depends(validate_csrf)])
def cancel_expense(
    expense_id: str,
    current_user: User = Depends(require_role("EDITOR")),
    db: Session = Depends(get_db)
):
    """Non-destructively cancel/void an expense or bill (Editor only)."""
    exp = db.query(Expense).filter(Expense.id == expense_id).first()
    if not exp:
        raise HTTPException(status_code=404, detail="Expense record not found")

    before_status = exp.status
    exp.status = "CANCELLED"
    db.flush()  # one transaction with its audit entry (committed below)
    db.refresh(exp)

    record_audit(
        db=db,
        user_id=current_user.id,
        user_name=current_user.name,
        action="CANCEL",
        entity_type="EXPENSE",
        entity_id=exp.transaction_id,
        before_data={"status": before_status},
        after_data={"status": "CANCELLED"}
    )
    db.commit()

    return serialize_expense_item(exp, db)
