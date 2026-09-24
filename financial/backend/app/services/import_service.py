"""Controlled financial data import service for XLSX and CSV files."""
import io
import csv
import uuid
from datetime import date, datetime, timezone
from decimal import Decimal
from typing import Dict, Any, List, Optional
import openpyxl
from fastapi import HTTPException, status
from sqlalchemy.orm import Session
from app.models.income import Income
from app.models.expense import Expense
from app.models.category import Category
from app.models.payment_method import PaymentMethod
from app.models.user import User
from app.schemas.import_data import ImportPreviewResponse, ImportRowError, ImportResultResponse
from app.services.audit_service import record_audit
from app.services.calc_service import derive_expense_status

# Temporary in-memory staging store for previewed imports (keyed by UUID)
# Capped with timestamps for clean memory management
_IMPORT_STAGING_CACHE: Dict[str, Dict[str, Any]] = {}

def parse_date_safely(val: Any) -> Optional[date]:
    if val is None:
        return None
    if isinstance(val, (datetime, date)):
        return val.date() if isinstance(val, datetime) else val
    s = str(val).strip()
    if s in ("-", "", "None", "N/A"):
        return None
    for fmt in ("%Y-%m-%d", "%d-%m-%Y", "%d/%m/%Y", "%m/%d/%Y"):
        try:
            return datetime.strptime(s, fmt).date()
        except ValueError:
            pass
    return None

def parse_decimal_safely(val: Any) -> Optional[Decimal]:
    if val is None:
        return None
    s = str(val).replace(",", "").replace("₹", "").strip()
    if s in ("-", "", "None", "N/A"):
        return None
    try:
        d = Decimal(s)
        return d if d >= Decimal("0.00") else None
    except Exception:
        return None

