"""Report generation engine: 6-sheet Excel (openpyxl) and PDF (reportlab)."""
import io
import time
from datetime import date, datetime, timedelta
from decimal import Decimal
from typing import Optional, Tuple, Dict
from sqlalchemy.orm import Session
from sqlalchemy import func
import openpyxl
from openpyxl.styles import Font, PatternFill, Alignment, Border, Side
from reportlab.lib.pagesizes import letter
from reportlab.lib import colors
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from app.config import settings
from app.models.income import Income
from app.models.expense import Expense
from app.models.expense_payment import ExpensePayment
from app.models.category import Category
from app.models.document import Document, DocumentLink
from app.models.project import Project
from app.models.budget import Budget, BudgetItem
from app.services.calc_service import (
    is_expense_overdue,
    calculate_kpis,
    compute_project_financials,
    compute_budget_actuals
)

# Simple in-memory rate limiting tracker (user_id -> list of request timestamps)
_rate_limits: Dict[str, list] = {}

def check_report_rate_limit(user_id: str, max_requests: int = 6, window_seconds: int = 60) -> bool:
    """Ensure user does not trigger runaway report generation."""
    now = time.time()
    timestamps = _rate_limits.get(user_id, [])
    # Keep only timestamps within window
    timestamps = [t for t in timestamps if now - t < window_seconds]
    if len(timestamps) >= max_requests:
        return False
    timestamps.append(now)
    _rate_limits[user_id] = timestamps
    return True

def validate_report_date_range(start_date: Optional[date], end_date: Optional[date]) -> Tuple[date, date]:
    """Validate report range does not exceed maximum allowable period (12 months)."""
    today = date.today()
    if not end_date:
        end_date = today
    if not start_date:
        # Default to 365 days prior
        start_date = end_date - timedelta(days=365)

    if start_date > end_date:
        raise ValueError("Start date cannot be after end date")

    days_diff = (end_date - start_date).days
    max_days = settings.MAX_REPORT_RANGE_MONTHS * 31 + 35
    if days_diff > max_days:
        raise ValueError(f"Report date range exceeds maximum allowed period of {settings.MAX_REPORT_RANGE_MONTHS} months")

    return start_date, end_date

def neutralise_formulas(wb) -> int:
    """The report has no formulas of its own, but openpyxl turns any text starting with "=" (a vendor name, a note)
    into a live formula. Store every such cell as plain text instead (spreadsheet formula injection)."""
    fixed = 0
    for ws in wb.worksheets:
        for row in ws.iter_rows():
            for cell in row:
                if cell.data_type == "f":
                    cell.data_type = "s"
                    fixed += 1
    return fixed


