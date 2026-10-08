# KRS / AURIX — Handoff (for the next Claude session)

**Written:** 4 Oct 2026 (end of day, ~10:00 UTC) by the session that moved production to the Oracle host, made the
whole site CMS-editable, launched participant accounts, built the admin tools, enforced the CSP and launched the
Hackathon. Replaces the earlier 4 Oct 05:00 version (in git history).

> **Update 7 Oct 2026:**
> - Security audit fixes shipped (commit 9467e73): see `docs/SECURITY_AUDIT.md`, `docs/SECURITY_FIX_PLAN.md` and
>   `website/AGENT.md` §13.
> - Changes you'll notice:
>   - website logins last **24 h**;
>   - confirming an email asks for the account password;
>   - only admins can change an account email;
>   - Payload's REST forgot-password is refused (staff use /forgot-password);
>   - GraphQL is off;
>   - Turnstile code is in but **off** until the keys are set;
>   - the finance sidebar has no ledger-switch link;
>   - finance `audit_logs` are append-only (migration 004).
> - Finance accounts on this server: `ashi` (ADMIN), `treasurer`, `president` on both ledgers. The username is not
>   `audit`, which the old docs say.
> - **Turnstile is ON since 7 Oct 20:22 UTC.** Keys are in `/opt/krs/deploy/.env` (source `/opt/krs/creds/turnstile.env`).
>   Headless browsers can't pass it, so test with Cloudflare's test keys on a local copy (website/AGENT.md §13).
>   The rollback steps are there too.
> - `/api/*` (except `/api/media/file/*`) and `/admin*` send `Cache-Control: private, no-store` (commit e3d1b78).
> - After recreating `krs-web` by hand (env change), clear the page cache: POST `/api/internal/revalidate`, the same
>   call krs-deploy makes. Otherwise each page serves its build-time copy once; /contact gave a 404.
> - The owner hid `/aurix/portal` on 5 Oct, so the portal and its APIs return 404 until it is shown again.
> - **7 Oct, 21:25 UTC (fb06146):**
>   - Hackathon registration and Round 1 end **19 Oct 23:59 IST**, with a "Registration Deadline" notice box
>     (Events → Notice box title / text).
>   - /gallery is a **photo grid**: Gallery entries hold many photos (bulk upload); title, category, caption and the
>     image description are optional.
>   - ~40 more labels are editable (Event pages → Status & countdown; Labels & messages → Whole site, status lookup,
>     account screens).
>   - Every content collection explains which page it feeds.
>   - Migration 20261007_211829 is additive.
>   - Finance API sends `Cache-Control: private, no-store`.
>   - Details: website/AGENT.md §14.
> - **8 Oct, 00:25 UTC (b94c07b):** everything a visitor reads is editable in the CMS. That covers every server message
>   (Labels & messages → Messages), the emails (→ Emails), tab titles, search texts and keywords (→ Search & browser
>   tabs), the portal tab titles, and the /judge placeholder (Participant portal → Judging portal). Defaults equal the old
>   text. Migration 20261008_001859 is additive.
> - **8 Oct, 00:53 UTC (1f19dd6, deployed):** the staff tools (/checkin, /payment-matching, /retention), /api/admin messages,
>   the custom CMS screens (dashboard panels, Participants / Team accounts, Page visibility, sidebar group) and CSV column
>   names are editable in **Admin tools → Staff & admin texts** (admins only). The last leftovers moved into the CMS too:
>   spam-trap label, comparison-table fee/team wording, /og texts, privacy/terms search texts. Every CMS wording field now
>   **shows the live text from the start** (no more empty fields until the first save); clearing a field = built-in
>   text. The site address stays a server setting on purpose (it builds reset links; see AGENT.md §14).
>   `tests/cms-coverage.test.ts` fails if new hard-coded visible text appears. Migration 20261008_004435 is additive.
> - Still the owner's to do: plan section F (Cloudflare Access for finance./ledger., branch protection, OCI security
>   list + backup check).

**Read in this order:** this file → `website/AGENT.md` (canonical technical log, gitignored; **§9–§12 = everything since
3 Oct**, §6 = security checklist, rewritten 4 Oct) → `docs/NEW-SERVER.md` (how this host is set up) →
`website/CLAUDE.md` → `PORTAL_SPEC.md` (status note at the top) → `website/SPEC.md` (gitignored; event facts, §3).
The global router `~/.claude/CLAUDE.md` (= `~/.gemini/GEMINI.md`) and its rule files apply too.
`docs/DEPLOYMENT.md` is mostly VM-era; trust NEW-SERVER.md over it.

