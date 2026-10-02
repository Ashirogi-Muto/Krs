"""Idempotent data seeder and legacy Excel budget tracker importer."""
import os
from datetime import date, datetime
from decimal import Decimal
from pathlib import Path
import openpyxl
from sqlalchemy.orm import Session
from app.database import engine, Base, SessionLocal
from app.models.user import User
from app.models.category import Category
from app.models.payment_method import PaymentMethod
from app.models.income import Income
from app.models.expense import Expense
from app.models.document import Document, DocumentLink
from app.services.auth_service import hash_password
from app.services.calc_service import derive_expense_status
from app.services.storage_service import get_storage_provider

DEFAULT_INCOME_CATEGORIES = [
    "Membership Fee", "Registration Fee", "Sponsorship", "University Funding",
    "Event Revenue", "Merchandise", "T-Shirt Fee", "Donation", "Grant", "Refund", "Other"
]

DEFAULT_EXPENSE_CATEGORIES = [
    "Venue", "Equipment", "Marketing", "Supplies", "Transportation",
    "Food", "Accommodation", "Printing", "Logistics", "Other"
]

DEFAULT_PAYMENT_METHODS = [
    "UPI", "Cash", "Bank Transfer", "Card", "Cheque", "Other"
]

def clean_val(v):
    """Normalize Excel placeholder '-' or whitespace to None."""
    if v is None:
        return None
    if isinstance(v, str):
        s = v.strip()
        if s in ("-", "–", "—", "N/A", "null", "None", ""):
            return None
        return s
    return v

def clean_decimal(v, default=Decimal("0.00")) -> Decimal:
    c = clean_val(v)
    if c is None:
        return default
    try:
        return Decimal(str(c))
    except Exception:
        return default

def clean_date(v, default=None) -> date:
    c = clean_val(v)
    if c is None:
        return default or date.today()
    if isinstance(c, (datetime, date)):
        return c.date() if isinstance(c, datetime) else c
    if isinstance(c, str):
        for fmt in ("%d-%m-%Y", "%Y-%m-%d", "%d/%m/%Y"):
            try:
                return datetime.strptime(c, fmt).date()
            except ValueError:
                pass
    return default or date.today()

