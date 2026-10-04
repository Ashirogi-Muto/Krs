# KRS / AURIX — Handoff (for the next Claude session)

**Written:** 4 Oct 2026 (~05:00 UTC) by the session that moved production to the Oracle host, made the site
CMS-editable, and launched participant accounts. Replaces the 2 Oct VM-era handoff (still in git history).

**Read in this order:** this file → `website/AGENT.md` (canonical technical log, gitignored, §9–§11 = everything since
3 Oct) → `docs/NEW-SERVER.md` (how this host is set up) → `website/CLAUDE.md` → `PORTAL_SPEC.md` (partly outdated,
see §5) → `website/SPEC.md` (gitignored; product/security spec, event facts).
The global router `~/.claude/CLAUDE.md` (= `~/.gemini/GEMINI.md`) and its rule files apply too.
`docs/DEPLOYMENT.md` is mostly VM-era (staging, heavy-guard, krs-deploy sha-…); trust NEW-SERVER.md over it.

---

## 1. Working with the owner

- Owner: Kalam Robotics Society (KRS), IILM University, Greater Noida. Timezone **IST**; server clock is UTC.
- Wants dense, plain answers; honest pushback; no timelines unless asked; ask when scope is ambiguous.
- Approves with short replies ("do it rn", "option 1"). Already-made decisions are listed in AGENT.md §9–§11:
  do not re-raise them.
- Git: "as for github i dont care what you do as long as its with the repo krs" → commit + push to
  `claude/deploy-ready` is fine. **Never force-push.** Merging to `main` / deleting branches: ask first.
- Owner does DNS/Cloudflare and OCI console changes themselves (give them the exact record/setting).
- Never print secrets; give file paths only. Never touch port 22 / SSH config.

## 2. What is live (4 Oct 2026)

| Thing | Where / state |
|---|---|
| Website | https://kalamroboticssociety.com — Next.js 16.3.6 standalone + Payload CMS 3.90.2 (Postgres, Lexical), container `krs-web` |
| Live commit | see `sudo krs-pull-deploy --status` (467b7aa at the 4 Oct 05:00 handoff; b14269a+ since 05:48) (image `ghcr.io/ashirogi-muto/krs-website:deploy-ready`; rollback image `krs-website:prev`) |
| Database | dedicated container `krs-website-postgres` (no published port, network `krs_internal`, volume `krs_pgdata`) |
| Uploads | volumes `krs_uploads` (public CMS media) and `krs_private_uploads` (student ID cards) |
| Finance | finance. (Official) and ledger. (Unofficial) — compose `/opt/krs/deploy/finance`, DBs in the same Postgres |
| Short links | go.kalamroboticssociety.com |
| Proxy/TLS | Cloudflare (proxied) → Nginx Proxy Manager (shared, port 81 admin) → 172.17.0.1:3003; Cloudflare origin cert (NPM cert id 14) expires **2027-10-03** (intentional); HSTS on in NPM |
| Accounts | **LAUNCHED 3 Oct ~17:40 UTC**: `AURIX_REQUIRE_ACCOUNT=1` → team registration needs a logged-in, email-confirmed account (team leader only) |
| Email | app → docker-mailserver `mail.ashi.studio:587` STARTTLS as noreply@kalamroboticssociety.com → OCI Email Delivery (ap-mumbai-1). DKIM selector `mail`, SPF + DMARC pass. **MAIL_DAILY_LIMIT=70** (OCI free tier 100/day shared with ashi.studio) |
| Inbox | contact@kalamroboticssociety.com (+ alias postmaster@) on the mailserver; MX → mail.ashi.studio; owner reads it in Gmail |
| Events | Robo Soccer / Race / Expo ₹499 (prize ₹30,000 each), Robo Ideathon ₹399 (₹10,000), Hackathon ₹749 (₹1,00,000) shown **Coming Soon**; all start **27 Oct 2026**; total prizes ₹2,00,000 |
| Hidden pages (CMS Site settings) | /team, /join, /contact, /insights, /aurix/schedule, /aurix/results, /judge |
| Data at handoff | 1 registration (PENDING / AWAITING_PAYMENT), 8 users (7 staff/admin, 1 participant — unconfirmed, see §4 P0-1) |

## 3. Server, deploy and ops

**Host:** shared Oracle ARM (arm64) box, Ubuntu, 161.118.168.100. Shared services (NPM, Docker, mailserver,
other projects) must not be duplicated or restarted casually (memory `shared-host-no-duplicates`).

**Paths:** `/opt/krs/repo` (read-only deploy clone), `/opt/krs/creds` (700, secrets), `/opt/krs/deploy/{compose.yml,.env,finance/}`,
backups `/var/backups/krs` (root only). Dev checkout (where code is edited): `/home/ubuntu/krs` (`website/`, `financial/`, `docs/`).
Mailserver: `/home/ubuntu/mailserver` (docker-mailserver, `setup.sh`), container `mailserver`.

