"""Canonical financial calculation engine."""
from datetime import date, datetime, timezone
from decimal import Decimal
from typing import List, Optional, Dict, Any
from sqlalchemy.orm import Session
from sqlalchemy import func
from app.models.income import Income
from app.models.expense import Expense
from app.models.category import Category
from app.models.project import Project
from app.models.budget import Budget, BudgetItem
from app.schemas.dashboard import KPISummary, MonthlyCashFlowItem, CategoryBreakdownItem

def is_expense_overdue(expense: Expense, check_date: Optional[date] = None) -> bool:
    """Derive whether an expense is currently overdue."""
    if expense.status in ("PAID", "CANCELLED"):
        return False
    if not expense.due_date:
        return False
    
    today = check_date or date.today()
    return expense.amount_pending > Decimal("0.00") and expense.due_date < today

def derive_expense_status(total_amount: Decimal, amount_paid: Decimal, current_status: str = "PENDING") -> str:
    """Derive stored payment status preventing contradictory user input."""
    if current_status == "CANCELLED":
        return "CANCELLED"
    if amount_paid >= total_amount:
        return "PAID"
    if amount_paid > Decimal("0.00"):
        return "PARTIALLY_PAID"
    return "PENDING"

def calculate_kpis(db: Session) -> KPISummary:
    """Compute overall club financial KPIs from canonical transactions."""
    # Total Income (only active CLEARED income)
    income_res = db.query(func.coalesce(func.sum(Income.amount), 0)).filter(
        Income.status == "CLEARED"
    ).scalar()
    total_income = Decimal(str(income_res))

    # Total Expenses Paid & Total Pending (excluding CANCELLED)
    exp_res = db.query(
        func.coalesce(func.sum(Expense.total_amount), 0),
        func.coalesce(func.sum(Expense.amount_paid), 0)
    ).filter(
        Expense.status != "CANCELLED"
    ).first()
    
    total_expense_amount = Decimal(str(exp_res[0])) if exp_res else Decimal("0.00")
    total_expenses_paid = Decimal(str(exp_res[1])) if exp_res else Decimal("0.00")
    
    pending_bills = max(Decimal("0.00"), total_expense_amount - total_expenses_paid)
    available_cash = total_income - total_expenses_paid

    # Current Month Expenses Paid
    today = date.today()
    start_of_month = date(today.year, today.month, 1)
    if today.month == 12:
        end_of_month = date(today.year + 1, 1, 1)
    else:
        end_of_month = date(today.year, today.month + 1, 1)

    cur_month_res = db.query(func.coalesce(func.sum(Expense.amount_paid), 0)).filter(
        Expense.status != "CANCELLED",
        Expense.bill_date >= start_of_month,
        Expense.bill_date < end_of_month
    ).scalar()
    current_month_expenses = Decimal(str(cur_month_res))

    # Transaction Count
    inc_count = db.query(func.count(Income.id)).filter(Income.status != "CANCELLED").scalar() or 0
    exp_count = db.query(func.count(Expense.id)).filter(Expense.status != "CANCELLED").scalar() or 0

    return KPISummary(
        total_income=total_income,
        total_expenses_paid=total_expenses_paid,
        available_cash=available_cash,
        pending_bills=pending_bills,
        current_month_expenses=current_month_expenses,
        transaction_count=inc_count + exp_count
    )

def calculate_monthly_cash_flow(db: Session, months_limit: int = 12) -> List[MonthlyCashFlowItem]:
    """Generate dynamic monthly income vs expense cash flow for reporting period."""
    incomes = db.query(
        Income.date,
        Income.amount
    ).filter(Income.status == "CLEARED").all()

    expenses = db.query(
        Expense.bill_date,
        Expense.amount_paid
    ).filter(Expense.status != "CANCELLED").all()

    # Aggregate by YYYY-MM
    monthly_data: Dict[str, Dict[str, Decimal]] = {}

    for inc in incomes:
        m_key = inc.date.strftime("%Y-%m")
        if m_key not in monthly_data:
            monthly_data[m_key] = {"income": Decimal("0.00"), "expenses": Decimal("0.00")}
        monthly_data[m_key]["income"] += Decimal(str(inc.amount))

    for exp in expenses:
        m_key = exp.bill_date.strftime("%Y-%m")
        if m_key not in monthly_data:
            monthly_data[m_key] = {"income": Decimal("0.00"), "expenses": Decimal("0.00")}
        monthly_data[m_key]["expenses"] += Decimal(str(exp.amount_paid))

    sorted_keys = sorted(monthly_data.keys())[-months_limit:]
    result: List[MonthlyCashFlowItem] = []

    for k in sorted_keys:
        year, month_num = map(int, k.split("-"))
        dt = date(year, month_num, 1)
        month_name = dt.strftime("%B %Y")
        inc = monthly_data[k]["income"]
        exp = monthly_data[k]["expenses"]
        net = inc - exp
        result.append(MonthlyCashFlowItem(
            month=k,
            month_name=month_name,
            income=inc,
            expenses=exp,
            net_cash_flow=net
        ))

    return result

