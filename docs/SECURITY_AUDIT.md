# KRS / AURIX Security Audit

Date: 2026-10-04. Scope: `website/` (Next.js 16 + Payload 3.90), `financial/` (FastAPI + Next), `ops/`, `.github/workflows`, the Nginx Proxy Manager (NPM) config for the KRS hosts, and the live public endpoints (GET and harmless probes only).

**State when audited:** the production DB had 0 registrations, 0 ID documents and 8 users. Every finding below is therefore pre-launch.

**Not covered:** authenticated or destructive testing, the Oracle security list, Cloudflare WAF settings, GitHub branch protection and token scopes, and the `mail.ashi.studio` mail server. Whether the other projects' published ports are reachable from the internet is unconfirmed.

Severity: High = fix before launch. Medium = fix soon. Low = hygiene.

> **Status 2026-10-07:** fixes implemented per `docs/SECURITY_FIX_PLAN.md` (owner decisions: confirmation needs the account
> password, 24 h sessions, Turnstile shipped switched off, finance passwords kept, ledger-switch link removed).
>
> **Owner-decided, not changed:**
> - H4 (backups are covered by OCI whole-server backups);
> - replacing the GHCR token (H1, M9);
> - the finance passwords shared by both ledgers (H3);
> - CSP nonces, short-link scope and the treasurer CSV (see the plan, section D).
>
> **Still yours to do:** plan section F (Cloudflare Access, branch protection, OCI security list and backup check, old env copies).

---

## Summary

| # | Sev | Finding | Area |
|---|---|---|---|
| H1 | High | Push access to the deploy branch gives root on the shared host | ops / CI |
| H2 | High | A participant can change their own email after verification | website |
| H3 | High | Public, password-only finance logins; same passwords on both ledgers | finance |
| H4 | High | ID cards, uploads and finance receipts are not backed up; DB dumps stay on the same disk | ops |
| M1 | Med | Per-IP rate limits defeated by IPv6; no CAPTCHA; 70 emails/day budget can be exhausted | website |
| M2 | Med | Payload built-in endpoints bypass custom controls | website |
| M3 | Med | Sessions survive logout and password change | website |
| M4 | Med | Account pre-hijack (session issued before email confirmation) | website |
| M5 | Med | Finance ledger integrity gaps | finance |
| M6 | Med | Finance input handling (logs, Excel formulas, filenames, timing) | finance |
| M7 | Med | Outdated dependencies | both |
| M8 | Med | Container and network hardening | ops |
| M9 | Med | Secrets hygiene | all |
| M10 | Med | Finance UI lacks security headers | finance |
| L1-L12 | Low | Hygiene items | various |

---

## High

### H1. Push access to the deploy branch gives root on the shared host
**Where:** `ops/bin/krs-pull-deploy:59-65` (fetch, reset to `origin/<branch>`, then `exec` the pulled script as root) and `:83` (copies `ops/bin/*` into `/usr/local/sbin`, then `systemctl enable`). `ops/bin/krs-deploy` pulls `ghcr.io/ashirogi-muto/krs-website:deploy-ready`, a mutable tag, with no digest check. `.github/workflows/*.yml` pin actions by tag (`actions/checkout@v4`, `docker/build-push-action@v6`).
**Impact:** anyone who can push to `claude/deploy-ready` or `main`, or who steals the GitHub token, gets root on a host that also runs the mail server, NPM and other projects. A classic `ghp_` PAT is stored on the server (per `docs/DEPLOYMENT.md`).
**Fix:**
1. GitHub branch protection on `claude/deploy-ready` and `main`: require PR review, no force-push, require signed commits.
2. Replace the classic PAT with a fine-grained, repo-scoped, read-only deploy key. Keep push credentials off the server entirely.
3. In `krs-pull-deploy`, verify the pulled commit before executing it, e.g. `git verify-commit origin/$BRANCH`, or deploy only an explicit `--commit <sha>` that the owner supplies.
4. Deploy by digest: have CI print `image@sha256:...`, and pass that to `krs-deploy` instead of `deploy-ready`.
5. Pin every GitHub Action to a full commit SHA.
6. Optional: sign images with cosign and verify before `docker tag`.

