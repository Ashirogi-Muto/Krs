"""Global search service across transactions, projects, documents, and users."""
from typing import List, Dict, Any
from sqlalchemy.orm import Session
from sqlalchemy import or_
from app.models.income import Income
from app.models.expense import Expense
from app.models.project import Project
from app.models.document import Document, DocumentLink
from app.models.user import User
from app.schemas.search import SearchResultItem, SearchResponse

def perform_global_search(db: Session, query_str: str, current_user: User) -> SearchResponse:
    """Perform fast, permission-aware grouped search across KRS financial records."""
    q = query_str.strip()
    if not q:
        return SearchResponse(query=query_str, total_results=0)

    pattern = f"%{q}%"
    transactions: List[SearchResultItem] = []
    projects: List[SearchResultItem] = []
    documents: List[SearchResultItem] = []
    users: List[SearchResultItem] = []

    # 1. Search Incomes
    incomes = db.query(Income).filter(
        or_(
            Income.transaction_id.ilike(pattern),
            Income.source.ilike(pattern),
            Income.reference_number.ilike(pattern),
            Income.notes.ilike(pattern)
        )
    ).limit(20).all()

    for inc in incomes:
        transactions.append(SearchResultItem(
            id=inc.id,
            entity_type="INCOME",
            title=f"{inc.transaction_id} — {inc.source}",
            subtitle=f"Income: ₹{inc.amount} • {inc.date.strftime('%d %b %Y')}",
            url=f"/income/{inc.transaction_id}",
            tag=inc.status,
            extra=inc.reference_number
        ))

    # 2. Search Expenses
    expenses = db.query(Expense).filter(
        or_(
            Expense.transaction_id.ilike(pattern),
            Expense.vendor.ilike(pattern),
            Expense.description.ilike(pattern),
            Expense.reference_number.ilike(pattern),
            Expense.notes.ilike(pattern)
        )
    ).limit(20).all()

    for exp in expenses:
        transactions.append(SearchResultItem(
            id=exp.id,
            entity_type="EXPENSE",
            title=f"{exp.transaction_id} — {exp.description}",
            subtitle=f"Bill: ₹{exp.total_amount} (Paid: ₹{exp.amount_paid}) • {exp.vendor}",
            url=f"/expenses/{exp.transaction_id}",
            tag=exp.status,
            extra=f"Due: ₹{exp.amount_pending}"
        ))

    # 3. Search Projects
    projs = db.query(Project).filter(
        or_(
            Project.name.ilike(pattern),
            Project.code.ilike(pattern),
            Project.description.ilike(pattern)
        )
    ).limit(20).all()

    for p in projs:
        projects.append(SearchResultItem(
            id=p.id,
            entity_type="PROJECT",
            title=f"{p.name} ({p.code})",
            subtitle=f"Status: {p.status} • Budget: ₹{p.budget_amount or 0}",
            url=f"/projects/{p.id}",
            tag=p.status,
            extra=p.description[:60] if p.description else None
        ))

    # 4. Search Documents
    docs = db.query(Document).filter(
        or_(
            Document.filename.ilike(pattern),
            Document.document_type.ilike(pattern)
        )
    ).limit(20).all()

    for d in docs:
        documents.append(SearchResultItem(
            id=d.id,
            entity_type="DOCUMENT",
            title=d.filename,
            subtitle=f"{d.document_type} • {round(d.file_size / 1024, 1)} KB",
            url=f"/documents",
            tag=d.document_type
        ))

    # 5. Search Users (Restricted to ADMIN)
    if current_user.role == "ADMIN":
        matched_users = db.query(User).filter(
            or_(
                User.name.ilike(pattern),
                User.email.ilike(pattern)
            )
        ).limit(20).all()

        for u in matched_users:
            users.append(SearchResultItem(
                id=u.id,
                entity_type="USER",
                title=u.name,
                subtitle=f"{u.email} • Role: {u.role}",
                url="/admin/users",
                tag=u.role,
                extra="Active" if u.is_active else "Inactive"
            ))

    total = len(transactions) + len(projects) + len(documents) + len(users)

    return SearchResponse(
        query=query_str,
        total_results=total,
        transactions=transactions,
        projects=projects,
        documents=documents,
        users=users
    )