def preview_import_file(file_bytes: bytes, filename: str, db: Session) -> ImportPreviewResponse:
    """Parse XLSX or CSV, validate rows, detect duplicates, and generate preview report."""
    is_excel = filename.lower().endswith((".xlsx", ".xlsm"))
    is_csv = filename.lower().endswith(".csv")

    if not is_excel and not is_csv:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Unsupported file format. Please upload an .xlsx or .csv file."
        )

    rows_data: List[Dict[str, Any]] = []

    if is_excel:
        try:
            wb = openpyxl.load_workbook(io.BytesIO(file_bytes), data_only=True)
            ws = wb.active
            header_row = [str(cell.value or "").strip().lower() for cell in ws[1]]
            for r_idx, row in enumerate(ws.iter_rows(min_row=2, values_only=True), start=2):
                if not any(v is not None and str(v).strip() != "" for v in row):
                    continue
                row_dict = {header_row[i] if i < len(header_row) else f"col_{i}": row[i] for i in range(len(row))}
                row_dict["_row_num"] = r_idx
                rows_data.append(row_dict)
        except Exception as e:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=f"Failed to parse Excel file: {str(e)}")
    else:
        try:
            content = file_bytes.decode("utf-8", errors="replace")
            reader = csv.DictReader(io.StringIO(content))
            for r_idx, row in enumerate(reader, start=2):
                clean_row = {k.strip().lower() if k else f"col_{i}": v for i, (k, v) in enumerate(row.items())}
                clean_row["_row_num"] = r_idx
                rows_data.append(clean_row)
        except Exception as e:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=f"Failed to parse CSV file: {str(e)}")

    if not rows_data:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="File contains no data rows.")

    errors: List[ImportRowError] = []
    valid_rows: List[Dict[str, Any]] = []
    duplicate_count = 0

    # Fetch existing IDs for duplicate detection
    existing_inc_ids = set(r[0] for r in db.query(Income.transaction_id).all())
    existing_exp_ids = set(r[0] for r in db.query(Expense.transaction_id).all())

    for row in rows_data:
        r_num = row["_row_num"]
        # Determine transaction type
        t_type = (row.get("type") or row.get("transaction_type") or "").strip().upper()
        tx_id = (row.get("id") or row.get("transaction_id") or "").strip().upper()

        if not t_type:
            if tx_id.startswith("INC-"):
                t_type = "INCOME"
            elif tx_id.startswith("EXP-"):
                t_type = "EXPENSE"
            else:
                t_type = "EXPENSE"  # default fallback

        if t_type not in ("INCOME", "EXPENSE"):
            errors.append(ImportRowError(row_number=r_num, field="type", error_type="ERROR", message="Type must be INCOME or EXPENSE"))
            continue

        # Parse date
        dt_val = parse_date_safely(row.get("date") or row.get("bill_date") or row.get("transaction_date"))
        if not dt_val:
            errors.append(ImportRowError(row_number=r_num, field="date", error_type="ERROR", message="Invalid or missing date (expected YYYY-MM-DD or DD-MM-YYYY)"))
            continue

        # Parse amount
        amt_val = parse_decimal_safely(row.get("amount") or row.get("total_amount") or row.get("amount_received") or row.get("total bill amount"))
        if amt_val is None or amt_val <= Decimal("0.00"):
            errors.append(ImportRowError(row_number=r_num, field="amount", error_type="ERROR", message="Invalid or zero amount"))
            continue

        title = (row.get("source") or row.get("description") or row.get("expense description") or row.get("vendor") or row.get("contributor") or "").strip()
        if not title:
            errors.append(ImportRowError(row_number=r_num, field="title", error_type="ERROR", message="Missing source or description"))
            continue

        cat_name = (row.get("category") or "Other").strip()
        method_name = (row.get("payment_method") or row.get("payment method") or "Other").strip()
        ref_num = (row.get("reference_number") or row.get("ref") or row.get("receipt no.") or row.get("notes") or "").strip() or None
        notes = (row.get("notes") or "").strip() or None

        is_dup = (tx_id in existing_inc_ids) if t_type == "INCOME" else (tx_id in existing_exp_ids)
        if is_dup:
            duplicate_count += 1
            errors.append(ImportRowError(row_number=r_num, field="transaction_id", error_type="WARNING", message=f"Transaction ID {tx_id} already exists in database"))

        valid_rows.append({
            "row_number": r_num,
            "type": t_type,
            "transaction_id": tx_id,
            "date": dt_val.isoformat(),
            "title": title,
            "category": cat_name,
            "amount": float(amt_val),
            "payment_method": method_name,
            "reference_number": ref_num,
            "notes": notes,
            "is_duplicate": is_dup
        })

    import_key = str(uuid.uuid4())
    _IMPORT_STAGING_CACHE[import_key] = {
        "filename": filename,
        "rows": valid_rows,
        "created_at": datetime.now(timezone.utc)
    }

    warning_count = sum(1 for e in errors if e.error_type == "WARNING")
    error_count = sum(1 for e in errors if e.error_type == "ERROR")

    return ImportPreviewResponse(
        import_key=import_key,
        filename=filename,
        total_rows=len(rows_data),
        valid_rows=len(valid_rows),
        warning_count=warning_count,
        error_count=error_count,
        duplicate_count=duplicate_count,
        errors=errors,
        preview_rows=valid_rows[:25]
    )