**Deploy (website):**
1. Edit in `/home/ubuntu/krs/website`; `nice npx tsc --noEmit -p .`; `npm test` (53 tests, all pass).
2. Commit + push `claude/deploy-ready` (push works via `~/.git-credentials`; remote says the repo moved to
   `Ashirogi-Muto/Krs` — harmless redirect).
3. GitHub Actions "Build website image" builds arm64 natively. Watch:
   `TOK=$(grep -m1 github.com ~/.git-credentials | sed -E 's#https://[^:]*:([^@]*)@.*#\1#')` then
   `curl -s -H "Authorization: Bearer $TOK" "https://api.github.com/repos/Ashirogi-Muto/krs/actions/runs?head_sha=$(git rev-parse HEAD)"` (never echo $TOK).
4. **[PARTLY: account/visibility tests added; email-queue tests skipped by the owner]** **`sudo krs-db-backup` FIRST — the deploy script does NOT back up.** (I wrongly assumed it did for the 14d1165 and
   467b7aa deploys; no data was at risk, neither had migrations, and a backup was taken on 4 Oct 04:59 UTC.)
5. `sudo krs-pull-deploy --finance skip` → pulls the image, swaps, triggers Payload init + pending migrations, auto-rolls back to `:prev` on failure.
6. Verify: counts before/after (`event_registrations`, `users`, `email_outbox`, max `updated_at`), key pages 200, `docker logs krs-web`.
- Env change only (no new image): edit `/opt/krs/deploy/.env` (back it up to `/var/backups/krs/` first), then
  `cd /opt/krs/deploy && sudo docker compose up -d web`.
- Timers: `krs-db-backup.timer` nightly ~21:00 UTC (keeps newest **7** dumps per DB — count-based, see P0-2),
  `krs-health.timer` every minute. Cron (user): `~/.gemini/scripts/sync-live-state.sh` hourly, `backup-project-memory.sh` 03:00.
- SQL on prod: `sudo docker exec krs-website-postgres sh -c 'psql -U "$POSTGRES_USER" -d "$POSTGRES_DB" -tAc "…"'`.
  Read-only queries are fine; writes only with a backup first and only when the CMS can't do it.

**Local dev tooling:** Postgres `krs-dev-db` on 127.0.0.1:5499 (DBs `krs_dev` = dev push, `krs_migtest` = generate/test
migrations only). Dev server: `DATABASE_URL=postgresql://krs_dev:krs_dev_local@127.0.0.1:5499/krs_dev PAYLOAD_SECRET=dev-only-local-secret NEXT_PUBLIC_SITE_URL=http://127.0.0.1:3099 nice npx next dev -p 3099 -H 127.0.0.1`
(add `AURIX_REQUIRE_ACCOUNT=1 STAGING_SHOW_HIDDEN_ROUTES=/login,/register,/aurix/portal` to test accounts).
Mail testing without spending the real budget: fake SMTP sink (`smtpsink.py` pattern in AGENT.md §11: plain socket
server on 127.0.0.1:2525, `MAIL_SERVER=127.0.0.1 MAIL_PORT=2525 MAIL_STARTTLS=false MAIL_USERNAME=test MAIL_PASSWORD=test`).

## 4. What's left — prioritised

### P0 — do first
> **Status 4 Oct 2026 (end of day).** Done: P0 (backups in the deploy path, 2-email/day cap + wrong-address hint, portal walkthrough
> local), P1-5 (CSP enforced), P1-6 (portal wording in the CMS), P1-7 (/contact live, contact email set), P1-8 (docs). Also built:
> Page visibility + Participants + Team accounts screens, search everywhere in the CMS, fewer sidebar groups, image
> optimizer, Hackathon live (12 h, teams 1–5, registration closes 18 Oct), short links for every event. Details: website/AGENT.md §12.
> Still open: see §4 items below that are not struck out; user 9 (real) confirms their own email.

1. **[DONE 4 Oct (cap + hint; user 9 is real and confirms themself)]** **First real participant hasn't confirmed.** User 9 signed up 3 Oct 19:10 UTC; 4 confirmation emails were sent
   within 90 s (1 + 3 resends), all accepted by OCI (`250 Ok`). Not confirmed ~10 h later. Possible causes: spam folder,
   typo in address, OCI suppression list, or they just haven't clicked. Actions: (a) owner checks the OCI Email Delivery
   suppression list; (b) add a **resend cooldown** (e.g. 2 min between sends per account; today it's 3/h, 6/day) so
   impatient clicks don't burn the 70/day budget; (c) consider showing "sent to <email> — wrong address? sign up again"
   so typos are recoverable (the account would otherwise sit until the 7-day cleanup).
2. **[DONE 4 Oct (krs-deploy runs a pre-deploy backup)]** **Backups:** `krs-pull-deploy` doesn't run `krs-db-backup`. Fix: add a backup step to `ops/bin/krs-pull-deploy` (or
   `ops/bin/krs-deploy`, which it calls; installed copies are in `/usr/local/sbin`), or keep running it by hand. Also `KEEP=7` is by count, so a busy
   deploy day (each manual backup = 1 dump) pushes out the nightly history (on 3 Oct all 7 dumps were from one day).
   Better: keep the newest 7 nightly + separate pre-deploy dumps with age-based pruning. Uploads (ID cards) are not
   dumped; owner relies on OCI whole-server backups (their decision).
