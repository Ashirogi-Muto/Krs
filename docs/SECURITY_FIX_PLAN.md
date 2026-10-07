# Security fix plan (for review, nothing changed yet)

Date: 2026-10-07. Source: `docs/SECURITY_AUDIT.md`. Owner decisions already recorded in `website/AGENT.md` §9–§12 are respected and **not** re-raised:
- the broad GHCR token stays;
- backups are covered by OCI whole-server backups (no off-site copy wanted);
- `MAIL_DAILY_LIMIT=70` stays;
- 2 confirmation emails per account per 24 h;
- the staff role table.

Accordingly, audit item H4 (backups) and the "replace the PAT" part of H1 are dropped. Of H4, only a one-line check that the OCI backup policy covers the volume holding `/var/lib/docker` is left for you.

Legend: **[W]** website (CI image + `krs-pull-deploy`), **[F]** finance (CI images + `krs-finance-deploy`), **[O]** ops/compose (installed by `krs-pull-deploy`), **[You]** owner action (I give exact steps).

---

## A. Website changes [W]

| # | Fixes | Change | Files | Visible effect |
|---|---|---|---|---|
| A1 | H2 | Override the `email` field on Users: only admins may change an email. Backup `beforeChange` check: an email change by a non-admin is refused (403). | `payload/collections/Users.ts` | None for normal use. Participants could never change email in the UI anyway. |
| A2 | H2/M3 | Refuse password changes over Payload's REST API for participant accounts (portal profile page, which asks for the current password, is the only way). Staff keep the CMS "Account" page. | `Users.ts` (hook on `req.payloadAPI === 'REST'`) | None in the UI. |
| A3 | M2 | Users collection `beforeOperation` hook for requests through Payload's own REST/GraphQL API: `login` → per-IP limit (10/min, 60/h, same as `/api/auth/login`); `forgotPassword` → refused with "use /forgot-password" (our route sends the email; Payload's own one sends nothing here but overwrites the reset token). | `Users.ts`, `lib/rateLimit.ts` | CMS login unchanged for normal use. The CMS "Forgot password?" link already points people to the site page (I'll check and point it there). |
| A4 | M2 | `graphQL: { disable: true }` (endpoint currently returns 500 for everything; nothing uses it). | `payload.config.ts` | None. |
| A5 | M3 | Logout really ends the session server-side (`logoutOperation`, removes the session id), not just the cookie. After "change password" in the portal, all *other* sessions are ended and the current device gets a fresh cookie. | `api/auth/logout/route.ts`, `api/aurix/portal/profile/route.ts` | A stolen cookie stops working at logout or password change. |
| A6 | M4 | Account pre-hijack, see **Decision 1** below. | `api/auth/register/route.ts`, `lib/auth/participant.ts`, `(auth)/verify-email`, claim route | Depends on choice. |
| A7 | M4 | `/api/aurix/portal/claim` and `/profile` require a confirmed email (the portal UI already gates; this closes the API). | 2 route files | None for confirmed users. |
| A8 | M1 | Rate-limit keys: IPv6 addresses bucketed by /64 (one home line = one key), IPv4 unchanged. | `lib/rateLimit.ts` (+ unit tests) | Stops bypassing every per-IP limit by rotating IPv6 addresses. |
| A9 | M1 | Cloudflare Turnstile on sign-up, forgot-password, resend-confirmation and website forms. Code ships **off**; it turns on only when you set `TURNSTILE_SITE_KEY`/`TURNSTILE_SECRET_KEY` (**Decision 4**). CSP gains `challenges.cloudflare.com` only when on. | 4 routes + 3 forms + `next.config.mjs` | Invisible/managed challenge on those forms when on. |
| A10 | M1 | Account name on sign-up/profile limited to letters, spaces and `.'-` (any language), 2–80 chars, so links/text can't be injected into "Hi {name}" emails. | `api/auth/register`, `profile` route | A name with digits/URLs is refused with a clear message. |
| A11 | L1 | Student ID files served with `Cache-Control: private, no-store` (browsers and Cloudflare never cache them). | `collections/Registrations.ts` (`upload.modifyResponseHeaders`) | None. |
| A12 | L2 | Team registration "account required" becomes the default; anonymous registration needs an explicit `AURIX_REQUIRE_ACCOUNT=0`. Production already has `=1`, so no change there. | `api/aurix/register/route.ts`, `components/blocks/aurix.tsx` | None in production. |
| A13 | L3 | `/og` image endpoint: per-IP limit (60/min) and only the known `event` slugs or short `title`/`subtitle` (as now). | `app/og/route.tsx` | None for link previews. |
| A14 | L4 | Footer social links (Site settings) validated like every other CMS link (http(s), mailto, tel, site path). | `globals/SiteSettings.ts`, `lib/site-settings.ts` | Saving a `javascript:` link is refused. |
| A15 | L5 | Check-in API: `id` must be a positive integer. | `api/admin/check-in/route.ts` | None. |
| A16 | L8 | Delete dead code: `lib/auth/jwt.ts` (custom JWT with a hard-coded fallback secret, unused) + its 4 tests in `business-logic.test.ts`, and `lib/storage/index.ts` (unused, allowed SVG). Fix the CLAUDE.md line that mentions the storage provider. | 3 files + CLAUDE.md | Test count 73 → ~69 plus the new tests below. |

New tests (node:test): IPv6 /64 bucketing; email-change refused for a participant and allowed for an admin (access functions/hook unit-tested); name validation; `isSafeHref` on social links; register flag default.

## B. Finance changes [F]

| # | Fixes | Change | Files | Visible effect |
|---|---|---|---|---|
| B1 | H3 | Login lockout keyed by **account + network** (5 failures → 15 min for that account from that IP//64), plus a per-account cap (30 failures/hour from all networks → 15 min). An attacker can no longer lock you out from one IP. | `services/login_guard.py`, `api/auth.py` | Owner/treasurer can still log in from their own network while someone else is guessing. |
| B2 | M6 | Always run an Argon2 check (dummy hash when the username doesn't exist) so response time doesn't reveal valid usernames; at most 4 password checks at once (64 MiB each, container limit 512 MB). | `api/auth.py`, `services/auth_service.py` | None. |
| B3 | M10 | Security headers on every finance page: CSP (`default-src 'self'`, Next needs `'unsafe-inline'` for scripts/styles; `frame-src 'self'` for the PDF preview), `X-Frame-Options: SAMEORIGIN`, `nosniff`, `Referrer-Policy`, `Permissions-Policy`; hide `x-powered-by`. | `frontend/next.config.ts` | None visually. |
| B4 | bug | The PDF preview iframe is currently blocked: the API sends `X-Frame-Options: DENY` on the stream response too. Stream response → `SAMEORIGIN` + `frame-ancestors 'self'`. | `main.py`, `api/documents.py` | PDF preview in the Documents drawer works. |
| B5 | M6 | Download filename: RFC 5987 header (`filename*=UTF-8''…`) + ASCII fallback, quotes/CR/LF stripped. Fixes the 500 for non-English filenames. | `api/documents.py` | Hindi/odd filenames download fine. |
| B6 | M6 | Upload size enforced while reading (stop at 10 MB) instead of after loading the whole file. | `api/documents.py` | Same 10 MB limit. |
| B7 | M6 | Log lines built with `json.dumps` (no injection via URL paths / error text). | `main.py` | Same log format, now always valid JSON. |
| B8 | M6 | Excel report: text cells starting with `= + - @` (and tab/CR) written as text, not formulas. | `services/report_service.py` | Such cells show a leading `'` in Excel. |
| B9 | M6 | Search: `%` and `_` typed by the user are matched literally. `validate_csrf` added to the two POST report routes. | `services/search_service.py`, `api/reports.py` | None. |
| B10 | M5 | `PUT /api/expenses/{id}` no longer accepts `amount_paid` (the UI never sends it: payments go through "Record payment", which keeps the payment history). Changing `total_amount` below what is already paid is refused. | `schemas/expense.py`, `api/expenses.py` | None in the UI. |
| B11 | M5 | Audit row written in the **same** transaction as the change it describes (expenses, income, documents, budgets, projects, payments, admin, team). | the API/service files that call `record_audit` + `db.commit()` twice | None. |
| B12 | M5 | Payment recording locks the expense row (`SELECT … FOR UPDATE`), so two simultaneous payments can't overpay. | `services/payment_service.py` | None. |
| B13 | M5 | New Alembic migration `004_audit_append_only`: Postgres trigger that rejects `UPDATE`/`DELETE` on `audit_logs` (additive; SQLite tests skip it). | `migrations/versions/004_…py` | Audit trail can't be edited by the app. |
| B14 | M5 | `provision_accounts()` only **creates** missing accounts; it no longer re-activates or changes the role of existing ones on every restart (a deactivated account stays deactivated after a deploy). | `provision.py` | As described. |
| B15 | M7 | PyJWT 2.7.0 → 2.15.x; frontend Next 16.3.5 → 16.3.6 (lockfile). | `requirements.txt`, `frontend/package*.json` | None. |

All 43 backend tests must pass; new tests for B1, B2 (timing path), B5, B8, B9, B10, B12, B14.

## C. Ops / CI changes [O]

| # | Fixes | Change | Files | Effect |
|---|---|---|---|---|
| C1 | M8 | Postgres container stops reading the whole `.env` (it got `PAYLOAD_SECRET` and `MAIL_PASSWORD`): it gets only `POSTGRES_USER/PASSWORD/DB`. | `ops/deploy/compose.yml` | **Recreates `krs-website-postgres` once** (data volume untouched): website + both finance portals unavailable ~10–20 s. See Decision 3. |
| C2 | M8 | `cap_drop: [ALL]` + `no-new-privileges` on `krs-web`, both finance APIs and both finance web containers (all run as non-root and need no capabilities). Not on Postgres (its entrypoint needs them). No read-only root (Next writes its page cache). | both compose files | Containers recreated during the normal deploy. |
| C3 | H1 | Pin every GitHub Action to a full commit SHA (comment keeps the version). | `.github/workflows/*.yml` | None. |
| C4 | M7 | CI: `npm audit --omit=dev --audit-level=critical` (website + finance frontend) and `pip-audit` (finance backend) before building. Critical-only for now because Payload's transitive "high" items have no fix yet; the report is shown in the job summary. | workflows | A build stops on a *critical* advisory. |
| C5 | L9 | Root `.gitignore`: `.env*` (except examples), `*.docx`, `*.pdf` at the root, `.private_uploads/`, `logs/`. | `.gitignore` | Stray brochures/PDFs can't be committed by accident. |
| C6 | docs | `docs/SECURITY_AUDIT.md`: mark H4 and the PAT item as owner-decided; record what was fixed. `website/AGENT.md` §6 checklist + a dated §13 entry; `financial/AGENT.md`; HANDOFF "what's left". | docs | — |

## D. Not changing (and why)

- **Keep the 172.17.0.1 port publishing.** Attaching NPM to `krs_internal` instead touches the shared NPM container (memory: no casual changes to shared services). If you want it, it's a separate step.
- **CSP with nonces** on the website: large change across the whole site for a modest gain while React already blocks `javascript:` URLs. Later, if wanted.
- **Short links to any URL by Media:** your role table gives Media short links; changing who may create external links is your call, not a security bug.
- **Treasurer sees contacts in the finance CSV:** matches the role table agreed on 2 Oct.
- **`/api/access`** (public permission map): informational only; blocking it means editing Payload's generated route file.
- **Finance uvicorn `--forwarded-allow-ips=*`:** the login limiter reads NPM's `X-Real-IP`, not the uvicorn client address; changing it is brittle (Docker gateway IP).

## E. Decisions needed from you

1. **Pre-hijack fix (A6).** Someone can sign up with *your* address, and if you click that confirmation email, their account (their password) becomes confirmed with your email. Options:
   - **(a) Recommended:** the confirmation page asks for the account password before confirming. The real owner of a hijacked sign-up doesn't know it, so it can't be confirmed; they use "Forgot password" instead, which confirms the address, sets their own password and ends every other session. Cost: one extra field when confirming.
   - **(b)** Confirming ends all sessions of that account; nothing else changes. Weaker, since the attacker can just log in again with the password they chose.
   - **(c)** Leave it.
2. **Session length.** Website logins currently last 7 days (all accounts). Keep 7 days, or shorten (e.g. 24 h for everyone; Payload has one setting per collection, not per role)?
3. **When to restart the database once (C1).** Website + finance down ~10–20 s. Now-ish, or at a quiet time you name?
4. **Turnstile (A9).** Ship the code switched off and you create the widget later, or skip it entirely?
5. **Finance passwords (H3).** All three accounts use the same password on Official and Unofficial. I can generate new random, different passwords for the Unofficial ledger and set them (you read them from the env file and give them to the treasurer/president), or you do it with `sudo krs-finance-passwd`. Which?

## F. Your actions (I can't do these)

1. **Cloudflare Access for `finance.` and `ledger.`:** Zero Trust → Access → Applications → Self-hosted, both hostnames, policy "Emails: <the 3–4 people>", one-time PIN. This adds a second factor in front of the finance logins.
2. **GitHub → krs → Settings → Branches:** protect `claude/deploy-ready` and `main` (no force-push, no deletion).
3. **OCI console:**
   - Security list / NSG for the instance: only 22, 80, 443 from the internet. Docker ports such as 81, 5672, 15672, 6379, 6333, 5433, 8080, 3002 and 9180 bypass ufw.
   - Confirm the backup policy covers the volume with `/var/lib/docker`.
4. Delete the old env copies in `/var/backups/krs` (`env-before-mail-*`, `env.*.pre-launch`) when you no longer need them, and rotate the NPM admin password (already on your list).

## G. How it ships

1. Website: tests + `tsc`.
2. Commit and push to `claude/deploy-ready`. CI builds the website and finance images; with C4, the audits run first.
3. `sudo krs-db-backup`, record counts, then `sudo krs-pull-deploy`. This installs the compose changes, deploys the website (its pre-deploy backup, health check and rollback) and then finance. Its `docker compose up -d` also recreates Postgres for C1, at the time chosen in Decision 3.
4. Finance migration `004` runs automatically on container start (`alembic upgrade head`).
5. Verify:
   - counts are identical before and after;
   - pages return 200;
   - website login and finance login work (president, via the live URL);
   - the PDF preview works;
   - with a test participant on a local copy: an email change is refused (REST 403) and REST forgot-password is refused;
   - logout kills the cookie server-side;
   - `docker inspect` shows the database without `PAYLOAD_SECRET`.
6. No schema change on the website, so no Payload migration.

---

## Security & Threat Surface Analysis (35 domains)

Domain files last reviewed 2026-09-25, so none are stale. Checklists read: 01, 02, 04, 05, 09, 10, 27, 29.

- **Domain 01 (AuthN):** Applicable.
  - Payload REST login: per-IP limit (A3).
  - Server-side session revocation on logout and password change (A5).
  - Password-gated email confirmation (A6a).
  - REST password change blocked for participants (A2).
  - Finance: per-network lockout plus per-account cap, and a constant-time username path (B1, B2).
  - Hashing unchanged: Payload PBKDF2 600k; finance Argon2id.
- **Domain 02 (AuthZ):** Applicable.
  - Email field update restricted to admins (A1).
  - Claim and profile require a confirmed email (A7).
  - Check-in id typed (A15).
  - Finance `ExpenseUpdate` DTO loses `amount_paid` (B10).
- **Domain 03 (Injection):** Applicable.
  - Finance log lines are JSON-encoded (B7).
  - LIKE wildcards escaped (B9).
  - Excel formula neutralisation (B8).
  - `Content-Disposition` header sanitised (B5).
  - Social-link URL validation (A14).
- **Domain 04 (Frontend):** Applicable.
  - Finance CSP, framing and nosniff headers (B3, B4).
  - `safeHref` on social links (A14).
  - Cookies unchanged (HttpOnly, Secure, Lax).
- **Domain 05 (API/Network):** Applicable.
  - IPv6 /64 rate-limit keys (A8).
  - Limits on Payload REST login and `/og` (A3, A13).
  - GraphQL disabled (A4).
  - CORS unchanged (explicit origins).
  - Body limits: NPM 12 MB; finance upload capped while streaming (B6).
- **Domain 06 (Data protection):** Applicable.
  - ID files `no-store` (A11).
  - Postgres no longer receives app secrets (C1).
  - No PII added to logs.
- **Domain 07 (AI/LLM):** Not applicable. No LLM or agent code in either app.
- **Domain 08 (Supply chain):** Applicable.
  - PyJWT and Next upgrades with lockfile updates (B15).
  - CI audit gates (C4).
- **Domain 09 (Infrastructure):** Applicable.
  - `cap_drop` + `no-new-privileges` on non-root containers (C2).
  - Database environment trimmed (C1).
  - Port bindings, volumes and `docker.sock` unchanged; volume names and mount paths verified unchanged.
- **Domain 10 (Logging):** Applicable.
  - Injection-safe finance logs (B7).
  - Audit row atomic and append-only (B11, B13).
  - New website refusals are logged as `logger.warn`, without secrets.
- **Domain 11 (Secrets):** Applicable.
  - Database container secret exposure removed (C1).
  - Hard-coded fallback JWT secret deleted (A16).
  - Distinct per-ledger passwords (Decision 5).
  - The GHCR token stays (owner decision).
- **Domain 12 (DNS):** Not applicable to the code. Cloudflare Access (F1) is configured by the owner and changes no DNS records.
- **Domain 13 (Email):** Applicable.
  - Name restriction keeps attacker-controlled text out of emails (A10).
  - Turnstile reduces automated sign-ups that use the 70/day budget (A9).
  - SMTP/TLS unchanged.
- **Domain 14 (Vector/RAG):** Not applicable. No vector store or embeddings.
- **Domain 15 (Business logic):** Applicable.
  - Verified-email gate can no longer be bypassed by an email change (A1).
  - Pre-hijack fix (A6).
  - Payment overpay race closed (B12).
  - Paid amount only through the payments endpoint (B10).
- **Domain 16 (Uploads):** Applicable.
  - Finance size limit enforced while streaming (B6).
  - ID files not cached (A11).
  - Magic-byte checks unchanged.
- **Domain 17 (Embeds):** Applicable only if Turnstile is turned on (A9). Its script and iframe are allowed in the CSP only when keys are set. No `postMessage` handling of our own.
- **Domain 18 (Webhooks/payments):** Not applicable. No webhook endpoint exists and none is added; Razorpay matching is untouched.
- **Domain 19 (Backup/DR):**
  - Applicable for the deploy itself: backup before deploy, and C1 recreates the database container with the `krs_pgdata` volume untouched.
  - Off-site backups: owner decision (OCI).
- **Domain 20 (Compliance):** Not applicable. Retention and privacy flows are unchanged; no new personal data is collected.
- **Domain 21 (Mobile):** Not applicable. No native app.
- **Domain 22 (Kubernetes):** Not applicable. Docker Compose only.
- **Domain 23 (Queues):** Not applicable. The email outbox worker is unchanged; no broker.
- **Domain 24 (E2E crypto):** Not applicable. No messaging protocol.
- **Domain 25 (Adversarial ML):** Not applicable. No models.
- **Domain 26 (Healthcare):** Not applicable. No medical data.
- **Domain 27 (Financial ledger):** Applicable.
  - Single-transaction audit (B11).
  - Append-only trigger (B13).
  - Row lock on payments (B12).
  - Corrections go through the payments endpoint (B10).
  - `Decimal` currency unchanged.
  - Maker-checker not added: one treasurer by design.
- **Domain 28 (Multi-tenancy):** Not applicable. Two separate single-tenant ledgers, each with its own database and container.
- **Domain 29 (DoS):** Applicable.
  - Argon2 concurrency cap (B2).
  - `/og` limit (A13).
  - GraphQL removed (A4).
  - Upload read capped (B6).
  - The new name regex is linear: no nested quantifiers.
- **Domain 30 (CI/CD):** Applicable.
  - Actions pinned to SHAs (C3).
  - Audit gates (C4).
  - Branch protection (F2, owner).
- **Domain 31 (Git hygiene):** Applicable.
  - Root `.gitignore` (C5).
  - The old credential in history stays in history, by owner choice whether to purge; listed in SECURITY_AUDIT M9.
- **Domain 32 (Contest integrity):** Not applicable now. Submissions and judging are not built; nothing in this plan touches scoring.
- **Domain 33 (Client rendering):** Not applicable. No WebGL or canvas code changes.
- **Domain 34 (Offline storage):** Not applicable. No client-side persistence is added.
- **Domain 35 (Third-party API credentials):** Applicable only if Turnstile is on. The secret key lives only in `/opt/krs/deploy/.env` (mode 600); the site key is public by design.

### Pre-flight: assumptions, risks, unknowns

- **Assumptions:**
  - Payload 3.90 honours a user-defined `email` field override on an auth collection, with the field merged and access applied. I'll prove it with a test on a local copy before deploying.
  - The finance UI never sends `amount_paid` on update (checked: only `POST /api/expenses` does).
- **Risks:**
  - A1/A2 could block a legitimate admin action if the hook is wrong. Mitigated by the admin-allowed test.
  - B13 could break a code path that updates audit rows. I checked: none exist, and users are deactivated rather than deleted.
  - C1/C2 recreate containers. Mitigated by the backup and the deploy's health check and rollback.
  - C4 could block a deploy on a new critical advisory. That is intended; override by re-running with the step disabled, if you approve.
- **Unknowns:**
  - Whether the CMS's own "Forgot password?" link calls the REST endpoint I'm refusing (A3). I'll check in the admin bundle and redirect it to `/forgot-password` if so.