---

## 1. Working with the owner

- Owner: Kalam Robotics Society (KRS), IILM University, Greater Noida. Timezone **IST**; server clock is UTC.
- Wants dense, plain answers; honest pushback; no timelines unless asked; ask when scope is ambiguous or SPEC conflicts.
- Approves with short replies. Decisions already made are listed in AGENT.md §9–§12: **do not re-raise them.**
- Git: commit + push to `claude/deploy-ready` is fine. **Never force-push.** `main` was fast-forwarded to
  `claude/deploy-ready` on 4 Oct at the owner's request; merging to `main` again or deleting branches: ask first.
- Owner does DNS/Cloudflare and OCI console changes themselves (give the exact record/setting).
- Never print secrets; give file paths only. Never touch port 22 / SSH config.
- The owner's staff edit the CMS live (people, photos, projects). Don't leave the site broken; deploys restart it ~1 min.

## 2. What is live (4 Oct 2026, end of day)

| Thing | State |
|---|---|
| Website | https://kalamroboticssociety.com — Next.js 16.3.6 standalone + Payload CMS 3.90.2 (Postgres, Lexical), container `krs-web`. Image `ghcr.io/ashirogi-muto/krs-website:deploy-ready` (rollback `krs-website:prev`). Live commit: `sudo krs-pull-deploy --status` (website image built from **b881f55**; repo at 9e3bea0 + this handoff) |
| Database | dedicated `krs-website-postgres` (no published port, network `krs_internal`, volume `krs_pgdata`); also holds both finance ledgers |
| Uploads | volumes `krs_uploads` (public CMS media, served resized via `/_next/image`) and `krs_private_uploads` (student ID cards) |
| Finance | finance. / ledger. — compose `/opt/krs/deploy/finance` (untouched this session; still dca4792) |
| Short links | go.kalamroboticssociety.com/{aurix,register,hackathon,soccer,race,expo,ideathon} (bare domain → /aurix via 2 redirects; never create a link with slug `go`) |
| Proxy/TLS | Cloudflare (proxied, HTML not cached) → Nginx Proxy Manager (shared) → 172.17.0.1:3003; origin cert expires **2027-10-03**; HSTS on |
| Accounts | `AURIX_REQUIRE_ACCOUNT=1`: registration needs a logged-in, email-confirmed account (team leader only). **2 confirmation emails per account per 24 h, 2 min apart** |
| Email | app → docker-mailserver `mail.ashi.studio:587` as noreply@kalamroboticssociety.com → OCI Email Delivery; DKIM/SPF/DMARC pass; **70/day** shared quota; contact@ inbox + alias. Test mails from both addresses reached the owner's Gmail (06:21 UTC) |
| Events | Robo Soccer / Race / Expo ₹499, Ideathon ₹399, **Hackathon ₹749 — LIVE since 4 Oct**: 12 hours, teams 1–5, round 1 online PPT screening, **round 2 on 27 Oct 09:00–21:00 IST**, registration closes **18 Oct** (others 25 Oct), 9 tracks, no hardware provided, Razorpay label "Hackathon" (confirmed). Event 27–28 Oct; total prizes ₹2,00,000 |
| Hidden pages (CMS → Website → Page visibility, admins only) | /join, /insights, /aurix/schedule, /aurix/results, /judge, /learning. **/contact and /team are live** |
| Security | full **CSP enforced** (report endpoint `/api/csp-report`; zero violations after the Cloudflare beacon was allowed); headers, rate limits, same-origin checks |
| Data at handoff | 0 team registrations (the only one, a staff test, was deleted on purpose), 8 users: 7 staff/admin + **user 9 (Shivam Kumar, real, unconfirmed — they confirm themself; link expires 5 Oct 00:42 IST, after that they resend from the gate screen)**, 17 media files, 5 events, 7 short links |

## 3. Server, deploy and ops

**Host:** shared Oracle ARM box, Ubuntu, 161.118.168.100. Shared services (NPM, Docker, mailserver, other projects)
must not be duplicated or restarted casually (memory `shared-host-no-duplicates`).