3. **[DONE locally 4 Oct; one live check with a real email still optional]** **Portal deadline:** PORTAL_SPEC phase 1 target was **before 20 Oct**; events start **27 Oct**. Phase 1 is
   built and live (claim, dashboard, events, announcements, profile, results empty state) plus accounts, email
   confirmation and password reset, which go beyond the spec. Do a logged-in walkthrough of every portal page
   with a test account (costs 1 email; delete the account afterwards) — not done after the logo change.

### P1 — next
4. **Automated tests for accounts + email queue.** SPEC requires tests before a security control counts as complete;
   the 53 unit tests don't cover `src/lib/auth/participant.ts` or the queue paths in `src/lib/email/outbox.ts`
   (all testing was manual; scenarios listed in AGENT.md §11). Add tests for: token hash/expiry/single use,
   safeNext, queue at limit, dedupe, verification-first ordering, skip when confirmed, cleanup skips queued/linked.
5. **[DONE 4 Oct (full CSP enforced)]** **CSP enforcement.** Report-only reports (`docker exec krs-web grep "CSP report" /app/logs/app.log`) show only:
   106× `script-src-elem` blocking `https://static.cloudflareinsights.com/beacon.min.js` (Cloudflare Web Analytics,
   injected by Cloudflare) and 1× `eval` on /aurix (3 Oct 18:31; probably a browser extension — check again).
   Next: either allow `https://static.cloudflareinsights.com` in script-src + `https://cloudflareinsights.com` in
   connect-src, or owner turns Web Analytics off; collect a few more days; then move the full policy from
   `Content-Security-Policy-Report-Only` to enforced in `website/next.config.mjs` (keep report-uri).
6. **[DONE 4 Oct (Website → Participant portal)]** **Portal wording into the CMS** — the last piece of the "everything editable" project. 9 files under
   `src/app/(frontend)/(portal)/aurix/portal/` (~1,300 lines) still have hard-coded text; none use
   `getFormTexts()`. Follow the existing pattern: add a group to `src/lib/form-texts-defaults.ts` (spec drives CMS
   fields + defaults; empty field = built-in text), generate the migration on `krs_migtest`, check it's additive.
   Staff tools (check-in, payment matching, retention, judge) stay in code (owner decision).
7. **[DONE for /contact (live); /join, /insights, /aurix/schedule, /aurix/results, /judge, /learning still hidden by choice]** **Hidden pages — owner decisions:** /team, /join, /contact, /insights, /aurix/schedule, /aurix/results, /judge.
   Join + Contact (CMS form blocks, working) were waiting on a confirmed contact email; `site_settings.contact_email`
   is empty in the new DB. Now contact@kalamroboticssociety.com exists → ask the owner if that's the address, set it,
   then unhide. (The old VM used kalamrobotics@iilm.edu; the old Contact page had an unconfirmed contact@kalamrobotics.in.)
