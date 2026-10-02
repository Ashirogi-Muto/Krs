# Kalam Robotics Society (KRS) — Production Deployment Guide
## Complete Step-by-Step Guide for Free-Tier Deployment on Render & Vercel

This guide walks you through deploying the **KRS Financial Management Dashboard** to **Render** (FastAPI backend + PostgreSQL) and **Vercel** (Next.js frontend) at **$0 hosting cost**.

---

## 1. System Architecture & Free-Tier Blueprint

```
┌─────────────────────────────────────────────────────────┐
│                      VERCEL                             │
│  - Next.js 15 App Router Frontend                      │
│  - Cost: Free Hobby Tier                                │
│  - Global Edge CDN + Automated SSL                      │
│  - URL: https://krs-financial.vercel.app                │
└───────────────────────────┬─────────────────────────────┘
                            │ HTTPS / API Requests (with Credentials)
                            ▼
┌─────────────────────────────────────────────────────────┐
│                      RENDER                             │
│  - FastAPI Backend Web Service                          │
│  - Managed PostgreSQL Database                          │
│  - Cost: Free Tier ($0/month)                           │
│  - URL: https://krs-financial-api.onrender.com          │
└───────────────────────────┬─────────────────────────────┘
                            │ Private S3 API (Zero Egress Fees)
                            ▼
┌─────────────────────────────────────────────────────────┐
│              CLOUDFLARE R2 / BACKBLAZE B2               │
│  - Private Document & Receipt Vault                     │
│  - Cost: Free (Cloudflare R2: 10 GB free / month)       │
└─────────────────────────────────────────────────────────┘
```

---

## 2. Prerequisites

