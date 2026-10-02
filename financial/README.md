# Kalam Robotics Society (KRS) — Financial Management Dashboard

A lightweight, institutional-grade, zero-cost financial management platform built specifically for **Kalam Robotics Society (KRS)**. It replaces legacy, error-prone manual spreadsheets (`K.R.S_Club Budget Tracker.xlsx`) with a centralized, auditable ledger, secure document vault, payment tracking, and automated institutional report generation.

---

## 1. System Capabilities & Highlights

* **Unified Financial Ledger**: Comprehensive tracking of monetary inflows (sponsorships, registrations, university grants) and consolidated outflows (bills, invoices, reimbursements).
* **Consolidated Bills & Payment Clearance**: Eliminates split data models. Bills and expenses are tracked in a unified ledger with automated balance tracking (`amount_pending = total_amount - amount_paid`), overdue detection, and partial/full clearance workflows.
* **Private Document & Receipt Vault**: High-security storage for receipts, vendor quotes, and payment proofs with binary magic-byte verification (JPEG, PNG, WebP, PDF), randomized UUID storage keys, and authenticated inline streaming (`X-Content-Type-Options: nosniff`).
* **Institutional Multi-Sheet Excel Reports**: Generates full 6-sheet audit workbooks (`Financial Summary`, `Income Register`, `Expense & Bills Register`, `Outstanding Bills`, `Monthly Cash Flow`, `Category Breakdown`) using `openpyxl`.
* **Publication-Ready PDF Statements**: Executive financial statements generated using `reportlab` with official KRS branding, summary balances, unpaid liability breakdown, and advisor sign-off blocks.
* **Append-Only Audit Trail**: Immutable logging capturing every transaction creation, payment clearance, cancellation/voiding, and document operation with previous/after states and actor metadata.
* **Server-Enforced RBAC**: Two distinct roles (`VIEWER` and `EDITOR`) enforced strictly at backend API boundary with Argon2id password hashing and HttpOnly/SameSite session security.
* **Zero Paid Infrastructure**: Designed strictly for free-tier hosting (Render / Railway for FastAPI backend & PostgreSQL, Vercel for Next.js frontend, Cloudflare R2 / Backblaze B2 for document storage).

---

## 2. Architecture & Tech Stack

```
                                  ┌────────────────────────┐
                                  │      Web Browser       │
                                  │  (Next.js 15 Frontend) │
                                  └───────────┬────────────┘
                                              │ HTTP (Port 3050)
                                              ▼
┌────────────────────────────────────────────────────────────────────────────────────────┐
│ FastAPI Application Server (Port 8050)                                                 │
│                                                                                        │
│  ┌───────────────────────┐   ┌────────────────────────┐   ┌─────────────────────────┐  │
│  │     Auth Service      │   │  Calculation Engine    │   │     Storage Service     │  │
│  │ (Argon2id + JWT Http) │   │ (Decimal Exact Finance)│   │ (Local Vault / S3 / R2) │  │
│  └───────────────────────┘   └────────────────────────┘   └─────────────────────────┘  │
│  ┌───────────────────────┐   ┌────────────────────────┐   ┌─────────────────────────┐  │
│  │     Report Service    │   │     Audit Service      │   │    Security Middleware  │  │
│  │ (Openpyxl + ReportLab)│   │ (Append-Only Log DB)   │   │  (CORS + CSRF + Headers)│  │
│  └───────────────────────┘   └────────────────────────┘   └─────────────────────────┘  │
└───────────────────────────┬────────────────────────────────────────────┬───────────────┘
                            │                                            │
                            ▼                                            ▼
           ┌────────────────────────────────┐           ┌────────────────────────────────┐
           │     Database Storage Engine    │           │    Private File Repository     │
           │ SQLite (Dev) / Postgres (Prod) │           │ Local Vault / Cloudflare R2    │
           └────────────────────────────────┘           └────────────────────────────────┘
```

### Component Details
* **Backend**: Python 3.11, FastAPI, SQLAlchemy 2.0 (declarative 2.0 style), Pydantic v2, Alembic, `argon2-cffi`, `pyjwt`, `openpyxl`, `reportlab`.
* **Frontend**: Next.js 15+ (App Router, Turbopack), React 19, TypeScript, Lucide React icons, CSS variable-based dark financial design system.
* **Database**: SQLite for local lightweight development; PostgreSQL 16 for production deployment.
* **Logging**: Rotating log files (`maxBytes=10MB`, `backupCount=5`) output to `logs/backend.log`.

---

## 3. Port Safety & Host Guidelines

To prevent conflicts with host production services, this project uses dedicated unassigned port allocations:

| Service | Port | Environment |
|---|---|---|
| **KRS Backend API** | `8050` | Local & Container |
| **KRS Frontend Web** | `3050` | Local & Container |
| **Compose PostgreSQL** | `5439` | Container Only (Never collides with host 5432) |

> ⚠️ **CRITICAL HOST SAFETY**: Never bind to or disturb host reserved ports: `22` (SSH), `25`/`465`/`587` (Mail), `80`/`443` (Reverse Proxy), `3000` (Server Dash), `3002` (Portfolio), `5432` (Host Postgres), `9180` (Webmail).

---

## 4. Local Development Setup

### Prerequisites
* Python 3.11+
* Node.js 20+ and `npm`

