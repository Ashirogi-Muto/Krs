"""Services package."""
from app.services.auth_service import hash_password, verify_password, create_access_token, decode_access_token
from app.services.calc_service import (
    calculate_kpis,
    calculate_monthly_cash_flow,
    calculate_category_breakdown,
    is_expense_overdue,
    derive_expense_status,
    compute_project_financials,
    compute_budget_actuals
)
from app.services.storage_service import get_storage_provider
from app.services.report_service import generate_excel_report, generate_pdf_report
from app.services.audit_service import record_audit
from app.services.payment_service import record_expense_payment, get_expense_payments
from app.services.notification_service import create_notification, evaluate_and_generate_due_notifications
from app.services.search_service import perform_global_search
from app.services.import_service import preview_import_file, commit_staged_import
from app.services.admin_service import (
    list_users,
    count_users,
    create_user,
    update_user_role,
    update_user_status,
    reset_user_password,
    create_category,
    update_category_status,
    create_payment_method,
    update_payment_method_status
)

__all__ = [
    "hash_password",
    "verify_password",
    "create_access_token",
    "decode_access_token",
    "calculate_kpis",
    "calculate_monthly_cash_flow",
    "calculate_category_breakdown",
    "is_expense_overdue",
    "derive_expense_status",
    "compute_project_financials",
    "compute_budget_actuals",
    "get_storage_provider",
    "generate_excel_report",
    "generate_pdf_report",
    "record_audit",
    "record_expense_payment",
    "get_expense_payments",
    "create_notification",
    "evaluate_and_generate_due_notifications",
    "perform_global_search",
    "preview_import_file",
    "commit_staged_import",
    "list_users",
    "count_users",
    "create_user",
    "update_user_role",
    "update_user_status",
    "reset_user_password",
    "create_category",
    "update_category_status",
    "create_payment_method",
    "update_payment_method_status",
]
