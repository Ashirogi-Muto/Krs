"""Global search API router."""
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.user import User
from app.api.deps import get_current_user
from app.schemas.search import SearchResponse
from app.services.search_service import perform_global_search

router = APIRouter(
    prefix="/api/search",
    tags=["search"]
)

@router.get("", response_model=SearchResponse)
def search_records(
    q: str = Query(..., min_length=1, max_length=100),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Search across transactions, projects, vault documents, and users (admin only)."""
    return perform_global_search(db=db, query_str=q, current_user=current_user)
