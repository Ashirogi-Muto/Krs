"""API package routing."""
from fastapi import APIRouter
from app.api.auth import router as auth_router
from app.api.dashboard import router as dashboard_router
from app.api.income import router as income_router
from app.api.expenses import router as expenses_router
from app.api.documents import router as documents_router
from app.api.reports import router as reports_router
from app.api.audit import router as audit_router
from app.api.metadata import router as metadata_router
from app.api.admin import router as admin_router
from app.api.projects import router as projects_router
from app.api.budgets import router as budgets_router
from app.api.notifications import router as notifications_router
from app.api.search import router as search_router
from app.api.import_data import router as import_router
from app.api.team import router as team_router

api_router = APIRouter()
api_router.include_router(auth_router)
api_router.include_router(team_router)
api_router.include_router(dashboard_router)
api_router.include_router(income_router)
api_router.include_router(expenses_router)
api_router.include_router(documents_router)
api_router.include_router(reports_router)
api_router.include_router(audit_router)
api_router.include_router(metadata_router)
api_router.include_router(admin_router)
api_router.include_router(projects_router)
api_router.include_router(budgets_router)
api_router.include_router(notifications_router)
api_router.include_router(search_router)
api_router.include_router(import_router)

__all__ = ["api_router"]