8. **[DONE 4 Oct]** **Docs out of date:** `PORTAL_SPEC.md` still says "no email verification" and "password reset out of scope" —
   both now exist; update §1/§4/§6/§12. Its working-tree change (4 blank lines, someone else's) is uncommitted — leave
   it or ask. AGENT.md §6 security checklist is known-wrong (§7 audit); reconcile it with what is actually fixed and tested.

### P2 — later / waiting on the owner
9. **Phase 2 (Hackathon)** — only after the owner confirms Hackathon details (team size, rounds, deadlines, tracks).
   Team management, PPT/PDF submissions, judge portal `/judge` (hidden). **Storage conflict to resolve with the owner:**
   PORTAL_SPEC says R2/B2 presigned uploads; on 2 Oct the owner chose the owner's Google Drive (OAuth, drive.file scope).
10. **Payment report auto-matching** — payment matching page exists; auto-match from Razorpay's daily report is waiting
    for the owner to send a first report (column headers). `RAZORPAY_COLLEGE_PLAIN_TEXT` is not set on the new server
    (only matters once the Razorpay page's college field is switched to Text).
11. **Git housekeeping (ask first):** `claude/deploy-ready` was merged into `main` on 4 Oct 2026 (was 44+ commits ahead). Stale remote
    branches: `antigravity/portal`, `claude/pull-only-deploy-pl9pwz`, `feature/shared-oracle-host`. Repo root has
    untracked owner files (4 brochure .docx, CyberRakshak report PDF) — never commit them; `website/next-env.d.ts` is
    modified by `next dev` (harmless).
12. **Email capacity:** 70/day rolling. If sign-ups exceed ~70/day for several days, queued confirmations wait > 24 h
    (the message says "usually"). Options if it happens: ask OCI for a higher limit, or move ashi.studio off the shared quota.
13. **After the event:** delete ID cards (owner: records kept 1 month after the event) via the retention page.
14. Rate limits are in-memory (one container): they reset on every deploy/restart. Fine for now; note it if scaling out.

### Owner's own to-dos (remind, don't do)
- Rotate the NPM admin password (plain text in `~/how-to-add-a-new-site.md`).
- Rotate the weak ashi.studio mailbox passwords.
- Check the OCI suppression list (P0-1) and confirm the Oracle approved sender for contact@ if Gmail "send as" is wanted.
- Decide: hidden pages + contact email (P1-7), Hackathon details + storage (P2-9), main merge (P2-11).

## 5. How the participant accounts work (summary; details AGENT.md §11)

- Custom `users.emailVerified` + sha256 token (24 h, single use) — **not** Payload `auth.verify` (would lock staff out).
- Sign-up → logged in → confirmation email (or queued) → gate screen until confirmed. Confirming links earlier
  registrations whose leader email matches (only after confirmation, so no takeover).
- Registration API with the switch on: 401 logged out, 403 unconfirmed; leader email forced to the account email;
  `participants=[user]`; 10/h per user, 40/h per IP.
- Forgot/reset password: `payload.forgotPassword({disableEmail})` + our email, 60-min link; reset also confirms the email.
- Unconfirmed PARTICIPANT accounts deleted after 7 days (every 6 h), never if linked to a registration or a
  confirmation is still queued. Participants are told on sign-up, in the email and on the gate.
- **Daily limit queue (14d1165):** rolling 24 h count of SENT outbox rows vs MAIL_DAILY_LIMIT. At the limit a
  confirmation becomes a PENDING outbox row (no link stored); the participant is told to check tomorrow. Worker
  (1 email / 60 s) sends confirmations before registration emails and creates the link at send time. Resets aren't
  queued (503 "try tomorrow", same answer for every address). Message text = CMS label `account.mailLimit`.
- Rollback of the launch: remove `AURIX_REQUIRE_ACCOUNT=1` from `/opt/krs/deploy/.env`, `docker compose up -d web`,
  re-add /login, /register, /aurix/portal to Hidden pages.

## 6. Hard rules (memories `krs-live-no-data-loss`, `shared-host-no-duplicates`)

- Site is live with real data: backup before deploys; migrations additive only (generate on `krs_migtest`, read the SQL);
  seeders create-only; never `docker compose down -v`, never remove `krs_*` volumes.
- No duplicate shared services; KRS keeps its own Postgres container. Don't restart NPM/mailserver unless needed.
- Keep the current GHCR token on the server (owner's choice). Don't print secrets.
- If the same approach fails twice, stop and change approach.

## 7. Gotchas learned

- curl + Payload session: send `Sec-Fetch-Site: same-origin` (or Origin) or the cookie is ignored (csrf list). Browsers do this.
- Payload dev push marks a DB as "dev" → `payload migrate` then hangs on a prompt. Generate/test migrations on `krs_migtest`.
- `pkill -f <pattern>` kills your own shell if its command line contains the pattern → kill by PID from `ss -tlnp`.
- Claude Code's safety check blocks `docker exec … sh -c '…'` with globs (thinks it may be an rm) → call the binary directly.
- `site_settings_hidden_pages` (column `value`) holds Hidden pages; SQL edits skip CMS version history.
- NPM: default `location /` proxies `$request_uri` (rewrites in Advanced do nothing); Cloudflare real IP needs a per-host
  `real_ip_header CF-Connecting-IP` block (NPM's global list is CloudFront).
- Foreground `sleep` is blocked in this harness; wait with a background command or an until-loop.

## 8. Credentials (locations only)

`/opt/krs/creds/` (mail-noreply.env, mail-contact.txt, cf-origin.{pem,key}, …), `/opt/krs/deploy/.env` (website: DB,
PAYLOAD_SECRET, MAIL_*), `/opt/krs/deploy/finance/*.env`, `~/.git-credentials` (GitHub, also used for the Actions API),
NPM API: create a token through NPM's API login when needed (the last one lived only in a session scratchpad). Backups `/var/backups/krs` incl. env backups
(`env.*.pre-launch`, `env-before-mail-*`) and the opendkim key backup.
