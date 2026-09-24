"""Dashboard and KPI schemas."""
from decimal import Decimal
from typing import List
from pydantic import BaseModel
from app.schemas.expense import ExpenseResponse

class KPISummary(BaseModel):
    total_income: Decimal
    total_expenses_paid: Decimal
    available_cash: Decimal
    pending_bills: Decimal
    current_month_expenses: Decimal
    transaction_count: int

class MonthlyCashFlowItem(BaseModel):
    month: str  # YYYY-MM
    month_name: str  # e.g., "September 2026"
    income: Decimal
    expenses: Decimal
    net_cash_flow: Decimal

class CategoryBreakdownItem(BaseModel):
    category_id: str
    category_name: str
    total_amount: Decimal
    percentage: float
    count: int

class DashboardResponse(BaseModel):
    kpis: KPISummary
    monthly_cash_flow: List[MonthlyCashFlowItem]
    category_breakdown: List[CategoryBreakdownItem]
    recent_expenses: List[ExpenseResponse]
    pending_expenses: List[ExpenseResponse]