**Paths:** `/opt/krs/repo` (read-only deploy clone), `/opt/krs/creds` (700, secrets), `/opt/krs/deploy/{compose.yml,.env,finance/}`,
backups `/var/backups/krs` (nightly, newest 7) and `/var/backups/krs/pre-deploy` (14 days, ≥ newest 5), root only.
Dev checkout (edit here): `/home/ubuntu/krs` (`website/`, `docs/`, `ops/`). Mailserver: `/home/ubuntu/mailserver`.

**Deploy (website) — the whole procedure:**
1. Edit in `/home/ubuntu/krs/website`; `nice npx tsc --noEmit -p .`; `npm test` (**122 tests**, all pass). No ESLint config exists.
2. Schema change? Generate the migration on `krs_migtest` (`npx payload migrate:create name`), **read the SQL, it must be
   additive**, test it on a fresh copy of prod data (below), `npx payload generate:types`, and `npx payload generate:importmap`
   after adding/removing admin components.
3. Commit + push `claude/deploy-ready`. GitHub Actions "Build website image" builds arm64 (~5–10 min; a new push cancels the
   running build; ops-only/docs-only pushes don't build). Watch with the Actions API (token from `~/.git-credentials`, never echo it).
4. `sudo krs-db-backup` (belt and braces), snapshot counts, then `sudo krs-pull-deploy --finance skip`. It installs changed
   ops scripts, **runs a pre-deploy backup itself and cancels the deploy if that fails**, pulls the image, swaps, runs pending
   migrations, health-checks, auto-rolls back on failure, then **clears the page cache** (`/api/internal/revalidate`).
5. Verify: counts identical before/after (regs, users, outbox, pages, events, people, media…), key pages 200, no errors in
   `docker logs krs-web`, migration name in `payload_migrations`.
- Env-only change: back up `/opt/krs/deploy/.env`, edit, `cd /opt/krs/deploy && sudo docker compose up -d --no-deps web`,
  then clear the page cache (revalidate POST below). Without it each page serves its build-time copy once.
- After a **SQL** change to public content the page cache is not cleared by itself: POST the revalidate endpoint (see
  AGENT.md §12; token = sha256("krs-revalidate:"+PAYLOAD_SECRET), run under `sudo bash`, never print the secret) or wait ≤60 s.
- SQL on prod: `sudo docker exec krs-website-postgres psql -U krs_admin -d krs_db -tAc "…"`. Writes only with a backup first and
  only when the CMS can't do it (SQL edits skip CMS version history and the audit log).

**Local test method that worked (use it for anything risky):** copy prod into `krs-dev-db`
(`pg_dump | psql` into a new DB), run `payload migrate` on the copy with the CLI, add a local super-admin
(PBKDF2 hash, see AGENT.md §12), run the **CI image** with `docker run --network host` (PORT 3098, `NODE_ENV=production`,
own container name) or `next dev` on 3099, drive it with Playwright (installed in the session scratchpad, not the repo) and
a fake SMTP sink on 127.0.0.1:2525 for mail. Drop the copy afterwards. **A DB that `next dev` has touched is marked "dev"
and hangs the production image's migration prompt** — use a fresh copy for image tests.

## 4. What's left

**Nothing is half-finished or blocking.** Open items, in order:

*Mine (when asked):*
1. One **live** walkthrough of the participant portal with a real email (only done on a local copy). Costs 1 email; delete the test account after.
2. Watch the CSP log for a few days: `sudo docker exec krs-web grep "CSP report" /app/logs/app.log`.
3. Email-queue unit tests were skipped by the owner. Rate limits other than the confirmation cap reset on restart (in-memory).
4. Remaining security gaps (AGENT.md §6): no dependency audit in CI, no magic-byte check on uploads, Payload-admin deletes not in
   the audit log, no off-server copy of dumps / no restore drill.

*Waiting on the owner:*
5. **Hackathon phase 2** (team management, submissions, judge portal). Needs the confirmed details and a storage choice: Google
   Drive (owner's 2 Oct choice) vs R2/B2 (PORTAL_SPEC). The old empty collections (`teams`, `team-members`, `registrations`,
   `submissions`, `evaluations`, `results`) are hidden in the CMS and kept for it.
6. **Payment auto-matching** needs the first Razorpay daily report (column headers). `RAZORPAY_COLLEGE_PLAIN_TEXT` is unset.
7. **After the event:** delete ID cards via the retention page (records kept 1 month after the event).
8. Stale branches `antigravity/portal`, `claude/pull-only-deploy-pl9pwz`, `feature/shared-oracle-host` (delete only if asked).
9. If sign-ups pass ~70/day for days, queued confirmations wait > 24 h (options: ask OCI for a higher limit, or move ashi.studio off the shared quota).

*Owner's own to-dos (remind, don't do):* rotate the NPM admin password (plain text in `~/how-to-add-a-new-site.md`); rotate the
weak ashi.studio mailbox passwords. `SPEC.md` §3.1, PORTAL_SPEC and the docs are current.