### Step 1: Clone and Configure Backend
```bash
cd backend

# Create and activate Python virtual environment
python3 -m venv venv
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Run database migrations
alembic upgrade head

# Seed initial categories, payment methods, test accounts, and legacy Excel data
python -m app.seed
```

### Step 2: Start Backend Server
```bash
# Binds deterministically to port 8050
uvicorn app.main:app --host 127.0.0.1 --port 8050 --reload
```
API Documentation will be available at: `http://127.0.0.1:8050/docs`.

### Step 3: Configure and Start Frontend
In a separate terminal window:
```bash
cd frontend

# Install dependencies
npm install

# Start Next.js development server on port 3050
npm run dev -- -p 3050
```
Open your browser at: `http://localhost:3050`.

---

## 5. Seed Test Credentials

The database seeder (`python -m app.seed`) automatically provisions two testing accounts:

| Email | Password | Role | Permissions |
|---|---|---|---|

---

## 6. Automated Testing & Verification

### Running Backend Pytest Suite
The backend includes 22 automated integration and unit tests covering authentication, RBAC, income/expense CRUD, payment clearance, magic-byte file validation, report generation, and tamper resistance:

```bash
cd backend
source venv/bin/activate
pytest tests -v
```

### Running Frontend Build Check
Verify TypeScript typing and production bundle compilation:

```bash
cd frontend
npm run build
```

---

## 7. Production Deployment Guide (Free-Tier Compatible)

### Option A: Render (Backend) + Vercel (Frontend) + Cloudflare R2 (Storage)

1. **Deploy Backend on Render**:
   - Connect the repository to [Render](https://render.com).
   - Use the provided `deployment/render.yaml` Blueprint or create a Python Web Service.
   - Root Directory: `backend`
   - Build Command: `pip install -r requirements.txt && alembic upgrade head`
   - Start Command: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`
   - Attach a free Render PostgreSQL database.
   - Configure Environment Variables:
     - `APP_ENV=production`
     - `SECRET_KEY=<32-byte-cryptographic-random-string>`
     - `DATABASE_URL=<Render-Postgres-Connection-String>`
     - `ALLOWED_ORIGINS=https://krs-financial.vercel.app`
     - `COOKIE_SECURE=True`
     - `STORAGE_TYPE=s3`
     - `STORAGE_BUCKET=<r2-bucket-name>`
     - `STORAGE_ACCESS_KEY=<r2-access-key>`
     - `STORAGE_SECRET_KEY=<r2-secret-key>`
     - `STORAGE_ENDPOINT=https://<account-id>.r2.cloudflarestorage.com`

2. **Deploy Frontend on Vercel**:
   - Import the `frontend` directory into [Vercel](https://vercel.com).
   - Framework Preset: Next.js.
   - Environment Variables:
     - `NEXT_PUBLIC_API_URL=https://<your-render-backend-name>.onrender.com`

---

### Option B: Self-Hosted Docker Compose

To deploy the entire stack locally or on a private server:

```bash
cd deployment
docker compose up -d --build
```
* Frontend: `http://localhost:3050`
* Backend API: `http://localhost:8050`
* PostgreSQL Database: `127.0.0.1:5439` (isolated volume)

---

## 8. Security Architecture & Threat Surface Controls

| Threat Vector | Mitigation Strategy Implemented |
|---|---|
| **Credential Compromise** | Passwords hashed using OWASP-recommended Argon2id (`time_cost=2`, `memory_cost=65536`, `parallelism=1`). No plaintext storage. |
| **XSS & Token Theft** | Auth tokens stored exclusively in `HttpOnly`, `SameSite=Lax` (or `None` for cross-domain HTTPS) session cookies. Storing tokens in `localStorage` or `sessionStorage` is strictly prohibited. |
| **CSRF Attacks** | Custom header check (`X-Requested-With: XMLHttpRequest`) enforced by backend dependency on all state-modifying requests (`POST`, `PUT`, `DELETE`). |
| **Arbitrary File Upload (RCE)** | Uploaded files are strictly validated against magic bytes (`image/jpeg`, `image/png`, `image/webp`, `application/pdf`). File contents are never executed; original filenames are sanitized and stored under UUID keys. |
| **Data Tampering** | Audit log entries are strictly append-only in the database. No API endpoints exist for editing or deleting audit records. |
| **Financial Rounding Errors** | All monetary amounts are stored as exact `Numeric(12, 2)` in SQL and calculated using Python's `Decimal` module. Floating-point arithmetic is prohibited. |
| **DoS via Report Overload** | Rate-limiting middleware and strict 12-month window capping on Excel and PDF generation endpoints. |
| **Production Error Leakage** | Global exception handler masks tracebacks in `APP_ENV=production`, returning safe standardized JSON error messages while logging details to rotating server logs. |

---

## 9. Future Roadmap (Post-MVP)

* Automated OCR Receipt Parsing (Tesseract / EasyOCR self-hosted container once budget permits).
* Automated weekly email digests for overdue bills to club treasurer.
* Multi-year fiscal rollover and budget allocation caps per project team.

---

## License
MIT © Kalam Robotics Society (KRS). Built for internal organization use.

## Accounts (no default passwords)
No accounts or passwords are built into the code. Create the first administrator with environment variables, e.g.
`BOOTSTRAP_ADMIN_EMAIL=you@example.com python -m app.bootstrap_admin` (the password is prompted for, minimum 12
characters), then add further users from the admin screen. Demo transactions load only with `SEED_SAMPLE_DATA=1`.
