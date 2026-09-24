"""Global search schemas."""
from typing import List, Optional
from pydantic import BaseModel

class SearchResultItem(BaseModel):
    id: str
    entity_type: str  # "EXPENSE", "INCOME", "PROJECT", "DOCUMENT", "USER"
    title: str
    subtitle: str
    url: str
    tag: Optional[str] = None
    extra: Optional[str] = None

class SearchResponse(BaseModel):
    query: str
    total_results: int
    transactions: List[SearchResultItem] = []
    projects: List[SearchResultItem] = []
    documents: List[SearchResultItem] = []
    users: List[SearchResultItem] = []
