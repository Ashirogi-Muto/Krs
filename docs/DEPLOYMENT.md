# KRS / AURIX website — deployment notes

Last updated: 2 Oct 2026, ~09:05 IST. Site live 04:45 IST; registration 05:02 IST; fees/dates/prizes/short links/slim image 08:58 IST.

## 0a. OUTAGE 2-3 Oct 2026 (12.5 h) — rules that override everything below

- 2 Oct 15:09:54 UTC the VM stopped dead (no shutdown, no guest kernel error, journal "uncleanly shut down"),
  in the middle of a staging run; it was started again 3 Oct 03:44 UTC. Inside the VM every monitored value was
  under its limit at the last check (15:09:39). Data recovered cleanly (PostgreSQL WAL replay, counts verified).
- Cause on the guest side: on 2 Oct Claude ran 61 heavy jobs (image pulls, staging DB copies, ~6 in-RAM npm installs),
  ~14 staging cycles. With online discard disabled (since the first crash) and no TRIM since, every write stayed
  allocated on the host's thin-provisioned storage; RAM touched by tmpfs installs stays charged to the VM on the host.
  The final kill/freeze happened OUTSIDE the VM (host RAM or thin pool) — host logs needed to confirm.
- Rules now:
  1. `krs-stage-test` is disabled on this VM. Staging tests run on GitHub Actions only.
  2. `krs-heavy-guard`: max 4 heavy jobs per 24 h, never two at once (refuses otherwise).
  3. No npm/node installs on this VM (not even in tmpfs). Type-checks, migrations generation and tests run on GitHub.
  4. Deploys: at most one website and one finance deploy per day unless it is an urgent fix; never back-to-back.
  5. The VM's own monitors cannot see the host. Ask the host admin before any large write/RAM job.

## 0. Server safety rules (after the 2 Oct 05:06 UTC crash)

On 2 Oct the VM froze and had to be reset: mass deletion of Docker build cache (~19 GB of tiny files) on a root
filesystem mounted with online `discard`, on thin-provisioned host storage, produced a TRIM storm; disk latency
reached ~2 s/IO, ext4 writeback blocked > 120 s, journald/timesyncd were killed by watchdogs. No data was lost.

- **Health check:** `krs-health.timer` runs `/usr/local/sbin/krs-health-check` every minute. Status:
  `sudo cat /var/lib/krs-health/status`; alerts: `journalctl -t krs-health` (WARN/CRIT when any resource loses its
  20% headroom: disk < 8 GB, inodes/memory < 20%, IO pressure > 80%, disk latency > 1 s, load5 > 1.6, threads/
  conntrack/Postgres connections > 80%, app down, container restarts).
- **Every heavy job goes through the guard:** `sudo krs-heavy-guard docker build ...` /
  `sudo krs-heavy-guard docker builder prune -f --filter until=24h`. It refuses to start without headroom and
  interrupts the job if IO pressure stays >= 70% or free disk < 8 GB.
- **Never** run `docker builder prune -af` / `docker system prune -a` in one go. Prune in small steps
  (`--filter until=...`, `--keep-storage`), one at a time, with the guard, and never right after a build.
- Prefer building images off the server (GitHub Actions) — see open items.

## 1. Architecture and request path

```
Visitor → Cloudflare (proxied, SSL Full (strict), Always Use HTTPS)
        → 151.243.146.254 (Proxmox host, DNAT 80/443)
        → KRS VM 10.10.10.10 → nginx :443 (Cloudflare origin cert, real-IP from CF-Connecting-IP)
        → 127.0.0.1:3003 → container krs-web (Next.js 16 + Payload CMS 3)
        → Docker network website_krs_internal → container krs-website-postgres (PostgreSQL 16, no published port)
```

nginx :80 only redirects to https. Nothing except nginx (80/443) and sshd (22) listens on public interfaces.

## 2. Stack, services, ports, files