def generate_excel_report(db: Session, start_date: Optional[date] = None, end_date: Optional[date] = None) -> io.BytesIO:
    """Generate 6-sheet formatted Excel workbook."""
    s_date, e_date = validate_report_date_range(start_date, end_date)

    wb = openpyxl.Workbook()
    header_fill = PatternFill(start_color="1E293B", end_color="1E293B", fill_type="solid")
    header_font = Font(name="Calibri", size=11, bold=True, color="FFFFFF")
    title_font = Font(name="Calibri", size=14, bold=True, color="0F172A")
    bold_font = Font(name="Calibri", size=11, bold=True)
    thin_border = Border(
        left=Side(style='thin', color='CBD5E1'),
        right=Side(style='thin', color='CBD5E1'),
        top=Side(style='thin', color='CBD5E1'),
        bottom=Side(style='thin', color='CBD5E1')
    )

    # 1. SUMMARY SHEET
    ws_summary = wb.active
    ws_summary.title = "Summary"
    ws_summary.views.sheetView[0].showGridLines = True

    ws_summary.cell(row=1, column=1, value="KALAM ROBOTICS SOCIETY — FINANCIAL SUMMARY REPORT").font = title_font
    ws_summary.cell(row=2, column=1, value=f"Reporting Period: {s_date.strftime('%d-%b-%Y')} to {e_date.strftime('%d-%b-%Y')}").font = Font(italic=True)
    ws_summary.cell(row=3, column=1, value=f"Generated On: {datetime.now().strftime('%d-%b-%Y %H:%M UTC')}").font = Font(italic=True, size=9)

    kpis = calculate_kpis(db)
    
    # Range-specific sums
    range_income = db.query(func.coalesce(func.sum(Income.amount), 0)).filter(
        Income.status == "CLEARED", Income.date >= s_date, Income.date <= e_date
    ).scalar() or 0
    range_expenses_paid = db.query(func.coalesce(func.sum(Expense.amount_paid), 0)).filter(
        Expense.status != "CANCELLED", Expense.bill_date >= s_date, Expense.bill_date <= e_date
    ).scalar() or 0

    summary_rows = [
        ("Period Income Received", float(range_income), "Total money received in selected period"),
        ("Period Expenses Paid", float(range_expenses_paid), "Total money paid out in selected period"),
        ("Period Net Cash Flow", float(range_income - range_expenses_paid), "Net period inflow minus outflow"),
        ("Overall Total Income", float(kpis.total_income), "All-time club income"),
        ("Overall Total Paid", float(kpis.total_expenses_paid), "All-time cleared expenses"),
        ("Net Available Cash", float(kpis.available_cash), "Current cash on hand (All Income - All Paid)"),
        ("Total Bills Pending", float(kpis.pending_bills), "Total outstanding unpaid obligations"),
    ]

    ws_summary.cell(row=5, column=1, value="Metric").font = header_font
    ws_summary.cell(row=5, column=1).fill = header_fill
    ws_summary.cell(row=5, column=2, value="Amount (₹)").font = header_font
    ws_summary.cell(row=5, column=2).fill = header_fill
    ws_summary.cell(row=5, column=3, value="Description").font = header_font
    ws_summary.cell(row=5, column=3).fill = header_fill

    for idx, (m, val, desc) in enumerate(summary_rows, start=6):
        ws_summary.cell(row=idx, column=1, value=m).font = bold_font
        c2 = ws_summary.cell(row=idx, column=2, value=val)
        c2.number_format = "₹#,##0.00"
        ws_summary.cell(row=idx, column=3, value=desc)
        for c in range(1, 4):
            ws_summary.cell(row=idx, column=c).border = thin_border

    # 2. INCOME SHEET
    ws_inc = wb.create_sheet(title="Income")
    inc_headers = ["ID", "Date", "Source / Contributor", "Category", "Amount Received", "Payment Method", "Received By", "Notes / Ref"]
    for col_num, h in enumerate(inc_headers, 1):
        c = ws_inc.cell(row=1, column=col_num, value=h)
        c.font = header_font
        c.fill = header_fill

    incomes = db.query(Income).filter(Income.date >= s_date, Income.date <= e_date).order_by(Income.date).all()
    for row_num, inc in enumerate(incomes, 2):
        ws_inc.cell(row=row_num, column=1, value=inc.transaction_id)
        ws_inc.cell(row=row_num, column=2, value=inc.date.strftime("%d-%m-%Y"))
        ws_inc.cell(row=row_num, column=3, value=inc.source)
        ws_inc.cell(row=row_num, column=4, value=inc.category.name if inc.category else "Uncategorized")
        c = ws_inc.cell(row=row_num, column=5, value=float(inc.amount))
        c.number_format = "₹#,##0.00"
        ws_inc.cell(row=row_num, column=6, value=inc.payment_method.name if inc.payment_method else "-")
        ws_inc.cell(row=row_num, column=7, value=inc.received_by)
        ref_notes = f"{inc.reference_number or ''} {inc.notes or ''}".strip()
        ws_inc.cell(row=row_num, column=8, value=ref_notes or "-")
        for col_num in range(1, 9):
            ws_inc.cell(row=row_num, column=col_num).border = thin_border

    # 3. EXPENSES SHEET
    ws_exp = wb.create_sheet(title="Expenses")
    exp_headers = ["ID", "Bill Date", "Expense Description", "Category", "Vendor / Payee", "Total Amount", "Amount Paid", "Amount Pending", "Status", "Due Date", "Payment Date", "Method", "Notes / Ref"]
    for col_num, h in enumerate(exp_headers, 1):
        c = ws_exp.cell(row=1, column=col_num, value=h)
        c.font = header_font
        c.fill = header_fill

    expenses = db.query(Expense).filter(Expense.bill_date >= s_date, Expense.bill_date <= e_date).order_by(Expense.bill_date).all()
    for row_num, exp in enumerate(expenses, 2):
        ws_exp.cell(row=row_num, column=1, value=exp.transaction_id)
        ws_exp.cell(row=row_num, column=2, value=exp.bill_date.strftime("%d-%m-%Y"))
        ws_exp.cell(row=row_num, column=3, value=exp.description)
        ws_exp.cell(row=row_num, column=4, value=exp.category.name if exp.category else "Uncategorized")
        ws_exp.cell(row=row_num, column=5, value=exp.vendor)
        c_tot = ws_exp.cell(row=row_num, column=6, value=float(exp.total_amount))
        c_tot.number_format = "₹#,##0.00"
        c_paid = ws_exp.cell(row=row_num, column=7, value=float(exp.amount_paid))
        c_paid.number_format = "₹#,##0.00"
        c_pend = ws_exp.cell(row=row_num, column=8, value=float(exp.amount_pending))
        c_pend.number_format = "₹#,##0.00"
        
        # Display Overdue if applicable
        st = "OVERDUE" if is_expense_overdue(exp) else exp.status
        ws_exp.cell(row=row_num, column=9, value=st)
        ws_exp.cell(row=row_num, column=10, value=exp.due_date.strftime("%d-%m-%Y") if exp.due_date else "-")
        ws_exp.cell(row=row_num, column=11, value=exp.payment_date.strftime("%d-%m-%Y") if exp.payment_date else "-")
        ws_exp.cell(row=row_num, column=12, value=exp.payment_method.name if exp.payment_method else "-")
        ref_notes = f"{exp.reference_number or ''} {exp.notes or ''}".strip()
        ws_exp.cell(row=row_num, column=13, value=ref_notes or "-")
        for col_num in range(1, 14):
            ws_exp.cell(row=row_num, column=col_num).border = thin_border

    # 4. PENDING BILLS SHEET
    ws_pend = wb.create_sheet(title="Pending Bills")
    pend_headers = ["ID", "Bill Date", "Description", "Vendor", "Total Amount", "Amount Paid", "Pending Due", "Due Date", "Status"]
    for col_num, h in enumerate(pend_headers, 1):
        c = ws_pend.cell(row=1, column=col_num, value=h)
        c.font = header_font
        c.fill = header_fill

    pending_list = db.query(Expense).filter(
        Expense.status != "CANCELLED",
        Expense.status != "PAID"
    ).all()
    # Filter by pending balance
    pending_list = [e for e in pending_list if e.amount_pending > Decimal("0.00")]

    for row_num, exp in enumerate(pending_list, 2):
        ws_pend.cell(row=row_num, column=1, value=exp.transaction_id)
        ws_pend.cell(row=row_num, column=2, value=exp.bill_date.strftime("%d-%m-%Y"))
        ws_pend.cell(row=row_num, column=3, value=exp.description)
        ws_pend.cell(row=row_num, column=4, value=exp.vendor)
        ws_pend.cell(row=row_num, column=5, value=float(exp.total_amount)).number_format = "₹#,##0.00"
        ws_pend.cell(row=row_num, column=6, value=float(exp.amount_paid)).number_format = "₹#,##0.00"
        ws_pend.cell(row=row_num, column=7, value=float(exp.amount_pending)).number_format = "₹#,##0.00"
        ws_pend.cell(row=row_num, column=8, value=exp.due_date.strftime("%d-%m-%Y") if exp.due_date else "-")
        st = "OVERDUE" if is_expense_overdue(exp) else exp.status
        ws_pend.cell(row=row_num, column=9, value=st)
        for col_num in range(1, 10):
            ws_pend.cell(row=row_num, column=col_num).border = thin_border

    # 5. MONTHLY ANALYSIS SHEET
    ws_month = wb.create_sheet(title="Monthly Analysis")
    cat_rows = db.query(
        Category.name,
        func.coalesce(func.sum(Expense.total_amount), 0),
        func.count(Expense.id)
    ).join(Expense, Expense.category_id == Category.id).filter(
        Expense.status != "CANCELLED",
        Expense.bill_date >= s_date,
        Expense.bill_date <= e_date
    ).group_by(Category.name).all()

    ws_month.cell(row=1, column=1, value="Category").font = header_font
    ws_month.cell(row=1, column=1).fill = header_fill
    ws_month.cell(row=1, column=2, value="Total Spend (₹)").font = header_font
    ws_month.cell(row=1, column=2).fill = header_fill
    ws_month.cell(row=1, column=3, value="Transaction Count").font = header_font
    ws_month.cell(row=1, column=3).fill = header_fill

    for row_num, (cat_name, tot, cnt) in enumerate(cat_rows, 2):
        ws_month.cell(row=row_num, column=1, value=cat_name)
        c = ws_month.cell(row=row_num, column=2, value=float(tot))
        c.number_format = "₹#,##0.00"
        ws_month.cell(row=row_num, column=3, value=cnt)
        for col_num in range(1, 4):
            ws_month.cell(row=row_num, column=col_num).border = thin_border

    # 6. DOCUMENT INDEX SHEET
    ws_docs = wb.create_sheet(title="Document Index")
    doc_headers = ["Document ID", "Filename", "MIME Type", "Size (Bytes)", "Linked Entity", "Linked Transaction", "Upload Date"]
    for col_num, h in enumerate(doc_headers, 1):
        c = ws_docs.cell(row=1, column=col_num, value=h)
        c.font = header_font
        c.fill = header_fill

    links = db.query(DocumentLink).all()
    for row_num, link in enumerate(links, 2):
        doc = link.document
        tx_id = "-"
        if link.entity_type == "EXPENSE":
            exp_match = db.query(Expense.transaction_id).filter(Expense.id == link.entity_id).first()
            if exp_match:
                tx_id = exp_match[0]
        elif link.entity_type == "INCOME":
            inc_match = db.query(Income.transaction_id).filter(Income.id == link.entity_id).first()
            if inc_match:
                tx_id = inc_match[0]

        ws_docs.cell(row=row_num, column=1, value=doc.id)
        ws_docs.cell(row=row_num, column=2, value=doc.filename)
        ws_docs.cell(row=row_num, column=3, value=doc.mime_type)
        ws_docs.cell(row=row_num, column=4, value=doc.file_size)
        ws_docs.cell(row=row_num, column=5, value=link.entity_type)
        ws_docs.cell(row=row_num, column=6, value=tx_id)
        ws_docs.cell(row=row_num, column=7, value=doc.uploaded_at.strftime("%d-%m-%Y %H:%M"))
        for col_num in range(1, 8):
            ws_docs.cell(row=row_num, column=col_num).border = thin_border

    # 7. PAYMENT HISTORY SHEET
    ws_payments = wb.create_sheet(title="Payment History")
    pmt_headers = ["Payment ID", "Expense ID", "Description", "Vendor", "Payment Date", "Amount (₹)", "Method", "Reference", "Recorded By"]
    for col_num, h in enumerate(pmt_headers, 1):
        c = ws_payments.cell(row=1, column=col_num, value=h)
        c.font = header_font
        c.fill = header_fill

    payments = db.query(ExpensePayment).join(Expense, ExpensePayment.expense_id == Expense.id).filter(
        ExpensePayment.payment_date >= s_date,
        ExpensePayment.payment_date <= e_date
    ).order_by(ExpensePayment.payment_date.desc()).all()

    for row_num, pmt in enumerate(payments, 2):
        ws_payments.cell(row=row_num, column=1, value=pmt.id[:8])
        ws_payments.cell(row=row_num, column=2, value=pmt.expense.transaction_id if pmt.expense else "-")
        ws_payments.cell(row=row_num, column=3, value=pmt.expense.description if pmt.expense else "-")
        ws_payments.cell(row=row_num, column=4, value=pmt.expense.vendor if pmt.expense else "-")
        ws_payments.cell(row=row_num, column=5, value=pmt.payment_date.strftime("%d-%m-%Y"))
        ws_payments.cell(row=row_num, column=6, value=float(pmt.amount)).number_format = "₹#,##0.00"
        ws_payments.cell(row=row_num, column=7, value=pmt.payment_method.name if pmt.payment_method else "-")
        ws_payments.cell(row=row_num, column=8, value=pmt.reference_number or "-")
        ws_payments.cell(row=row_num, column=9, value=pmt.creator.name if pmt.creator else "-")
        for col_num in range(1, 10):
            ws_payments.cell(row=row_num, column=col_num).border = thin_border

    # 8. PROJECTS & EVENTS SHEET
    ws_projs = wb.create_sheet(title="Projects & Events")
    proj_headers = ["Code", "Project Name", "Status", "Budget (₹)", "Total Income (₹)", "Total Paid (₹)", "Pending (₹)", "Net Cash Flow (₹)", "Budget Remaining (₹)"]
    for col_num, h in enumerate(proj_headers, 1):
        c = ws_projs.cell(row=1, column=col_num, value=h)
        c.font = header_font
        c.fill = header_fill

    projects = db.query(Project).order_by(Project.created_at.desc()).all()
    for row_num, p in enumerate(projects, 2):
        fin = compute_project_financials(db, p)
        ws_projs.cell(row=row_num, column=1, value=p.code)
        ws_projs.cell(row=row_num, column=2, value=p.name)
        ws_projs.cell(row=row_num, column=3, value=p.status)
        ws_projs.cell(row=row_num, column=4, value=float(p.budget_amount) if p.budget_amount is not None else 0.0).number_format = "₹#,##0.00"
        ws_projs.cell(row=row_num, column=5, value=float(fin["total_income"])).number_format = "₹#,##0.00"
        ws_projs.cell(row=row_num, column=6, value=float(fin["total_expenses_paid"])).number_format = "₹#,##0.00"
        ws_projs.cell(row=row_num, column=7, value=float(fin["pending_obligations"])).number_format = "₹#,##0.00"
        ws_projs.cell(row=row_num, column=8, value=float(fin["net_cash_flow"])).number_format = "₹#,##0.00"
        ws_projs.cell(row=row_num, column=9, value=float(fin["budget_remaining"]) if fin["budget_remaining"] is not None else 0.0).number_format = "₹#,##0.00"
        for col_num in range(1, 10):
            ws_projs.cell(row=row_num, column=col_num).border = thin_border

    # 9. BUDGETS & ALLOCATIONS SHEET
    ws_budgets = wb.create_sheet(title="Budgets")
    b_headers = ["Budget Name", "Project", "Period", "Total Budget (₹)", "Actual Spent (₹)", "Remaining (₹)", "Utilization %", "Status"]
    for col_num, h in enumerate(b_headers, 1):
        c = ws_budgets.cell(row=1, column=col_num, value=h)
        c.font = header_font
        c.fill = header_fill

    budgets = db.query(Budget).order_by(Budget.period_start.desc()).all()
    for row_num, b in enumerate(budgets, 2):
        b_actuals = compute_budget_actuals(db, b)
        ws_budgets.cell(row=row_num, column=1, value=b.name)
        ws_budgets.cell(row=row_num, column=2, value=b.project.name if b.project else "General Club")
        ws_budgets.cell(row=row_num, column=3, value=f"{b.period_start.strftime('%d-%b-%Y')} to {b.period_end.strftime('%d-%b-%Y')}")
        ws_budgets.cell(row=row_num, column=4, value=float(b.total_budget)).number_format = "₹#,##0.00"
        ws_budgets.cell(row=row_num, column=5, value=float(b_actuals["actual_spent"])).number_format = "₹#,##0.00"
        ws_budgets.cell(row=row_num, column=6, value=float(b_actuals["remaining"])).number_format = "₹#,##0.00"
        ws_budgets.cell(row=row_num, column=7, value=f"{b_actuals['utilization_pct']}%")
        ws_budgets.cell(row=row_num, column=8, value=b.status)
        for col_num in range(1, 9):
            ws_budgets.cell(row=row_num, column=col_num).border = thin_border

    # Auto-adjust column widths on all sheets
    for ws in wb.worksheets:
        for col in ws.columns:
            max_len = 0
            col_letter = col[0].column_letter
            for cell in col:
                val_str = str(cell.value or "")
                if len(val_str) > max_len:
                    max_len = len(val_str)
            ws.column_dimensions[col_letter].width = max(max_len + 3, 12)

    neutralise_formulas(wb)
    buf = io.BytesIO()
    wb.save(buf)
    buf.seek(0)
    return buf

