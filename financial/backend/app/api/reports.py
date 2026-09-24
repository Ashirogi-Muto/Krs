"""Report generation and data export endpoints."""
from datetime import date, datetime
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query, Response
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.user import User
from app.models.income import Income
from app.models.expense import Expense
from app.models.category import Category
from app.models.payment_method import PaymentMethod
from app.api.deps import get_current_user
from app.services.report_service import generate_excel_report, generate_pdf_report, check_report_rate_limit

router = APIRouter(prefix="/api/reports", tags=["Reports"])

@router.post("/excel")
def download_excel_report(
    start_date: Optional[date] = Query(None),
    end_date: Optional[date] = Query(None),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Generate and download formatted multi-sheet Excel report."""
    if not check_report_rate_limit(current_user.id):
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail="Too many report requests. Please wait a moment before downloading again."
        )

    try:
        excel_buf = generate_excel_report(db, start_date, end_date)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail="Error generating Excel report")

    filename = f"KRS_Financial_Report_{datetime.now().strftime('%Y%m%d_%H%M%S')}.xlsx"
    return Response(
        content=excel_buf.getvalue(),
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        headers={"Content-Disposition": f'attachment; filename="{filename}"'}
    )

@router.post("/pdf")
def download_pdf_report(
    start_date: Optional[date] = Query(None),
    end_date: Optional[date] = Query(None),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Generate and download publication-ready institutional PDF report."""
    if not check_report_rate_limit(current_user.id):
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail="Too many report requests. Please wait a moment before downloading again."
        )

    try:
        pdf_buf = generate_pdf_report(db, start_date, end_date)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail="Error generating PDF report")

    filename = f"KRS_Financial_Report_{datetime.now().strftime('%Y%m%d_%H%M%S')}.pdf"
    return Response(
        content=pdf_buf.getvalue(),
        media_type="application/pdf",
        headers={"Content-Disposition": f'attachment; filename="{filename}"'}
    )

@router.get("/export")
def export_all_data(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Export complete snapshot of financial records in JSON format (Data Export only, not automated DR)."""
    incomes = db.query(Income).all()
    expenses = db.query(Expense).all()
    categories = db.query(Category).all()
    methods = db.query(PaymentMethod).all()

    return {
        "exported_at": datetime.now().isoformat(),
        "exported_by": current_user.name,
        "categories": [{"id": c.id, "name": c.name, "type": c.type} for c in categories],
        "payment_methods": [{"id": m.id, "name": m.name} for m in methods],
        "income": [
            {
                "transaction_id": inc.transaction_id,
                "date": inc.date.isoformat(),
                "source": inc.source,
                "amount": float(inc.amount),
                "received_by": inc.received_by,
                "status": inc.status,
                "reference_number": inc.reference_number,
                "notes": inc.notes
            }
            for inc in incomes
        ],
        "expenses": [
            {
                "transaction_id": exp.transaction_id,
                "bill_date": exp.bill_date.isoformat(),
                "description": exp.description,
                "vendor": exp.vendor,
                "total_amount": float(exp.total_amount),
                "amount_paid": float(exp.amount_paid),
                "amount_pending": float(exp.amount_pending),
                "status": exp.status,
                "due_date": exp.due_date.isoformat() if exp.due_date else None,
                "payment_date": exp.payment_date.isoformat() if exp.payment_date else None,
                "reference_number": exp.reference_number,
                "notes": exp.notes
            }
            for exp in expenses
        ]
    }