| Item | Value |
|---|---|
| App | Next.js 16.3.6 (standalone output) + Payload CMS 3.90.2, Node 22 on Alpine, `NODE_ENV=production` |
| App container | `krs-web`, image `krs-website:latest` (~380 MB), `restart: unless-stopped`, Node heap capped at 1 GB, ~80–150 MB RAM |
| App compose file | `/opt/krs/deploy/compose.yml` (project `krs-prod`) |
| App port | `127.0.0.1:3003` only |
| Database | container `krs-website-postgres` (postgres:16-alpine, `shared_buffers=256MB`), started from `/opt/krs/app/website/docker-compose.yml` (project `website`) |
| DB volume | `website_krs_postgres_data` |
| Uploads volumes | `website_krs_uploads` (public CMS media), `krs_private_uploads` (student ID cards, staff-only) |
| Logs volume | `krs_logs` (app logs, rotated by the app at 10 MB × 5) |
| Docker logs | json-file, 10 MB × 3 (`/etc/docker/daemon.json`) |
| Source code | `/opt/krs/claude-work`, branch `claude/deploy-ready` (local only — **not pushed to GitHub yet**) |
| Other agent's clone | `/opt/krs/app`, branch `antigravity/content` (my branch is built on top of it) |
| Rollback image | `krs-website:prev` (the build before the current one) |
| nginx site | `/etc/nginx/sites-available/krs` (symlinked in `sites-enabled`) |
| Placeholder page | `/var/www/krs/index.html` (unused now, kept for rollback) |

## 3. Deploying an update (images are built on GitHub, not on the VM)

1. Commit and push to `claude/deploy-ready` (or `main`). GitHub Actions workflow **"Build website image"**
   (`.github/workflows/website-image.yml`) builds the image and pushes it to
   `ghcr.io/ashirogi-muto/krs-website:sha-<commit>` (plus `:deploy-ready` / `:main`).