def commit_import(import_key: str, duplicate_action: str, admin_user: User, db: Session) -> ImportResultResponse:
    """Transactionally commit previewed financial rows with rollback on fatal error."""
    staging = _IMPORT_STAGING_CACHE.get(import_key)
    if not staging:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Import preview session expired or not found. Please upload file again."
        )

    rows = staging["rows"]
    if not rows:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="No valid rows to commit.")

    created_count = 0
    updated_count = 0
    skipped_count = 0

    cat_map: Dict[tuple, str] = {}
    method_map: Dict[str, str] = {}

    def get_category_id(name: str, c_type: str) -> str:
        key = (c_type, name.lower())
        if key in cat_map:
            return cat_map[key]
        c = db.query(Category).filter(Category.name.ilike(name), Category.type == c_type).first()
        if not c:
            c = Category(name=name, type=c_type, is_active=True)
            db.add(c)
            db.flush()
        cat_map[key] = c.id
        return c.id

    def get_method_id(name: str) -> str:
        key = name.lower()
        if key in method_map:
            return method_map[key]
        m = db.query(PaymentMethod).filter(PaymentMethod.name.ilike(name)).first()
        if not m:
            m = PaymentMethod(name=name, is_active=True)
            db.add(m)
            db.flush()
        method_map[key] = m.id
        return m.id

    try:
        for r in rows:
            t_type = r["type"]
            tx_id = r.get("transaction_id") or ""
            dt = datetime.strptime(r["date"], "%Y-%m-%d").date()
            amt = Decimal(str(r["amount"]))
            title = r["title"]
            c_id = get_category_id(r["category"], t_type)
            m_id = get_method_id(r["payment_method"])
            ref = r["reference_number"]
            notes = r["notes"]
            is_dup = r["is_duplicate"]

            if is_dup:
                if duplicate_action == "SKIP":
                    skipped_count += 1
                    continue
                elif duplicate_action == "UPDATE":
                    if t_type == "INCOME":
                        existing_inc = db.query(Income).filter(Income.transaction_id == tx_id).first()
                        if existing_inc:
                            existing_inc.date = dt
                            existing_inc.source = title
                            existing_inc.category_id = c_id
                            existing_inc.amount = amt
                            existing_inc.payment_method_id = m_id
                            existing_inc.reference_number = ref
                            existing_inc.notes = notes
                            updated_count += 1
                    else:
                        existing_exp = db.query(Expense).filter(Expense.transaction_id == tx_id).first()
                        if existing_exp:
                            existing_exp.bill_date = dt
                            existing_exp.description = title
                            existing_exp.category_id = c_id
                            existing_exp.total_amount = amt
                            existing_exp.payment_method_id = m_id
                            existing_exp.reference_number = ref
                            existing_exp.notes = notes
                            updated_count += 1
                    continue

            # Generate business ID if missing
            if not tx_id:
                prefix = "INC" if t_type == "INCOME" else "EXP"
                seq = (db.query(func.count(Income.id)).scalar() if t_type == "INCOME" else db.query(func.count(Expense.id)).scalar()) + created_count + 1
                tx_id = f"{prefix}-{seq:03d}"

            if t_type == "INCOME":
                new_inc = Income(
                    transaction_id=tx_id,
                    date=dt,
                    source=title,
                    category_id=c_id,
                    amount=amt,
                    payment_method_id=m_id,
                    received_by=admin_user.name,
                    reference_number=ref,
                    notes=notes,
                    status="CLEARED",
                    created_by=admin_user.id
                )
                db.add(new_inc)
                created_count += 1
            else:
                new_exp = Expense(
                    transaction_id=tx_id,
                    bill_date=dt,
                    description=title,
                    category_id=c_id,
                    vendor=title,
                    total_amount=amt,
                    amount_paid=Decimal("0.00"),
                    status="PENDING",
                    payment_method_id=m_id,
                    reference_number=ref,
                    notes=notes,
                    created_by=admin_user.id
                )
                db.add(new_exp)
                created_count += 1

        db.flush()

        record_audit(
            db=db,
            user_id=admin_user.id,
            user_name=admin_user.name,
            action="IMPORT_COMPLETED",
            entity_type="SYSTEM",
            entity_id=staging["filename"],
            after_data={
                "total_processed": len(rows),
                "created_count": created_count,
                "updated_count": updated_count,
                "skipped_count": skipped_count,
                "duplicate_action": duplicate_action
            }
        )

        db.commit()
        # Clean cache
        del _IMPORT_STAGING_CACHE[import_key]

        return ImportResultResponse(
            total_processed=len(rows),
            created_count=created_count,
            updated_count=updated_count,
            skipped_count=skipped_count,
            message=f"Import successful! Created {created_count} records, updated {updated_count}, and skipped {skipped_count}."
        )
    except Exception as exc:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Import transaction failed and was rolled back: {str(exc)}"
        )

commit_staged_import = commit_import