### H2. A participant can change their own email after verification
**Where:** `website/src/payload/collections/Users.ts` (the `email` field has no access rule; `access.update` lets `id == user.id` through). Payload's base `email` field (`node_modules/payload/dist/auth/baseFields/email.js`) has no access control and `auth.verify` is `false`, so changing it does not reset `emailVerified`. `website/src/app/api/aurix/register/route.ts:117` takes the leader email from the account's current email.
**Attack:** sign up, confirm your own email, then `PATCH /api/users/<own id>` with `{"email":"victim@example.com"}`. `emailVerified` stays true, so you can register teams as the victim. The victim receives confirmation emails from your domain, and the duplicate check (`event + leaderEmail`) blocks the victim from registering for that event. This defeats `AURIX_REQUIRE_ACCOUNT=1`. Related: Payload's REST also lets an account change its password without the current password.
**Fix:**
1. In `Users.ts`, override the `email` field (`{ name: 'email', type: 'email', access: { update: ({ req: { user } }) => isAdmin(user) } }`), so participants cannot edit it. Offer an email change only through a custom route that sends a new confirmation link.
2. Add a `beforeChange` hook as backup: if `data.email` differs from `originalDoc.email` and the actor is not an admin, throw 403, or set `emailVerified: false` and revoke sessions.
3. Block self-service `password` changes on the built-in endpoint, or force the current password through a `beforeChange` check. Keep `/api/aurix/portal/profile` as the only path.
4. Add a regression test in `website/tests/` that calls `payload.update({ overrideAccess: false, user })` with an email change as a participant.