2. Optional but recommended: `sudo krs-stage-test sha-<full commit sha>` runs the image against a fresh copy of the
   production DB (newest `krs-db-*` dump — run `sudo krs-db-backup` first for today's data) on 127.0.0.1:3013 (migrations included); `sudo krs-stage-test --stop` removes it.
3. On the VM: `sudo krs-deploy sha-<full commit sha>` — pulls through `krs-heavy-guard`, keeps the running image as
   `krs-website:prev`, swaps the container (a few seconds of downtime), waits for health, triggers Payload init and
   pending migrations, and **rolls back automatically** if the new version is unhealthy.
   Needs `/opt/krs/creds/ghcr-read.txt` (classic PAT with only `read:packages`, mode 600).
3. Check: `curl -s -o /dev/null -w '%{http_code}\n' https://kalamroboticssociety.com/` and `sudo docker logs --tail 50 krs-web`.

Database migrations in `website/src/migrations/` run automatically on the first request after deploy.
After changing a Payload collection, generate a migration (`npx payload migrate:create <name>`) against a
throwaway database and commit it. **Do not build images on the VM.** If you must, use
`sudo krs-heavy-guard docker build ...` and never mass-prune afterwards (section 0).

**Event content sync:** `SYNC_SEED_EVENTS=1` in `/opt/krs/deploy/.env` makes the app copy
`website/src/lib/data/seed-events.ts` into the CMS on startup, **overwriting** CMS edits to those events.
Leave it at `0`; edit events in the CMS instead.

## 4. Rolling back

**App, to the previous image:**
```bash
sudo docker tag krs-website:prev krs-website:latest && sudo docker compose -f /opt/krs/deploy/compose.yml up -d
```
(Older builds ignore the newer DB tables/columns, so the database does not need to be rolled back for an app rollback.
The other agent's pre-launch container and image were removed at 04:50 IST to keep 8 GB free; its code is on branch
`antigravity/content` in `/opt/krs/app`.)

**nginx, to the previous config:**
```bash
ls -1t /etc/nginx/sites-available/krs.bak-*            # newest first
sudo cp -p /etc/nginx/sites-available/krs.bak-20261001-231503 /etc/nginx/sites-available/krs   # = placeholder site
sudo nginx -t && sudo systemctl reload nginx
```

**Database, from a dump:**
```bash
sudo ls -1t /var/backups/krs/
sudo sh -c 'zcat /var/backups/krs/<file>.sql.gz | docker exec -i krs-website-postgres sh -c "psql -U \$POSTGRES_USER -d \$POSTGRES_DB"'
```
Restoring into a non-empty database needs the schema dropped first; take a fresh dump before doing that.
`pre-swap-20261001-230442.sql.gz` is the state before launch.

## 5. Logs

```bash
sudo docker logs -f --tail 100 krs-web                 # app
sudo docker logs --tail 100 krs-website-postgres       # database
sudo docker exec krs-web ls -la /app/logs              # app.log, error.log, audit.log
sudo tail -f /var/log/nginx/access.log /var/log/nginx/error.log   # shows real visitor IPs
sudo journalctl -u krs-db-backup.service -n 20         # nightly backup runs
```

## 6. Secrets (locations only)

- `/opt/krs/creds/github-pat.txt` (mode 600, dir 700): GitHub token for pushing. Used only through
  `/opt/krs/creds/git-askpass.sh`, never stored in git config:
  `GIT_ASKPASS=/opt/krs/creds/git-askpass.sh git push https://github.com/Ashirogi-Muto/Krs.git claude/deploy-ready`

- `/opt/krs/deploy/.env` (mode 600, krsadmin): `DATABASE_URL`, `PAYLOAD_SECRET`, `NEXT_PUBLIC_SITE_URL`, `SYNC_SEED_EVENTS`.
- `/opt/krs/app/website/.env` (mode 600, krsadmin): Postgres user/password used by the DB container.
- Database dumps in `/var/backups/krs/` (root only) contain user data, including password hashes.

## 7. CMS (Payload admin) access

**Update 2 Oct 08:58 IST:** the admin password was changed and the nginx block below was removed; `/admin` is public again.

`/admin`, `/api/users` and `/api/graphql` are **blocked in nginx** (return 404) until the admin password is changed,
because the original password was written in a working file and appears in the setup chat.

To use the CMS meanwhile, open an SSH tunnel and use the app directly:
```bash
ssh -p 2222 -L 3003:127.0.0.1:3003 krsadmin@151.243.146.254
# then in Chrome:  http://127.0.0.1:3003/admin
```
(Use `127.0.0.1`, not `localhost` — Payload's CSRF allow-list contains `http://127.0.0.1:3003`.)

To open `/admin` publicly again: delete the three `location ^~ /admin|/api/users|/api/graphql` lines in
`/etc/nginx/sites-available/krs` (back it up first), then `sudo nginx -t && sudo systemctl reload nginx`.

Event pages re-read the CMS at most once a minute, so CMS edits appear within ~60 s.

## 8. AURIX team registration

- Page: `https://kalamroboticssociety.com/aurix/register` (`?event=<slug>` preselects a competition; use this link in brochures).
- Lists events that are `REGISTRATION_OPEN`, not "Coming Soon", and before `registrationClose`. Team size limits come from the CMS.
- Each member uploads a student ID (JPG/PNG/WebP/PDF, ≤ 2 MB; photos are resized in the browser to ~300 KB).
  Files are stored in the `krs_private_uploads` volume and are readable only by staff in the CMS.
- On success the visitor gets a code like `AX26-SOC-XXXXXX` and a button to the Razorpay Payment Page with
  name, email, phone, college, event and amount (₹) pre-filled. The Razorpay page has no field for our code, so payments
  are matched on email + phone + event + amount.
- CMS: **AURIX Registrations → Event Registrations / Id Documents**. Organizers set `Payment status`,
  `ID verification` and `Status` (Pending → Confirmed / Rejected).
- Event field **Payment event label** must match the Razorpay dropdown text exactly (e.g. `Robo - Ideathon ` has a trailing space).
- Protections: 8 attempts per IP per hour, hidden honeypot field, server-side file-type check, duplicate check
  (same leader email + event), automatic clean-up of uploaded files if saving fails.
- No emails are sent yet (provider not configured).

## 8b. Team accounts and dashboards (CMS) — staff roles (2 Oct, commit 52da350)

Sign-in: **https://kalamroboticssociety.com/admin**. Only admins create accounts (**/admin → Users**):
set **Account type = Team member** and tick **Roles** (several allowed; access is the union). Technical event
members also get **Assigned events**. Only the Super Admin (owner) can create/promote admins; other admins
cannot edit the owner's account. Team members cannot change their own roles.
| Role | Sees | Can change | CSV |
|---|---|---|---|
| Registration | all registrations, contacts, ID cards | ID verification, confirm/reject (status), notes | full (if Team Head) |
| Technical event | assigned events only (all if Team Head): names, colleges, leader phone | nothing | check-in, roster |
| Logistics | all: names, colleges, leader phone (no emails/IDs) | nothing | check-in, roster (if Team Head) |
| Discipline / Tech support | names, teams, colleges, events, statuses (no contacts/IDs/money) | nothing | roster (Discipline Team Head) |
| Media & outreach | registration totals; posts, projects, people, resources, gallery, short links, event texts | content (not event fees/dates/status/payment settings); deletes only gallery files | — |
| Sponsors / Decoration | totals / counts per event only (no registration list) | nothing | — |
| Finance | registrations + contacts + money | payment status/reference/verified-at, notes | finance |
| Core Member / Supervisor | all dashboards; registrations read-only (no contacts/IDs) | nothing | — |
| President / Event Head | everything for registrations (Event Head also edits events fully) | all registration fields | all |
| Treasurer | money read-only | nothing | finance |
Rules: `website/src/payload/access/roles.ts` (+ field rules in `Registrations.ts`, `Events.ts`, `Content.ts`).
Tests: `website/tests/roles.test.ts`; staging role matrix script used on 2 Oct (17 accounts, 0 failures).
Exports: `/api/admin/registrations-export?view=full|finance|checkin|roster[&event=<slug>]` (audit-logged).

## 8d. Event tools, email and retention (2 Oct, commit f85bb75)

- **Check-in desk** `/checkin` (phone-friendly): code/team lookup, "Mark arrived"/undo, per-event counts. Registration,
  Logistics, managers: all events; Technical event: assigned events (all if Team Head). Arrival column in check-in CSV.
- **Payment matching** `/payment-matching` (Finance + President/Event Head): upload Razorpay report as CSV, check the
  guessed columns, preview (email + phone + event + amount), tick, Apply. Nothing is saved before Apply.
- **AURIX Schedule** (CMS → Website → AURIX Schedule) feeds `/aurix/schedule` (still hidden in `visibility.ts`).
- **Email**: registration confirmation is queued in CMS **Email outbox** and sent by a worker inside the app every 15 s
  (Gmail SMTP 587 STARTTLS, nodemailer). Retries after 1/5/15/60 min, FAILED after 5 attempts; set Status to Pending to
  resend. Until configured, emails wait as PENDING. Enable: add to `/opt/krs/deploy/.env`
  `MAIL_USERNAME=<gmail address>`, `MAIL_PASSWORD=<16-char Google App Password>`, `MAIL_FROM=<same address>`,
  (optional `MAIL_FROM_NAME`, `MAIL_REPLY_TO`), then `sudo docker compose -f /opt/krs/deploy/compose.yml up -d`.
  Staging never gets real MAIL_*; test with `sudo krs-stage-test sha-<sha> --env-file <file>` + a Mailpit container.
- **Retention** `/retention` (Super Admin only): 30 days after an event ends, delete its registrations, ID files and
  emails (type the event name to confirm). The CMS dashboard shows a red reminder when an event is due.

## 8c. Finance portals (Official + Unofficial ledgers)

- https://finance.kalamroboticssociety.com = **Official**, https://ledger.kalamroboticssociety.com = **Unofficial**
  (same images, separate databases `krs_fin_official` / `krs_fin_unofficial`, separate accounts, separate document volumes).
- Files: `/opt/krs/deploy/finance/compose.yml`, `official.env`, `unofficial.env` (mode 600).
- **Accounts:** set `ACCOUNT_*_PASSWORD` (12+ characters) in the .env file, then `sudo krs-finance-reload official|unofficial|all`.
  The .env password is used **only to create** an account; it never overwrites an existing one.
- **Password resets** (2 Oct): only the `audit` ADMIN (portal → Users) or the server:
  `sudo krs-finance-passwd official|unofficial <username>` (prompted twice, audit-logged as SERVER CLI).
  The treasurer can create/disable viewers but cannot reset any password; nobody can change their own.
  `audit` = ADMIN (financial audit only; sees users + audit trail), `treasurer` = EDITOR (adds viewers at /team),
  `president` = VIEWER. Empty password = account not created.
- Deploy: GitHub workflow "Build finance images" → `sudo krs-finance-deploy sha-<commit>`.
- Receipts are stored locally in the ledger's private volume (`ALLOW_LOCAL_STORAGE=true`) until R2/B2 is set up.
- Logs: `sudo docker logs krs-fin-official-api` (…`-web`, `krs-fin-unofficial-*`).

## 8a. Registration status page

`/aurix/status` (short link `go.kalamroboticssociety.com/status`): teams enter registration code + leader email and see
registration, payment and ID status, member names and colleges. No phone/email/ID files/admin notes are returned;
20 lookups per IP per hour. API: `POST /api/aurix/status`.

## 9. Short links

- CMS: **Short Links**. Each link has a `slug` and points to an **event** (details page or its registration form — follows the
  event even if its URL changes), a **page path** on this site, or an **external URL**. Clicks are counted.
- Work at `https://kalamroboticssociety.com/go/<slug>` now, and at `https://go.kalamroboticssociety.com/<slug>` once the
  Cloudflare DNS record exists (CNAME `go` → `kalamroboticssociety.com`, proxied). nginx already has the `go.` server block.
- Redirects are 302 with `Cache-Control: no-store`, so CMS edits apply immediately. Unknown/disabled slugs go to `/aurix`.
- Starter links: `aurix`, `register`, `soccer`, `race`, `expo`, `ideathon`, `hackathon`, `soccer-register`, `race-register`,
  `expo-register`, `ideathon-register`.

## 10. Hidden pages

`website/src/lib/visibility.ts` lists routes that return 404 and are removed from menus and the sitemap:
`/team`, `/join`, `/contact`, `/insights`, `/aurix/schedule`, `/aurix/results`, `/aurix/portal`, `/judge`, `/login`, `/register`.
Delete a line and redeploy to publish that page again.

## 11. Firewall and ports

No ufw changes were made. Allowed: 22, 80, 443 (IPv4 + IPv6). No hackathon ports (20000–20999) opened.
Note: `ufw status verbose` now shows `deny (routed)` where the first audit showed `disabled (routed)`; this was not
changed by the deployment work described here (possibly during the Docker install) — worth confirming.

## 12. Backups

- Nightly at ~02:30 IST: `krs-db-backup.timer` → `/usr/local/sbin/krs-db-backup` → `/var/backups/krs/krs-db-*.sql.gz`, keeps 7.
- **No off-box copy yet** (open item).

## 13. Open items

1. ~~Change the admin password / unblock `/admin`~~ (done 2 Oct).
2. **Push branch `claude/deploy-ready`** to GitHub (this server has no GitHub write access).
3. **Revoke the old GitHub CLI OAuth token** (GitHub → Settings → Applications → GitHub CLI).
4. **Off-box backups** for `/var/backups/krs`.
5. **Object storage (R2 or B2)** for uploads and PPT/PPTX submissions with presigned uploads; provider not chosen.
6. ~~Test the Razorpay pre-fill~~ (confirmed working 2 Oct). Original note: (register a test team, check all five fields + amount, then don't pay; delete the test registration in the CMS).
7. **Payment reconciliation**: daily Razorpay export upload in the CMS + matching — needs a sample export (column headers) to build. Ask the college for API keys/webhook access (would make this automatic).
7a. **ID card retention**: the form promises IDs are deleted after the event — schedule deleting `id-documents` after 28 Oct; mention ID collection in the privacy policy page.
8. **Transactional email provider** (SMTP on 587) + SPF/DKIM records in Cloudflare; no mail server on this VM.
9. **Move remaining content into the CMS** (home page, projects, blogs, learning, gallery, team, footer).
10. **Unconfirmed content** to review: Agri-Sensing Rover and Hexapod projects, YUVAAN specs, blog posts and tutorials, unlabelled Drive links.
11. **Hackathon details** (prize, team size, rounds) before switching off "Coming Soon" in the CMS.
12. ~~Page title repetition~~ (fixed).
13. ~~Remove the old pre-launch container/image~~ (done 04:50 IST).
14. Confirm the ufw routed-policy change noted in section 9.
15. **Cloudflare DNS**: add CNAME `go` → `kalamroboticssociety.com` (proxied) for the short-link subdomain.
16. ~~Build images off-server~~ (done 2 Oct: GitHub Actions + `krs-deploy`).
17. Hidden pages `/aurix/schedule` and the portal still contain old sample dates — make them CMS-driven before un-hiding.
18. Hackathon description (hidden while Coming Soon) still mentions "50 shortlisted teams" — confirm before switching Coming Soon off.
19. Email notifications: deferred until payment-report handling is built (provider: transactional SMTP on 587 recommended).
20. Participant portal: specification for the implementing agent in `/opt/krs/PORTAL_SPEC.md` (also at repo root).
21. Deploys cause a few seconds of downtime (single container). Zero-downtime switch-over possible later if needed.
22. GitHub token is a classic token (`ghp_`); a fine-grained token limited to this repo would be safer.