def generate_pdf_report(db: Session, start_date: Optional[date] = None, end_date: Optional[date] = None) -> io.BytesIO:
    """Generate institutional PDF financial report using ReportLab."""
    s_date, e_date = validate_report_date_range(start_date, end_date)

    buf = io.BytesIO()
    doc = SimpleDocTemplate(
        buf,
        pagesize=letter,
        rightMargin=36,
        leftMargin=36,
        topMargin=36,
        bottomMargin=36
    )

    styles = getSampleStyleSheet()
    title_style = ParagraphStyle(
        'DocTitle',
        parent=styles['Heading1'],
        fontName='Helvetica-Bold',
        fontSize=18,
        leading=22,
        textColor=colors.HexColor('#0F172A')
    )
    subtitle_style = ParagraphStyle(
        'DocSubtitle',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=10,
        leading=14,
        textColor=colors.HexColor('#64748B')
    )
    h2_style = ParagraphStyle(
        'H2',
        parent=styles['Heading2'],
        fontName='Helvetica-Bold',
        fontSize=12,
        leading=16,
        textColor=colors.HexColor('#1E293B'),
        spaceBefore=12,
        spaceAfter=6
    )
    normal_style = ParagraphStyle(
        'Cell',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=8,
        leading=10
    )
    bold_cell_style = ParagraphStyle(
        'BoldCell',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=8,
        leading=10
    )

    story = []

    # Title & Subtitle
    story.append(Paragraph("KALAM ROBOTICS SOCIETY", title_style))
    story.append(Paragraph("FINANCIAL MANAGEMENT & AUDIT REPORT", ParagraphStyle('ReportSub', parent=title_style, fontSize=13, leading=16, textColor=colors.HexColor('#2563EB'))))
    story.append(Paragraph(f"Reporting Period: {s_date.strftime('%d-%b-%Y')} to {e_date.strftime('%d-%b-%Y')} | Generated: {datetime.now().strftime('%d-%b-%Y %H:%M UTC')}", subtitle_style))
    story.append(Spacer(1, 14))

    # Executive Summary Table
    story.append(Paragraph("1. Executive Financial Summary", h2_style))
    kpis = calculate_kpis(db)
    summary_data = [
        [Paragraph("Metric", bold_cell_style), Paragraph("Amount (INR)", bold_cell_style), Paragraph("Description", bold_cell_style)],
        [Paragraph("Total Income Received", normal_style), Paragraph(f"₹{kpis.total_income:,.2f}", bold_cell_style), Paragraph("All cleared club inflows", normal_style)],
        [Paragraph("Total Expenses Cleared", normal_style), Paragraph(f"₹{kpis.total_expenses_paid:,.2f}", bold_cell_style), Paragraph("Total payments disbursed", normal_style)],
        [Paragraph("Net Available Cash", bold_cell_style), Paragraph(f"₹{kpis.available_cash:,.2f}", bold_cell_style), Paragraph("Current cash balance (Income - Paid)", normal_style)],
        [Paragraph("Pending Bill Balance", normal_style), Paragraph(f"₹{kpis.pending_bills:,.2f}", bold_cell_style), Paragraph("Committed unpaid obligations", normal_style)],
    ]
    summary_table = Table(summary_data, colWidths=[150, 110, 280])
    summary_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#F1F5F9')),
        ('TEXTCOLOR', (0, 0), (-1, 0), colors.HexColor('#0F172A')),
        ('ALIGN', (1, 0), (1, -1), 'RIGHT'),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 4),
        ('TOPPADDING', (0, 0), (-1, -1), 4),
        ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor('#E2E8F0')),
    ]))
    story.append(summary_table)
    story.append(Spacer(1, 14))

    # Pending Obligations Table
    story.append(Paragraph("2. Outstanding / Pending Bills", h2_style))
    pending_bills = db.query(Expense).filter(
        Expense.status != "CANCELLED",
        Expense.status != "PAID"
    ).all()
    pending_bills = [e for e in pending_bills if e.amount_pending > Decimal("0.00")]

    pend_data = [
        [Paragraph("ID", bold_cell_style), Paragraph("Vendor", bold_cell_style), Paragraph("Description", bold_cell_style), Paragraph("Total (₹)", bold_cell_style), Paragraph("Paid (₹)", bold_cell_style), Paragraph("Pending (₹)", bold_cell_style), Paragraph("Status", bold_cell_style)]
    ]
    for e in pending_bills[:15]:  # limit to top 15 in summary PDF
        st = "OVERDUE" if is_expense_overdue(e) else e.status
        pend_data.append([
            Paragraph(e.transaction_id, normal_style),
            Paragraph(e.vendor[:18], normal_style),
            Paragraph(e.description[:22], normal_style),
            Paragraph(f"₹{e.total_amount:,.2f}", normal_style),
            Paragraph(f"₹{e.amount_paid:,.2f}", normal_style),
            Paragraph(f"₹{e.amount_pending:,.2f}", bold_cell_style),
            Paragraph(st, normal_style)
        ])
    if len(pending_bills) == 0:
        pend_data.append([Paragraph("No pending bills outstanding.", normal_style)] + [Paragraph("", normal_style)]*6)

    pend_table = Table(pend_data, colWidths=[55, 95, 120, 70, 65, 70, 65])
    pend_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#F8FAFC')),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 3),
        ('TOPPADDING', (0, 0), (-1, -1), 3),
        ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor('#E2E8F0')),
    ]))
    story.append(pend_table)
    story.append(Spacer(1, 14))

    # Recent Transactions
    story.append(Paragraph("3. Recent Expense Activity (Period Log)", h2_style))
    recent_exp = db.query(Expense).filter(
        Expense.bill_date >= s_date, Expense.bill_date <= e_date, Expense.status != "CANCELLED"
    ).order_by(Expense.bill_date.desc()).limit(20).all()

    rec_data = [
        [Paragraph("ID", bold_cell_style), Paragraph("Date", bold_cell_style), Paragraph("Description", bold_cell_style), Paragraph("Vendor", bold_cell_style), Paragraph("Amount (₹)", bold_cell_style), Paragraph("Status", bold_cell_style)]
    ]
    for e in recent_exp:
        st = "OVERDUE" if is_expense_overdue(e) else e.status
        rec_data.append([
            Paragraph(e.transaction_id, normal_style),
            Paragraph(e.bill_date.strftime("%d-%m-%Y"), normal_style),
            Paragraph(e.description[:25], normal_style),
            Paragraph(e.vendor[:20], normal_style),
            Paragraph(f"₹{e.total_amount:,.2f}", normal_style),
            Paragraph(st, normal_style)
        ])
    if not recent_exp:
        rec_data.append([Paragraph("No expenses recorded in this period.", normal_style)] + [Paragraph("", normal_style)]*5)

    rec_table = Table(rec_data, colWidths=[60, 65, 165, 120, 70, 60])
    rec_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#F8FAFC')),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 3),
        ('TOPPADDING', (0, 0), (-1, -1), 3),
        ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor('#E2E8F0')),
    ]))
    story.append(rec_table)
    story.append(Spacer(1, 14))

    # 4. Projects Summary
    story.append(Paragraph("4. Projects & Events Ledger Summary", h2_style))
    projs = db.query(Project).all()
    proj_pdf_data = [
        [Paragraph("Code", bold_cell_style), Paragraph("Project Name", bold_cell_style), Paragraph("Status", bold_cell_style), Paragraph("Income (₹)", bold_cell_style), Paragraph("Expenses (₹)", bold_cell_style), Paragraph("Net (₹)", bold_cell_style)]
    ]
    for p in projs[:10]:
        fin = compute_project_financials(db, p)
        proj_pdf_data.append([
            Paragraph(p.code, normal_style),
            Paragraph(p.name[:25], normal_style),
            Paragraph(p.status, normal_style),
            Paragraph(f"₹{fin['total_income']:,.2f}", normal_style),
            Paragraph(f"₹{fin['total_expenses_paid']:,.2f}", normal_style),
            Paragraph(f"₹{fin['net_cash_flow']:,.2f}", bold_cell_style)
        ])
    if not projs:
        proj_pdf_data.append([Paragraph("No active or historical projects recorded.", normal_style)] + [Paragraph("", normal_style)]*5)

    proj_pdf_table = Table(proj_pdf_data, colWidths=[65, 175, 60, 80, 80, 80])
    proj_pdf_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#F8FAFC')),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 3),
        ('TOPPADDING', (0, 0), (-1, -1), 3),
        ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor('#E2E8F0')),
    ]))
    story.append(proj_pdf_table)
    story.append(Spacer(1, 14))

    # 5. Budgets Overview
    story.append(Paragraph("5. Budgets & Allocations Overview", h2_style))
    all_budgets = db.query(Budget).all()
    b_pdf_data = [
        [Paragraph("Budget Name", bold_cell_style), Paragraph("Period", bold_cell_style), Paragraph("Total Budget (₹)", bold_cell_style), Paragraph("Actual Spent (₹)", bold_cell_style), Paragraph("Remaining (₹)", bold_cell_style), Paragraph("Utilized", bold_cell_style)]
    ]
    for b in all_budgets[:10]:
        b_act = compute_budget_actuals(db, b)
        b_pdf_data.append([
            Paragraph(b.name[:25], normal_style),
            Paragraph(f"{b.period_start.strftime('%b %y')} - {b.period_end.strftime('%b %y')}", normal_style),
            Paragraph(f"₹{b.total_budget:,.2f}", normal_style),
            Paragraph(f"₹{b_act['actual_spent']:,.2f}", normal_style),
            Paragraph(f"₹{b_act['remaining']:,.2f}", normal_style),
            Paragraph(f"{b_act['utilization_pct']}%", bold_cell_style)
        ])
    if not all_budgets:
        b_pdf_data.append([Paragraph("No budgets configured.", normal_style)] + [Paragraph("", normal_style)]*5)

    b_pdf_table = Table(b_pdf_data, colWidths=[150, 90, 80, 80, 80, 60])
    b_pdf_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#F8FAFC')),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 3),
        ('TOPPADDING', (0, 0), (-1, -1), 3),
        ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor('#E2E8F0')),
    ]))
    story.append(b_pdf_table)

    doc.build(story)
    buf.seek(0)
    return buf