1. A [GitHub](https://github.com) account with your project repository.
2. A [Render](https://render.com) account (Sign up with GitHub).
3. A [Vercel](https://vercel.com) account (Sign up with GitHub).
4. *(Optional for Receipts)* A [Cloudflare](https://cloudflare.com) account for free R2 storage, or [Backblaze B2](https://www.backblaze.com/b2/cloud-storage.html) (10 GB free).

---

## 3. Step 1: Create the Managed PostgreSQL Database on Render

1. Log into your **[Render Dashboard](https://dashboard.render.com)**.
2. Click **New +** in the top navigation and select **PostgreSQL**.
3. Configure the database settings:
   * **Name:** `krs-financial-db`
   * **Database:** `krs_financial`
   * **User:** `krs_admin`
   * **Region:** Choose the region closest to you (e.g., `Oregon (US West)` or `Frankfurt (EU)`).
   * **PostgreSQL Version:** `16` (Default)
   * **Instance Type:** Select **Free**.
4. Click **Create Database**.
5. Once created, scroll to the **Connections** section:
   * Copy the **Internal Database URL** (if deploying backend on Render) or **External Database URL**.
   * It looks like: `postgresql://krs_admin:password@dpg-xxxx.render.com/krs_financial`

---

## 4. Step 2: (Optional) Set Up Free S3 Storage (Cloudflare R2)

If you plan to upload receipts/invoices in production:
1. Log into **[Cloudflare Dashboard](https://dash.cloudflare.com)** ➔ Click **R2** in the sidebar.
2. Click **Create bucket** ➔ Name it: `krs-financial-vault`.
3. Click **Manage R2 API Tokens** ➔ **Create API Token**.
4. Permissions: **Admin Read & Write**.
5. Note down:
   * **Endpoint URL:** `https://<account_id>.r2.cloudflarestorage.com`
   * **Access Key ID:** `xxxxxxxxxxxx`
   * **Secret Access Key:** `xxxxxxxxxxxxxxxxxxxxxxxx`

> *Note: If you skip S3 initially, the backend can store files in its local container disk using `STORAGE_TYPE=local`.*

---

## 5. Step 3: Deploy Backend on Render

You can deploy the backend using either Render Blueprints (automated) or as a manual Web Service.

### Option A: Using Render Blueprint (Recommended)
The repository includes a ready-to-use Blueprint at `deployment/render.yaml`.
1. In Render Dashboard, click **New +** ➔ **Blueprint**.
2. Select your repository.
3. Render will automatically detect `deployment/render.yaml` and configure both the Web Service and PostgreSQL database.
4. Fill in the prompted secret variables and click **Apply**.

---

### Option B: Manual Web Service Setup
1. In Render Dashboard, click **New +** ➔ **Web Service**.
2. Select **Build and deploy from a Git repository** ➔ Select your repository.
3. Configure service details:
   * **Name:** `krs-financial-api`
   * **Region:** Same region as your database.
   * **Branch:** `main`
   * **Root Directory:** `backend`
   * **Runtime:** `Python 3`
   * **Build Command:**
     ```bash
     pip install --no-cache-dir -r requirements.txt && alembic upgrade head && python -m app.seed
     ```
   * **Start Command:**
     ```bash
     uvicorn app.main:app --host 0.0.0.0 --port $PORT
     ```
   * **Instance Type:** **Free**.

4. Scroll down to **Environment Variables** and add:

| Key | Value / Instructions |
|---|---|
| `APP_ENV` | `production` |
| `APP_NAME` | `KRS Financial Management API` |
| `SECRET_KEY` | Generate a 32+ char random string via terminal: `python3 -c "import secrets; print(secrets.token_urlsafe(32))"` |
| `DATABASE_URL` | Paste your Render PostgreSQL Connection URL (starts with `postgresql://...`) |
| `ALLOWED_ORIGINS` | `https://your-frontend-name.vercel.app` *(You can update this after Vercel deployment)* |
| `COOKIE_SECURE` | `True` |
| `COOKIE_SAMESITE` | `none` *(Critical: Allows cross-domain session cookies between Vercel and Render)* |
| `STORAGE_TYPE` | `local` (or `s3` if using Cloudflare R2) |
| `STORAGE_BUCKET` | `krs-financial-vault` *(Only if STORAGE_TYPE=s3)* |
| `STORAGE_ENDPOINT` | `https://<account-id>.r2.cloudflarestorage.com` *(Only if STORAGE_TYPE=s3)* |
| `STORAGE_ACCESS_KEY` | Your R2 Access Key *(Only if STORAGE_TYPE=s3)* |
| `STORAGE_SECRET_KEY` | Your R2 Secret Key *(Only if STORAGE_TYPE=s3)* |

5. Click **Create Web Service**.
6. Render will build dependencies, run migrations (`alembic upgrade head`), and seed the initial Excel data.
7. Once deployed, note your backend URL:
   👉 `https://krs-financial-api.onrender.com`

> **Understanding Render Free Tier Spin-Down:**
> On the free tier, Render puts web services to sleep after 15 minutes of inactivity. The first request after sleep takes ~30–50 seconds to spin up. Subsequent requests respond instantly in under 100ms.

---

## 6. Step 4: Deploy Frontend on Vercel

1. Log into your **[Vercel Dashboard](https://vercel.com)**.
2. Click **Add New...** ➔ **Project**.
3. Import your GitHub repository.
4. In the configuration screen:
   * **Project Name:** `krs-financial`
   * **Framework Preset:** `Next.js`
   * **Root Directory:** Click **Edit** and select **`frontend`**.
5. Expand **Environment Variables** and add:

| Key | Value |
|---|---|
| `NEXT_PUBLIC_API_URL` | `https://krs-financial-api.onrender.com` *(Your Render backend URL)* |

6. Click **Deploy**.
7. Vercel will build your Next.js application with Turbopack in ~60 seconds.
8. When complete, Vercel will provide your production domain:
   👉 `https://krs-financial.vercel.app`

---

## 7. Step 5: Final Cross-Origin Handshake (Crucial!)

Because the frontend is on `vercel.app` and the backend is on `onrender.com`, they communicate cross-origin.

1. Go back to your **Render Dashboard** ➔ Click your `krs-financial-api` service.
2. Click **Environment** in the left sidebar.
3. Update `ALLOWED_ORIGINS` to match your actual Vercel domain:
   ```
   ALLOWED_ORIGINS = https://krs-financial.vercel.app
   ```
4. Verify that:
   ```
   COOKIE_SECURE = True
   COOKIE_SAMESITE = none
   ```
5. Click **Save Changes**. Render will redeploy in 30 seconds.

---

## 8. Step 6: Verify Live Deployment

1. Open your Vercel frontend URL: `https://krs-financial.vercel.app`.
2. You will see the **KRS Financial Management** login screen.
3. Test logging in using the initial seeded accounts:
4. Verify features:
   * **Dashboard:** Check that KPIs (Income ₹40,000, Cleared ₹23,500, Cash ₹16,500) render correctly.
   * **Expenses & Bills:** Verify all Excel entries (`EXP-001` through `EXP-005`) are present.
   * **Document Vault:** Click on the receipt preview for `EXP-001` (`Auditorium_Advance_REC-1001.pdf`).
   * **Reports:** Generate and download a 6-sheet `.xlsx` or institutional `.pdf` report.

---

## 9. Production Maintenance & Security Best Practices

### Changing Default Passwords
Immediately after deployment, log in as `editor@krs.club` or connect to your Render PostgreSQL database and update the passwords for `editor@krs.club` and `viewer@krs.club`.

### Running Future Database Migrations
When code changes are pushed to GitHub, Render automatically runs the build command:
```bash
pip install -r requirements.txt && alembic upgrade head
```
This ensures new database columns or tables are created without manual intervention.

### Routine Data Backups
1. **Automated Database Backups:** Render PostgreSQL automatically creates daily backups available in the Render dashboard.
2. **Offline JSON Export:** Organization treasurers can navigate to **Reports ➔ Export JSON Snapshot** at any time to download an offline timestamped backup of all financial records.

---

## 10. Troubleshooting FAQ

#### Q: Login returns "Network Error" or does not persist on refresh.
* Check that `COOKIE_SAMESITE` on Render is set to `none` (lowercase) and `COOKIE_SECURE` is set to `True`. Cross-origin cookies between `vercel.app` and `onrender.com` require `SameSite=None; Secure`.
* Verify that `ALLOWED_ORIGINS` on Render contains your exact Vercel URL without trailing slashes.

#### Q: The first request takes 45 seconds to load.
* This is expected behavior on the Render Free Tier due to container spin-down after 15 minutes of inactivity. Once awake, performance is instant. If you want 24/7 zero-latency wakefulness, upgrade Render to the $7/month Starter tier or set up a free uptime monitor (e.g. UptimeRobot) pinging `https://krs-financial-api.onrender.com/api/health` every 10 minutes.

## Accounts (no default passwords)
No accounts or passwords are built into the code. Create the first administrator with environment variables, e.g.
`BOOTSTRAP_ADMIN_EMAIL=you@example.com python -m app.bootstrap_admin` (the password is prompted for, minimum 12
characters), then add further users from the admin screen. Demo transactions load only with `SEED_SAMPLE_DATA=1`.