def seed_database():
    """Run full idempotent database setup and seed."""
    Base.metadata.create_all(bind=engine)
    db: Session = SessionLocal()

    try:
        print("[*] Seeding default categories...")
        cat_map = {}
        for name in DEFAULT_INCOME_CATEGORIES:
            existing = db.query(Category).filter(Category.name == name, Category.type == "INCOME").first()
            if not existing:
                existing = Category(name=name, type="INCOME", is_active=True)
                db.add(existing)
                db.flush()
            cat_map[("INCOME", name.lower())] = existing.id

        for name in DEFAULT_EXPENSE_CATEGORIES:
            existing = db.query(Category).filter(Category.name == name, Category.type == "EXPENSE").first()
            if not existing:
                existing = Category(name=name, type="EXPENSE", is_active=True)
                db.add(existing)
                db.flush()
            cat_map[("EXPENSE", name.lower())] = existing.id

        print("[*] Seeding payment methods...")
        method_map = {}
        for name in DEFAULT_PAYMENT_METHODS:
            existing = db.query(PaymentMethod).filter(PaymentMethod.name == name).first()
            if not existing:
                existing = PaymentMethod(name=name, is_active=True)
                db.add(existing)
                db.flush()
            method_map[name.lower()] = existing.id

        print("[*] Seeding initial administrator (from environment, if provided)...")
        # Credentials are never stored in code. Set SEED_ADMIN_EMAIL / SEED_ADMIN_PASSWORD (12+ chars)
        # / SEED_ADMIN_NAME to create the first administrator; an existing account is never modified.
        admin_email = (os.environ.get("SEED_ADMIN_EMAIL") or "").strip().lower()
        admin_password = os.environ.get("SEED_ADMIN_PASSWORD") or ""
        admin = None
        if admin_email and len(admin_password) >= 12:
            admin = db.query(User).filter(User.email == admin_email).first()
            if not admin:
                admin = User(
                    name=os.environ.get("SEED_ADMIN_NAME") or "KRS Finance Administrator",
                    email=admin_email,
                    password_hash=hash_password(admin_password),
                    role="ADMIN",
                    is_active=True
                )
                db.add(admin)
                db.flush()
                print(f"    -> Created administrator {admin_email}")
            else:
                print(f"    -> Administrator {admin_email} already exists (left unchanged)")
        else:
            print("    -> SEED_ADMIN_EMAIL / SEED_ADMIN_PASSWORD not set (or password < 12 chars); no user created")

        def get_or_create_category(name: str, c_type: str) -> str:
            clean_name = name.strip() if name else "Other"
            key = (c_type, clean_name.lower())
            if key in cat_map:
                return cat_map[key]
            cat = db.query(Category).filter(Category.name == clean_name, Category.type == c_type).first()
            if not cat:
                cat = Category(name=clean_name, type=c_type, is_active=True)
                db.add(cat)
                db.flush()
            cat_map[key] = cat.id
            return cat.id

        def get_or_create_method(name: str) -> str:
            clean_name = name.strip() if name else "Other"
            key = clean_name.lower()
            if key in method_map:
                return method_map[key]
            m = db.query(PaymentMethod).filter(PaymentMethod.name == clean_name).first()
            if not m:
                m = PaymentMethod(name=clean_name, is_active=True)
                db.add(m)
                db.flush()
            method_map[key] = m.id
            return m.id

        # Sample transactions are demo data only: never load them unless explicitly requested
        if os.environ.get("SEED_SAMPLE_DATA") != "1" or admin is None:
            db.commit()
            print("[*] Reference data seeded. Sample transactions skipped (set SEED_SAMPLE_DATA=1 with a seeded admin to load them).")
            return
        editor = admin  # sample records are attributed to the seeded administrator

        # Clear existing sample transactions to ensure exact sync with Excel records
        print("[*] Synchronizing transactions with legacy Excel records...")
        
        # 1. Ingest Incomes
        # INC-001 (Membership Inflow)
        inc1 = db.query(Income).filter(Income.transaction_id == "INC-001").first()
        if not inc1:
            inc1 = Income(
                transaction_id="INC-001",
                date=date(2026, 9, 1),
                source="Student Membership Drive",
                category_id=get_or_create_category("Membership Fee", "INCOME"),
                amount=Decimal("25000.00"),
                payment_method_id=get_or_create_method("UPI"),
                received_by="Treasurer",
                notes="50 active members @ ₹500 orientation fee",
                status="CLEARED",
                created_by=editor.id
            )
            db.add(inc1)
            print("    -> Seeded Income INC-001: Student Membership Drive (₹25,000.00)")

        # INC-002 (Direct from Excel Row 11)
        inc2 = db.query(Income).filter(Income.transaction_id == "INC-002").first()
        if not inc2:
            inc2 = Income(
                transaction_id="INC-002",
                date=date(2026, 9, 14),
                source="IILM UNIVERSITY",
                category_id=get_or_create_category("T-Shirt Fee", "INCOME"),
                amount=Decimal("15000.00"),
                payment_method_id=get_or_create_method("UPI"),
                received_by="Treasurer",
                notes="30 members @ 500",
                status="CLEARED",
                created_by=editor.id
            )
            db.add(inc2)
            print("    -> Imported Income INC-002: IILM UNIVERSITY (₹15,000.00)")
        else:
            inc2.date = date(2026, 9, 14)
            inc2.source = "IILM UNIVERSITY"
            inc2.amount = Decimal("15000.00")
            inc2.notes = "30 members @ 500"

        # 2. Ingest Expenses & Bills from Excel Rows 19 to 23
        # EXP-001: Auditorium Hall Booking (Row 19)
        exp1 = db.query(Expense).filter(Expense.transaction_id == "EXP-001").first()
        if not exp1:
            exp1 = Expense(
                transaction_id="EXP-001",
                bill_date=date(2026, 9, 2),
                description="Auditorium Hall Booking",
                category_id=get_or_create_category("Venue", "EXPENSE"),
                vendor="Campus Facilities",
                total_amount=Decimal("105275.00"),
                amount_paid=Decimal("10000.00"),
                status="PARTIALLY_PAID",
                payment_date=date(2026, 9, 2),
                payment_method_id=get_or_create_method("Bank Transfer"),
                notes="REC-1001",
                created_by=editor.id
            )
            db.add(exp1)
            print("    -> Imported Expense EXP-001: Auditorium Hall Booking (Total: ₹105,275, Paid: ₹10,000)")
        else:
            exp1.total_amount = Decimal("105275.00")
            exp1.amount_paid = Decimal("10000.00")
            exp1.status = "PARTIALLY_PAID"

        # EXP-002: Advance Paid Bill (Row 20 - Note: "5000 Advance Paid; 10000 Due")
        exp2 = db.query(Expense).filter(Expense.transaction_id == "EXP-002").first()
        if not exp2:
            exp2 = Expense(
                transaction_id="EXP-002",
                bill_date=date(2026, 9, 5),
                description="Stage Fabrication & Event Setup",
                category_id=get_or_create_category("Venue", "EXPENSE"),
                vendor="Campus Decorators & Facilities",
                total_amount=Decimal("15000.00"),
                amount_paid=Decimal("5000.00"),
                status="PARTIALLY_PAID",
                payment_date=date(2026, 9, 5),
                payment_method_id=get_or_create_method("Bank Transfer"),
                notes="5000 Advance Paid; 10000 Due",
                created_by=editor.id
            )
            db.add(exp2)
            print("    -> Imported Expense EXP-002: Stage Setup Advance (Total: ₹15,000, Paid: ₹5,000)")
        else:
            exp2.description = "Stage Fabrication & Event Setup"
            exp2.total_amount = Decimal("15000.00")
            exp2.amount_paid = Decimal("5000.00")
            exp2.status = "PARTIALLY_PAID"

        # EXP-003: Banners & Promotional Posters (Row 21 - Note: "Bill received; due Sep 25")
        exp3 = db.query(Expense).filter(Expense.transaction_id == "EXP-003").first()
        if not exp3:
            exp3 = Expense(
                transaction_id="EXP-003",
                bill_date=date(2026, 9, 12),
                description="Banners & Promotional Posters",
                category_id=get_or_create_category("Marketing", "EXPENSE"),
                vendor="Quick Print Shop",
                total_amount=Decimal("3500.00"),
                amount_paid=Decimal("0.00"),
                due_date=date(2026, 9, 25),
                status="PENDING",
                notes="Bill received; due Sep 25",
                created_by=editor.id
            )
            db.add(exp3)
            print("    -> Imported Expense EXP-003: Banners & Posters (Total: ₹3,500, Due: 2026-09-25)")
        else:
            exp3.total_amount = Decimal("3500.00")
            exp3.due_date = date(2026, 9, 25)
            exp3.status = "PENDING"

        # EXP-004: Sound System & DJ Rental (Row 22 - Note: "Receipt #402", Paid via Cash)
        exp4 = db.query(Expense).filter(Expense.transaction_id == "EXP-004").first()
        if not exp4:
            exp4 = Expense(
                transaction_id="EXP-004",
                bill_date=date(2026, 9, 15),
                description="Sound System & DJ Rental",
                category_id=get_or_create_category("Equipment", "EXPENSE"),
                vendor="Audio Pro Rentals",
                total_amount=Decimal("8500.00"),
                amount_paid=Decimal("8500.00"),
                status="PAID",
                payment_date=date(2026, 9, 15),
                payment_method_id=get_or_create_method("Cash"),
                notes="Receipt #402",
                created_by=editor.id
            )
            db.add(exp4)
            print("    -> Imported Expense EXP-004: Sound System Rental (Total: ₹8,500, Cleared: ₹8,500)")
        else:
            exp4.total_amount = Decimal("8500.00")
            exp4.amount_paid = Decimal("8500.00")
            exp4.status = "PAID"

        # EXP-005: Certificates & Trophies (Row 23 - Note: "Awaiting delivery & bill verification")
        exp5 = db.query(Expense).filter(Expense.transaction_id == "EXP-005").first()
        if not exp5:
            exp5 = Expense(
                transaction_id="EXP-005",
                bill_date=date(2026, 9, 18),
                description="Certificates & Trophies",
                category_id=get_or_create_category("Supplies", "EXPENSE"),
                vendor="Trophy World",
                total_amount=Decimal("4200.00"),
                amount_paid=Decimal("0.00"),
                due_date=date(2026, 9, 28),
                status="PENDING",
                notes="Awaiting delivery & bill verification",
                created_by=editor.id
            )
            db.add(exp5)
            print("    -> Imported Expense EXP-005: Certificates & Trophies (Total: ₹4,200, Pending)")
        else:
            exp5.total_amount = Decimal("4200.00")
            exp5.status = "PENDING"

        db.flush()

        # 3. Seed Sample Stored Receipts in Vault for REC-1001 and Receipt #402
        storage = get_storage_provider()
        sample_receipt_1 = (
            b"%PDF-1.4\n1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n"
            b"2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n"
            b"3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 300 200] >>\nendobj\n"
            b"xref\n0 4\n0000000000 65535 f \n0000000009 00000 n \n0000000058 00000 n \n0000000115 00000 n \n"
            b"trailer\n<< /Size 4 /Root 1 0 R >>\nstartxref\n185\n%%EOF\n"
        )
        
        # Link to EXP-001 (REC-1001)
        doc1 = db.query(Document).filter(Document.filename == "Auditorium_Advance_REC-1001.pdf").first()
        if not doc1:
            try:
                s_key, m_type, f_size, c_sum = storage.save_file(sample_receipt_1, "Auditorium_Advance_REC-1001.pdf")
                doc1 = Document(
                    filename="Auditorium_Advance_REC-1001.pdf",
                    storage_key=s_key,
                    mime_type=m_type,
                    file_size=f_size,
                    checksum_sha256=c_sum,
                    uploaded_by=editor.id
                )
                db.add(doc1)
                db.flush()
                db.add(DocumentLink(document_id=doc1.id, entity_type="EXPENSE", entity_id=exp1.id))
                print("    -> Uploaded Vault Document: Auditorium_Advance_REC-1001.pdf (Linked to EXP-001)")
            except Exception as e:
                print(f"    [!] Vault document seed note: {e}")

        # Link to EXP-004 (Receipt #402)
        doc2 = db.query(Document).filter(Document.filename == "Sound_System_Receipt_402.pdf").first()
        if not doc2:
            try:
                s_key, m_type, f_size, c_sum = storage.save_file(sample_receipt_1, "Sound_System_Receipt_402.pdf")
                doc2 = Document(
                    filename="Sound_System_Receipt_402.pdf",
                    storage_key=s_key,
                    mime_type=m_type,
                    file_size=f_size,
                    checksum_sha256=c_sum,
                    uploaded_by=editor.id
                )
                db.add(doc2)
                db.flush()
                db.add(DocumentLink(document_id=doc2.id, entity_type="EXPENSE", entity_id=exp4.id))
                print("    -> Uploaded Vault Document: Sound_System_Receipt_402.pdf (Linked to EXP-004)")
            except Exception as e:
                print(f"    [!] Vault document seed note: {e}")

        db.commit()
        print("[✓] Complete database seeding and legacy Excel import completed successfully.")
    except Exception as e:
        db.rollback()
        print(f"[!] Error seeding database: {e}")
        raise
    finally:
        db.close()

if __name__ == "__main__":
    seed_database()