### H3. Finance logins: public, password-only, shared credentials
**Where:** `finance.` and `ledger.kalamroboticssociety.com` (NPM hosts 10 and 11). `financial/backend/app/services/login_guard.py:103-122`. `/opt/krs/deploy/finance/{official,unofficial}.env`.
**Evidence:** I compared hashes without printing values. `ACCOUNT_ADMIN_PASSWORD`, `ACCOUNT_TREASURER_PASSWORD` and `ACCOUNT_PRESIDENT_PASSWORD` are identical in both env files. Usernames are predictable (`treasurer`, `president`, `ashi`). Five failures lock an account for 15 minutes before the password is even checked, so an attacker can keep all accounts locked. There is no MFA and no IP allowlist.
**Fix:**
1. Put both hosts behind Cloudflare Access (Zero Trust) with an email or SSO policy limited to named people. This adds MFA and removes the public attack surface.
2. Give every account on each ledger a unique, random 20+ character password. Change them with `sudo krs-finance-passwd`, then edit the env files so a restart cannot reintroduce the old ones.
3. Rename the predictable usernames (the env files only create accounts, so use the portal's admin reset or a new username).
4. Change the lockout to progressive delay per (account, IP) pair instead of a hard 15-minute account lock, so one attacker cannot lock out the owner.
5. Add the security headers from M10.

### H4. Uploads and receipts are not backed up
**Where:** `ops/bin/krs-db-backup` (pg_dump only, to `/var/backups/krs`, same disk, unencrypted, keeps 7). The volumes `krs_private_uploads` (ID cards), `krs_uploads` (CMS media) and `krs_fin_*_vault` (receipts) have no backup. No off-host copy exists. The previous VM was already lost once (`docs/NEW-SERVER.md`).
**Fix:**
1. Extend `krs-db-backup` (or add `krs-vol-backup`) to archive the four volumes, e.g. `docker run --rm -v krs_private_uploads:/d:ro -v /var/backups/krs:/o alpine tar czf /o/uploads-$STAMP.tgz -C /d .`.
2. Encrypt (age or gpg) and copy off-host nightly (rclone or restic to Cloudflare R2 or Oracle Object Storage). Use a write-only credential so a compromised host cannot delete backups.
3. Do a restore test into a scratch DB and volume once, and write the steps into `docs/`.
4. Do this before the first real registration.

---

## Medium

### M1. Rate limits defeated by IPv6; email budget exhaustible; no CAPTCHA
**Where:** `website/src/lib/rateLimit.ts:21-28` keys on the full client IP. The limits are in `auth/register` (5/h/IP), `forgot-password` (5/h/IP, 3/h/email), `/api/forms`, `/api/aurix/status`. `MAIL_DAILY_LIMIT=70`.
**Impact:** an attacker with an IPv6 /64 or /48 gets unlimited "new IPs". They can:
- exhaust the 70/day budget, which blocks confirmation and password-reset emails (`dailyLimitReached` returns 503),
- send mail from your domain to arbitrary addresses, with an attacker-chosen name in "Hi {name}",
- fill `form-submissions`.
**Fix:**
1. In `clientIp()`, normalise IPv6 to its /64 prefix before it becomes a bucket key.
2. Add Cloudflare Turnstile to register, forgot-password, resend-verification and `/api/forms`, and verify the token server-side.
3. Add a global per-hour cap for sign-up emails so one burst cannot use the whole day.
4. Reserve part of the daily budget for password resets and staff actions, or raise the limit with a second SMTP account.
5. Escape or restrict the `name` field in emails (letters, spaces, `.-'` only, max 60).

### M2. Payload built-in endpoints bypass your custom controls
**Where:** `website/src/app/(payload)/api/[...slug]/route.ts` exposes `/api/users/login`, `/api/users/forgot-password`, `/api/access`, `/api/graphql`.
- `/api/users/login` has no IP throttle, only `maxLoginAttempts: 5` for 10 minutes per account. Locking the Super Admin out indefinitely takes five bad logins per 10 minutes.
- `/api/users/forgot-password` generates and overwrites the reset token, which invalidates a victim's emailed link, and bypasses your 3/h per-email limit. Payload's console email adapter only logs To and Subject, so the token is not leaked.
- `/api/access` returns the full collection and field permission map to anonymous users (31 KB).
- `/api/graphql` returns HTTP 500 for every query, which is a dead attack surface.
**Fix:**
1. Add `graphQL: { disable: true }` to `payload.config.ts`.
2. Wrap or disable the built-in auth endpoints. In the Users collection config, override `endpoints` for `login`, `forgot-password` and `reset-password` to point at the same logic as your `/api/auth/*` routes, or add a small middleware in the `[...slug]` route handler that applies `rateLimit` per IP and per email for those paths.
3. Block `/api/access` for anonymous requests in the same wrapper.
4. For admin and staff logins, add progressive lockout (see H3 item 4) and an alert to the owner after repeated lockouts.

### M3. Sessions survive logout and password change
**Where:** `website/src/app/api/auth/logout/route.ts:7-19` only expires the cookie and never revokes the server session. `website/src/app/api/aurix/portal/profile/route.ts` (`change_password`) does not clear other sessions. Tokens last 7 days and Payload's refresh extends them.
**Fix:**
1. In logout, call `payload.logout({ collection: 'users', req })`, or remove the session entry (`sid`) from `user.sessions`.
2. After `change_password`, set `sessions: []` (Payload does this on reset) and re-issue a cookie for the current device only.
3. Reduce `tokenExpiration` for staff and admin accounts, e.g. 8-12 hours.
4. Add an admin action "sign out everywhere" in the Accounts screen.

### M4. Account pre-hijack
**Where:** `website/src/app/api/auth/register/route.ts:73-96` logs the new user in and sets the cookie before the email is confirmed. `lib/auth/participant.ts` `confirmEmail` links registrations to whoever holds the account. `api/aurix/portal/claim/route.ts` calls `getSessionUser()` and never checks `emailVerified`.
**Attack:** the attacker signs up with a victim's address and a known password, so the victim receives a confirmation email. If the victim clicks it, the attacker's session is now on a verified account bound to the victim's email.
**Fix:**
1. Do not issue a session cookie at registration. Show "check your email" and log the user in only after confirmation.
2. Alternatively, on confirmation, revoke all existing sessions and require the user to set a new password via the emailed link (the same flow as reset).
3. Require `emailVerified` in `/api/aurix/portal/claim` and `/api/aurix/portal/profile`.
4. Make the 409 "account already exists" response generic if account enumeration matters to you.

### M5. Finance ledger integrity
**Where:** `financial/backend/app/api/expenses.py:241-324`, `services/payment_service.py`, `services/audit_service.py`, `provision.py:579-587`.
- `PUT /api/expenses/{id}` sets `amount_paid` and `total_amount` directly, bypassing the `ExpensePayment` history. The aggregate then disagrees with the payment rows.
- Audit rows are written in a second `commit()` after the change, so a failure leaves an unaudited change. The audit table is writable by the app's own DB role.
- `record_expense_payment` sums existing payments and inserts without a row lock, so concurrent calls can overpay.
- `provision_accounts()` re-activates and re-roles accounts from the env file on every container start, so a deactivated user returns after a deploy.
**Fix:**
1. Remove `amount_paid` from `ExpenseUpdate`. Derive it only from the sum of `ExpensePayment` rows, and allow changes only through the payments endpoint.
2. Write the audit record in the same transaction as the change (`db.add(audit)` before one `db.commit()`).
3. Make audit rows tamper-evident: a DB trigger that blocks `UPDATE` and `DELETE` on `audit_logs`, and/or a hash chain (`hash = sha256(prev_hash + row)`).
4. In `record_expense_payment`, lock with `db.query(Expense).with_for_update()` before summing.
5. In `provision_accounts`, create accounts only when missing and never re-activate or change roles of existing ones.

### M6. Finance input handling
**Where / fix:**
- **Log injection:** `main.py:63-68, 113` interpolate `request.url.path` and `str(exc)` into JSON log lines. Use `json.dumps({...})` or `logger.info("...", extra=...)`.
- **Formula injection in Excel exports:** `services/report_service.py` writes user text with openpyxl, which treats strings starting with `=` as formulas. Prefix cells that start with `= + - @ \t \r` with `'` (as the website's CSV export already does).
- **Documents:** `api/documents.py:195-199` puts the raw filename into `Content-Disposition`. A non-Latin-1 name makes Starlette raise on header encoding, which is a 500 on stream. Use RFC 5987 (`filename*=UTF-8''...`) or a sanitised ASCII name, and consider serving with `attachment` for PDFs. `await file.read()` loads the whole upload before the 10 MB check; enforce the limit while streaming.
- **Username enumeration by timing:** `api/auth.py` only runs Argon2 when the user exists. Always verify against a dummy hash when the user is missing.
- **Reports:** add `validate_csrf` to the POST report routes for consistency.
- **Search:** escape `%` and `_` in the `ilike` pattern.
- **Hashing load:** each Argon2 verify uses 64 MiB and the container limit is 512 MB, so a few concurrent logins can hit memory limits. Limit concurrent logins with a semaphore.

### M7. Dependencies
- `financial/backend/requirements.txt`: **PyJWT 2.7.0** has 15 advisories (fixes up to 2.15.0). You use only HS256 `decode`, so most JWK-client issues do not apply, but upgrade anyway. Also review `boto3==1.34.46` and `openpyxl==3.1.2`, which are old.
- `financial/frontend/package.json`: **Next 16.3.5** is in the affected range of GHSA-vcvr-r3jv-pc5j (RCE in `next/og` `ImageResponse`). The finance frontend does not use `ImageResponse`, so it is not exploitable, but bump to `^16.3.6`. The website is already on 16.3.6, and its `/og` route passes query params into `ImageResponse`, so never downgrade.
- `website`: `npm audit` shows 6 high and 12 moderate, mainly transitive build-time dependencies (braces, chokidar, sass, undici, esbuild via Payload). Nodemailer has two advisories (SMTP command injection via `envelope.size` and the transport `name` option). Neither is fed by user input here, but track the fix.
**Fix:** upgrade the above, add `npm audit --omit=dev` and `pip-audit` to CI, enable Dependabot, and add hashes to `requirements.txt` (`pip-compile --generate-hashes`).

### M8. Container and network hardening
**Where:** `ops/deploy/compose.yml`, `ops/deploy/finance/compose.yml`.
- No `cap_drop`, `no-new-privileges` or `read_only` on any container.
- The `db` service uses `env_file: .env`, so Postgres receives `PAYLOAD_SECRET` and `MAIL_PASSWORD` (confirmed with `docker inspect`).
- App ports are published on `172.17.0.1`, which every container on the host can reach. That includes the sih-\*, portfolio and mailserver containers, bypassing NPM and allowing `X-Real-IP` spoofing.
**Fix:**
1. Add to web, finance-api and finance-web: `cap_drop: [ALL]`, `security_opt: [no-new-privileges:true]`, `read_only: true` with `tmpfs: [/tmp, /app/.next/cache]` where needed.
2. Give the `db` service its own env file or `environment:` with only the three `POSTGRES_*` variables.
3. Put NPM and the KRS apps on a dedicated Docker network (NPM attached to `krs_internal`) and drop the `172.17.0.1` port publishing, or restrict it with a `DOCKER-USER` iptables rule allowing only NPM's source address.
4. Never trust `X-Real-IP` unless the connection comes from NPM (check the peer address), or have the app bind only to the private network.
5. Finance backend: remove `--forwarded-allow-ips=*` from the Dockerfile CMD and set it to NPM's address.

### M9. Secrets hygiene
- **Credentials in git history:** commits 9a62101 through a2a7ef3 contain a real person's email and admin password in `financial/backend/app/bootstrap_admin.py`, `seed.py` and the login page (removed in a2a7ef3). The repo appears private (unauthenticated GitHub returns 404). Confirm that password is not used anywhere, rotate it if it is, and decide whether to purge history (`git filter-repo`) or accept that repo collaborators can see it. The password is deliberately not repeated here.
- **Old `.env` copies:** `/var/backups/krs/env-before-mail-*` and `env.*.pre-launch` contain secrets. Delete them or keep them in an encrypted store.
- **Dev DB with a production copy:** `krs-dev-db` (127.0.0.1:5499) uses the password `krs_dev_local`, which is in git. Drop the prod copy when done, or change the password.
- **Plaintext admin password:** `~/how-to-add-a-new-site.md` holds the NPM admin password (per `docs/HANDOFF.md`). Rotate it and use a password manager.
- **NPM admin UI:** port 81 is published on `0.0.0.0`. Bind it to `127.0.0.1` or block it at the Oracle security list and use an SSH tunnel.
- **Rotation:** note rotation dates for `PAYLOAD_SECRET`, `SESSION_SECRET`, `MAIL_PASSWORD`, the GHCR token and the Cloudflare origin key in `docs/`.

### M10. Finance UI has no security headers
**Evidence:** `curl -I https://finance.kalamroboticssociety.com/login` shows only HSTS, `x-powered-by: Next.js` and a cache header. The backend sets headers only on `/api/*`.
**Fix:** add `async headers()` to `financial/frontend/next.config.ts` with CSP (`default-src 'self'`, `frame-ancestors 'none'`, `object-src 'none'`, `base-uri 'self'`, `form-action 'self'`), `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`, `Referrer-Policy: strict-origin-when-cross-origin`, `Permissions-Policy`. Set `poweredByHeader: false`.

---

## Low

- **L1. Cache headers on private files.** Cloudflare adds `cache-control: max-age=14400` to `/api/*/file/*` because Payload sends no `Cache-Control`, so browsers keep ID cards for 4 hours. Edge caching was not observed (always MISS). Fix: add `modifyResponseHeaders` on `id-documents` to set `Cache-Control: private, no-store`, and add a Cloudflare Cache Rule that bypasses cache for `/api/*` and `/admin/*`.
- **L2. Registration fails open.** `AURIX_REQUIRE_ACCOUNT !== '1'` allows anonymous registration (`api/aurix/register/route.ts:87`). Invert it so that anonymous registration needs an explicit `AURIX_ALLOW_ANONYMOUS=1`.
- **L3. Cost-amplification routes.** `/og` and `/_next/image` take arbitrary params and spend CPU per unique URL. Fix: allow only known `event`/`title` values or sign the URL, add rate limits, and cache at Cloudflare.
- **L4. Short links and footer URLs.** A MEDIA-role account can send `go.kalamroboticssociety.com` to any URL. Fix: allow external URLs only for admins, or restrict to an allowlist of domains. `SiteSettings.socialLinks[].url` is not validated; add `validate: safeHref`. React 19 currently blocks `javascript:` URLs, so this is defense in depth.
- **L5. Check-in `id`.** `api/admin/check-in/route.ts` puts `body.id` straight into a `where` clause. Require `typeof id === 'number' || 'string'` and cast it.
- **L6. Treasurer export.** The `finance` CSV view includes leader email and phone for TREASURER, which the collection's field rules do not allow. Align `exportViews()` with `SEE_CONTACTS`, or document the exception.
- **L7. Coming-soon events.** `/api/events` returns every field of events whose pages hide dates, fees and rules. Restrict public read fields when `comingSoon` is true (use a field-level `read` check).
- **L8. Dead code.** Delete `website/src/lib/auth/jwt.ts` (hard-coded dev fallback secret) and `website/src/lib/storage/index.ts` (allows SVG). Neither is imported.
- **L9. Repo hygiene.** The root `.gitignore` has two lines. Add `*.docx`, `*.pdf`, `.env*`, `.private_uploads/`, `logs/`, and move the stray brochures out of the repo root.
- **L10. Host.** SSH: set `PermitRootLogin no`, `X11Forwarding no`, install fail2ban or the Oracle equivalent. Reboot for the pending kernel and apply the 27 package updates.
- **L11. Limiters reset on restart.** All in-memory limiters and the finance lockouts clear on every deploy. Move counters to the database or Redis if abuse becomes real.
- **L12. CSP.** The website CSP allows `script-src 'unsafe-inline'` and `img-src https:`. Move to nonce-based scripts when feasible (Next supports nonces) and narrow `img-src`.

---

## Outside KRS, same host (verify)

The sih-\* stack publishes RabbitMQ (5672 and the management UI on 15672), Redis (6379), Qdrant (6333) and Postgres (5433) on `0.0.0.0`; `sih-nginx` publishes 8080, `portfolio` 3002 and `roundcube` 9180. Docker-published ports bypass ufw, so only the Oracle VCN security list protects them. In the OCI console, confirm that only 22, 80 and 443 are open to the internet. If any of these are reachable, fix them first, since an unauthenticated Redis or RabbitMQ is the highest-impact exposure on this machine.

## What held up

Role and field-level access in Payload (including its where-clause access checks), origin checks on state-changing routes, magic-byte upload validation, private ID-card storage, redacted account emails in the outbox, CMS URL sanitising, Argon2id and finance session versioning, parameterised queries throughout, enforced CSP and cookie flags, SSH key-only login, pre-migration DB backups, Cloudflare real-IP handling in NPM.

## Suggested order

1. H2 (small code change, closes the launch gate bypass).
2. H4 (before the first real registration).
3. H3 (Cloudflare Access plus new passwords).
4. H1 (branch protection and deploy verification).
5. M1 + M2 + M4 (Turnstile, built-in endpoints, sign-up flow).
6. M5-M10, then the Low items.