def calculate_category_breakdown(db: Session, month: Optional[str] = None) -> List[CategoryBreakdownItem]:
    """Calculate expense distribution grouped by category."""
    query = db.query(
        Category.id,
        Category.name,
        func.coalesce(func.sum(Expense.total_amount), 0),
        func.count(Expense.id)
    ).join(Expense, Expense.category_id == Category.id).filter(
        Expense.status != "CANCELLED"
    )

    if month:
        try:
            year, m_num = map(int, month.split("-"))
            start_dt = date(year, m_num, 1)
            end_dt = date(year + 1, 1, 1) if m_num == 12 else date(year, m_num + 1, 1)
            query = query.filter(Expense.bill_date >= start_dt, Expense.bill_date < end_dt)
        except Exception:
            pass

    rows = query.group_by(Category.id, Category.name).all()
    total_all = sum([Decimal(str(r[2])) for r in rows]) or Decimal("1.00")

    result: List[CategoryBreakdownItem] = []
    for r in rows:
        cat_id, cat_name, cat_tot, count = r[0], r[1], Decimal(str(r[2])), r[3]
        pct = round(float((cat_tot / total_all) * 100), 1)
        result.append(CategoryBreakdownItem(
            category_id=cat_id,
            category_name=cat_name,
            total_amount=cat_tot,
            percentage=pct,
            count=count
        ))

    result.sort(key=lambda x: x.total_amount, reverse=True)
    return result

def compute_project_financials(db: Session, project: Project) -> Dict[str, Any]:
    """Calculate project-level revenue, paid expenses, liabilities, and cash flow."""
    inc_sum = db.query(func.coalesce(func.sum(Income.amount), Decimal("0.00"))).filter(
        Income.project_id == project.id,
        Income.status == "CLEARED"
    ).scalar()
    total_income = Decimal(str(inc_sum))

    exp_res = db.query(
        func.coalesce(func.sum(Expense.total_amount), Decimal("0.00")),
        func.coalesce(func.sum(Expense.amount_paid), Decimal("0.00"))
    ).filter(
        Expense.project_id == project.id,
        Expense.status != "CANCELLED"
    ).first()

    total_expense = Decimal(str(exp_res[0])) if exp_res else Decimal("0.00")
    total_paid = Decimal(str(exp_res[1])) if exp_res else Decimal("0.00")
    pending = max(Decimal("0.00"), total_expense - total_paid)
    net_cash = total_income - total_paid

    budget_remaining = None
    if project.budget_amount is not None:
        budget_remaining = Decimal(str(project.budget_amount)) - total_paid

    return {
        "total_income": total_income,
        "total_expenses_paid": total_paid,
        "pending_obligations": pending,
        "net_cash_flow": net_cash,
        "budget_remaining": budget_remaining
    }

def compute_budget_actuals(db: Session, budget: Budget) -> Dict[str, Any]:
    """Calculate budget vs actual cash spending for a budget and its category items."""
    item_results = []
    total_spent = Decimal("0.00")

    for item in budget.items:
        query = db.query(func.coalesce(func.sum(Expense.amount_paid), Decimal("0.00"))).filter(
            Expense.category_id == item.category_id,
            Expense.status != "CANCELLED",
            Expense.bill_date >= budget.period_start,
            Expense.bill_date <= budget.period_end
        )
        if budget.project_id:
            query = query.filter(Expense.project_id == budget.project_id)

        spent = Decimal(str(query.scalar()))
        total_spent += spent
        alloc = Decimal(str(item.allocated_amount))
        rem = alloc - spent
        pct = round(float((spent / alloc) * 100), 1) if alloc > Decimal("0.00") else 0.0

        item_results.append({
            "id": item.id,
            "category_id": item.category_id,
            "category_name": item.category.name if item.category else "Unknown",
            "allocated_amount": alloc,
            "actual_spent": spent,
            "remaining": rem,
            "utilization_pct": pct
        })

    tot_budget = Decimal(str(budget.total_budget))
    total_rem = tot_budget - total_spent
    overall_pct = round(float((total_spent / tot_budget) * 100), 1) if tot_budget > Decimal("0.00") else 0.0

    return {
        "actual_spent": total_spent,
        "remaining": total_rem,
        "utilization_pct": overall_pct,
        "items": item_results
    }