## 5. How the main systems work (details in AGENT.md §10–§12)

- **CMS ("everything editable"):** Website → Pages (blocks), Navigation & footer (filled with the live menus), Site settings,
  Event pages, **Labels & messages**, **Participant portal**, Privacy & terms (+ SEO), Events (+ Search & sharing), Content
  collections, Media. Empty field = built-in text (grey placeholder). Public content saves clear the page cache.
- **Admin sidebar groups:** Accounts, AURIX, Content, Website, **Admin tools** (admins only: Page visibility, Participants,
  Team accounts). Search on every list. Participants are separate from team/admin accounts everywhere.
- **Page visibility:** `site-settings.hiddenPaths`; any page incl. each competition and CMS-made pages; `/` and `/aurix` hide only
  themselves; hidden pages leave menus, cards, sitemap. Unpublished CMS pages also drop their links.
- **Participant accounts:** custom `users.emailVerified` + sha256 token (24 h, single use), not Payload `auth.verify`; unconfirmed
  participants deleted after 7 days (never if linked to a registration or a queued confirmation); admin actions
  (confirm / resend / reset / unlock / delete) via Admin tools, all audited. Daily-limit queue and rollback of the launch: AGENT.md §11.
- **Images:** originals untouched; pages request resized copies through `lib/img.ts` → `/_next/image`.

## 6. Hard rules (memories `krs-live-no-data-loss`, `shared-host-no-duplicates`)

- Site is live with real data: backup before deploys; migrations additive only; seeders create-only; never `docker compose down -v`,
  never remove `krs_*` volumes; verify counts after every deploy.
- No duplicate shared services; KRS keeps its own Postgres container. Don't restart NPM/mailserver unless needed.
- Keep the current GHCR token on the server (owner's choice). Don't print secrets. Email budget 70/day: test with the fake SMTP sink.
- If the same approach fails twice, stop and change approach.

## 7. Gotchas learned

- **Never `pkill -f <pattern>` / `pgrep -f … | kill` where your own command line contains the pattern** — it killed my shell three times. Kill by PID from `ss -tlnp`.
- A DB used by `next dev` is marked "dev"; `payload migrate` and the production image then hang on a prompt. Use a fresh copy.
- `[ test ] && cmd` as the last statement of a loop/function under `set -e` aborts the script when the test is false (broke
  krs-db-backup --pre-deploy; fixed 9e3bea0). The cancel-on-failed-backup rule did its job.
- ISR: a new image serves pages pre-built without the DB once per page — krs-deploy now clears the cache after deploy. Process
  substitution (`<(…)`) needs bash, not sh (`sudo bash -c`).
- curl + Payload session: send `Origin` (or `Sec-Fetch-Site: same-origin`) or the cookie is ignored (csrf list).
- `site_settings_hidden_pages` is retired (data kept); `site_settings.hidden_paths` is live.
- Claude Code's safety check blocks `docker exec … sh -c '…'` with globs; call the binary directly. Foreground `sleep` is blocked: use Monitor/until-loops.
- NPM: default `location /` proxies `$request_uri`; Cloudflare real IP needs a per-host `real_ip_header CF-Connecting-IP` block.
- Uploaded portraits are 1.5–2 MB PNGs; never serve them raw (use `optimizedSrc`).

## 8. Credentials (locations only)

`/opt/krs/creds/` (mail-noreply.env, mail-contact.txt, cf-origin.{pem,key}, ghcr-read.txt, deploy key…), `/opt/krs/deploy/.env`
(website: DB, PAYLOAD_SECRET, MAIL_*, AURIX_REQUIRE_ACCOUNT), `/opt/krs/deploy/finance/*.env`, `~/.git-credentials` (GitHub; also
the Actions API). Backups `/var/backups/krs` incl. env backups (`env.*.pre-launch`, `env-before-mail-*`) and the opendkim key backup.
