# KRS / AURIX — Handoff (for the next Claude session)

**Written:** 2 Oct 2026 by the operator session (Claude) that deployed and runs the server.
**Read in this order:** this file → `/opt/krs/DEPLOYMENT.md` (operations; section 0 = safety rules) →
`/opt/krs/BRIEFING.md` (original hard rules — still binding) → `/opt/krs/claude-work/ops/README.md` →
`/opt/krs/PORTAL_SPEC.md` (participant portal spec given to the other agent).
Never print secrets. Never assume — verify on the server.

---

## 1. Who / how to work with the owner

- Owner: Kalam Robotics Society (KRS), IILM University, Greater Noida. Timezone **IST** (server clock is UTC).
- Prefers short, plain answers; is **watching usage limits** — avoid long outputs, avoid re-reading big files, don't
  re-arm 30-minute monitors just to watch (the server's own health timer covers that).
- Approves things in numbered lists ("1 2 3 go ahead"). Ask before: destructive/irreversible actions, DNS/Cloudflare
  changes (owner does them), new open ports, deleting data, rebooting, anything touching `/etc/ssh`, cloud-init, netplan.
- Owner edits secrets themselves; we only tell them the file path. Passwords are never typed in chat.

## 2. What is live

| Thing | Where | Notes |
|---|---|---|
| Website | https://kalamroboticssociety.com | Next.js 16 + Payload CMS 3, container `krs-web`, image `krs-website:latest` (`:prev` = rollback) |
| Live website commit | `3f6b19b` (branch `claude/deploy-ready`) | ops-only commits after it don't need a site build |
| Short links | https://go.kalamroboticssociety.com/<slug> (+ `/go/<slug>`) | CMS "Short Links"; 12 starter links incl. `status` |
| Registration | `/aurix/register`, status lookup `/aurix/status` | student-ID upload (private volume), Razorpay page pre-fill |
| CMS | `/admin` | owner = SUPER_ADMIN; team roles FINANCE/VERIFIER/COORDINATOR + dashboards + CSV exports |
| Finance portals | https://finance.kalamroboticssociety.com (Official), https://ledger.kalamroboticssociety.com (Unofficial) | see §5 — **deploy status in §9** |
| Hackathon | "Coming Soon" (CMS flag) | fee 749 & prize ₹1,00,000 stored; details hidden |
| Events | Robo Soccer/Race/Expo (₹499), Robo Ideathon (₹399); 27–28 Oct 2026 | prize pools 30k/30k/30k/10k; total ₹2,00,000 |
| Hidden routes | `src/lib/visibility.ts` | portal, judge, login, register, team, join, contact, insights, schedule, results |

Real registrations have started (3 at last check). The test one `AX26-IDE-WVPCHK` ("nox") was marked verified on owner request.

## 3. Server and safety (MUST follow)

- VM `krs`, Ubuntu 24.04, 2 vCPU, 7.8 GiB RAM (no swap, host balloon), 29 GB **thin-provisioned** disk.
- **2 Oct 05:06 UTC crash** (caused by this session): mass `docker builder prune` (~19 GB tiny files) + root mounted
  with online `discard` → TRIM storm on host storage → ~2 s disk latency → hung tasks → VM reset. Fixes applied:
  `discard` removed from `/etc/fstab` (backup `/etc/fstab.bak-20261002-054056`), gentle weekly TRIM
  (`krs-fstrim-gentle`, Mon 03:00 IST), `vm.dirty_bytes` 256 MB (`/etc/sysctl.d/90-krs-writeback.conf`),
  container memory/CPU/pid caps, builds moved to GitHub.
- **Health check:** `krs-health.timer` every minute; alerts (20% headroom) in `journalctl -t krs-health`;
  status in `sudo cat /var/lib/krs-health/status`.
- **Heavy jobs only via** `sudo krs-heavy-guard <cmd>` (refuses without headroom, interrupts on IO pressure).
- **Never build images on the VM. Never `docker builder prune -af` / `system prune -a`.**
- If you need `npm ci` (type-check, Payload codegen), put node_modules in RAM:
  `docker run --tmpfs /app/node_modules:rw,exec,size=2500m,uid=1000,gid=1000 --tmpfs /tmp:rw,exec,size=1g,... node:22-alpine`
  (see how `src/migrations/*team_roles*` was generated: throwaway Postgres + tmpfs).
- Keep ≥ 8 GB disk free (was ~24 GB free).

## 4. Deploy pipeline (website)

1. Commit + push `claude/deploy-ready` (push: `GIT_ASKPASS=/opt/krs/creds/git-askpass.sh git push https://github.com/Ashirogi-Muto/Krs.git claude/deploy-ready`).
2. GitHub Actions `website-image.yml` builds `ghcr.io/ashirogi-muto/krs-website:sha-<full sha>` (watch with the API;
   PAT in `/opt/krs/creds/github-pat.txt`, read via a curl `-K -` config, never on the command line).
3. `sudo krs-stage-test sha-<sha>` → app on 127.0.0.1:3013 against a fresh copy of the prod DB; test; `sudo krs-stage-test --stop`.
4. `sudo krs-deploy sha-<sha>` → pull (guarded), swap, health, migrations, auto-rollback to `:prev`.
- Payload starts lazily: migrations run on the first DB request (krs-deploy triggers it).
- Testing with curl: send `Origin: https://kalamroboticssociety.com` and pass cookies as a header (Secure cookies).
- Schema changes: `payload migrate:create` against a throwaway DB; review SQL; add nullable→backfill→NOT NULL; data inserts `ON CONFLICT DO NOTHING`.
- `SYNC_SEED_EVENTS` must stay `0` (owner edits events in the CMS).

## 5. Finance portals (financial/ app)

- Same images, two instances: compose `/opt/krs/deploy/finance/compose.yml` (project `krs-finance`), env files
  `/opt/krs/deploy/finance/official.env` and `unofficial.env` (mode 600). Databases `krs_fin_official` /
  `krs_fin_unofficial` with their own roles inside the existing `krs-website-postgres`.
- Ports: Official API 8051 / web 3051, Unofficial API 8052 / web 3052 (127.0.0.1). nginx: `/api/*` → API, else → web.
- Accounts (from env, owner sets passwords, 12+ chars, empty = not created), apply with `sudo krs-finance-reload official|unofficial|all`:
  `audit` = ADMIN (financial audit dept only; only role that sees users + audit trail; invisible to others),
  `treasurer` = EDITOR (can create/disable VIEWER accounts on `/team`), `president` = VIEWER.
- Owner decisions: audit account must NOT be log-free (declined; everything is logged, admin-only visibility);
  "Unofficial" ledger = separate finance system, both visible to audit with full timestamps.
- Deploy: `sudo krs-finance-deploy sha-<sha>` (GitHub workflow `finance-images.yml` builds backend+frontend, runs 36 backend tests).
- Fixed: hard-coded real admin password (was public before the repo went private — owner told to rotate elsewhere),
  env names mismatch, login rate limit (5 fails → 15 min lock), missing `frontend/src/lib` (recreated; `.gitignore` fixed),
  missing `public/`, container start runs `alembic upgrade head` + reference seed.

## 6. Website team roles — BUILT and deployed 2 Oct (commit 52da350); table below = original agreement, details in DEPLOYMENT.md §8b

Owner confirmed (2 Oct): roles must **overlap** (multi-select; anyone can hold several). Teams and access:
| Team | Sees | Can change |
|---|---|---|
| Registration | all registrations, ID cards, ID queue, contacts | ID verification; confirm/reject teams |
| Technical event (= current COORDINATOR) | only assigned events: rosters (names, colleges, leader phone), check-in CSV | nothing |
| Logistics | counts per event, check-in list without emails/IDs | nothing |
| Discipline committee | names, teams, colleges, events (no contacts/IDs) | nothing |
| Technical support | status lookups (code, team, statuses), no IDs | nothing |
| Media & outreach | website content (events text, blogs, gallery, short links), registration numbers only | content + short links |
| Sponsors | totals only (registrations, participants, colleges, events, prize pools) | nothing |
| Decoration | totals per event | nothing |
| Finance (one person) | money dashboard | payment fields |
Core team: Team Head (+ team role → full team view/exports), Core Member & Supervisor (all dashboards read-only),
President & Event Head (manage registrations), Treasurer (finance view). SUPER_ADMIN stays the owner.
Implementation notes: Payload `select` with `hasMany` → new migration + backfill from `role`; refactor every
`user.role ===` check (collections, session.ts, dashboard, export route) to a `hasRole(user, roles)` over the array;
keep field-level access; test each role on staging like the 2 Oct permission matrix (see DEPLOYMENT.md §8b).

## 7. Open items (owner input needed)

1. **Payment verification automation** — waiting for the first Razorpay daily report (column headers) — build
   upload + auto-match (email + phone + event + amount) in the CMS; then confirmation emails.
2. **Email provider** deferred by owner (recommend transactional SMTP on 587 + SPF/DKIM; no mail server on VM).
3. **Privacy policy** draft `/opt/krs/drafts/privacy-policy-DRAFT.md` needs contact email, record retention, ID deletion date.
4. **Participant portal** — other agent (Antigravity) is building it from `PORTAL_SPEC.md` on a branch
   (expected `antigravity/portal`); review diff, stage-test, deploy; keep hidden until owner approves.
5. ~~KRS logo~~ (done 2 Oct: navbar/footer mark, KRS favicon on KRS pages, finance portals; sources in `/opt/krs/incoming/logos`, no SVG yet); unverified KRS content (projects/blogs/learning/team).
6. Off-box backups; R2/B2 object storage for PPT submissions (Phase 2); delete ID cards after the event.
7. Owner's `~/.claude/settings.json` has invalid JSON (stray `{ "defaultMode": ... }` in `permissions`) — owner to fix.
8. Merge `claude/deploy-ready` → `main` on GitHub when owner is ready (main is still the initial commit).

## 8. Credentials and secrets (locations only)

`/opt/krs/creds/` (700): `github-pat.txt` (fine-grained, repo-scoped), `ghcr-read.txt` (classic, read:packages only),
`git-askpass.sh`. `/opt/krs/deploy/.env` (website), `/opt/krs/deploy/finance/*.env` (finance), `/opt/krs/app/website/.env`
(DB container). Backups `/var/backups/krs/` (root). Never echo these; redact `ghp_`/`github_pat_` in any output.

## 9. Status at handoff time (2 Oct 2026, ~13:35 IST)

- Health: `overall=OK`; disk 23 GB free; RAM 6.4 GiB available; only 22/80/443 public.
- Website: commit `3f6b19b` live (team panels, favicon/OG/SEO, status page, short links). Rollback `krs-website:prev`.
- Finance portals: commit `fc61077` live on finance. (Official) and ledger. (Unofficial); both healthy behind nginx
  (`/etc/nginx/sites-available/krs-finance`). `treasurer` + `president` exist on both (2 Oct);
  `audit` was **skipped (password < 12 chars)** — owner to fix the env line and run `sudo krs-finance-reload all`.
  Password resets: only `audit` ADMIN in the portal or `sudo krs-finance-passwd <ledger> <user>`; .env is create-only.
- Backups: nightly 02:30 IST for website + both ledgers (`/var/backups/krs`, keep 7 each). No off-box copy yet.
- Branch `claude/deploy-ready` pushed (latest includes ops scripts and this handoff under `docs/`).
- Other agent: still building the participant portal (not yet received).
- Next task candidates: §6 website team roles; §7.1 payment-report matching (waiting for report); portal review.

## 10. Updates later on 2 Oct (second session)

- Finance: password resets only by the ADMIN (`ashi` on both ledgers) or `sudo krs-finance-passwd <ledger> <user>`;
  .env passwords are create-only; treasurer reset removed; login now redirects to /dashboard.
- CMS staff roles live (§6 / DEPLOYMENT.md §8b). Only the owner account exists; owner creates team accounts.
- KRS logos/favicons live on the website (KRS pages; AURIX pages keep AURIX) and finance portals.
- `krs-stage-test` fixed: restores the newest **krs-db-*** dump (it picked a finance dump) and waits for Postgres over TCP.
- Website `tests/business-logic.test.ts` has 5 stale seed-data assertions (old fees like 699) — pre-existing, not fixed.

## 11. Later on 2 Oct (third session)

- 09:48 UTC the **host (Proxmox) shut the VM down cleanly** ("hypervisor initiated shutdown"); back 10:04. Not a crash.
- Finance: post-login crash fixed (navbar hook after early return) — commit 5d875ee live.
- Website f85bb75 live: check-in, payment matching, AURIX Schedule global, email outbox (waiting for MAIL_* — owner),
  retention page. See DEPLOYMENT.md §8d. `main` was fast-forwarded to deploy-ready (5fa9c09) on owner request.
- Owner decisions: records kept 1 month after the event; backups → Cloudflare R2 (encrypted, 7-day lifecycle) — owner
  to create bucket + token; PPT submissions → owner's Google Drive (OAuth as owner, drive.file scope) once the portal lands.
- In progress (uncommitted in claude-work): CMS phase 1 — projects/posts/resources/people read from CMS with
  published/needsReview switches + one-time seed import (`src/payload/importSeedContent.ts`). Then: site settings +
  page visibility toggles, page texts (home, AURIX landing, FAQ, rules, privacy, terms), gallery.
- Firewall routed-policy check: owner declined the `ufw status` command; still open.

## 12. Participant portal (2 Oct, commit 0d90c47) — deployed HIDDEN
- Integrated from `antigravity/portal` onto deploy-ready (branch was based on a2a7ef3; its migration replaced by
  `20261002_110159_portal_participants_announcements`). Fixes: roles (Organizer gone), announcement read scoped to
  participant's events, same-origin on claim/profile, sign-up forced PARTICIPANT with no staff roles.
- Staging acceptance: 27/28 (the 1 = test expected 201, route returns 200). Test script: `claude-work/.codegen/portal-test.sh`.
- Hidden in production via `lib/visibility.ts` (/aurix/portal, /login, /register → 404). To publish: remove those
  three entries + deploy, after owner approval. Staging can show them with `STAGING_SHOW_HIDDEN_ROUTES` (env file).
- Open: email verification for portal accounts (needs MAIL_*); PPT submissions to owner's Google Drive (phase 2).
- Also live: email pacing (1/min, 17:00-09:00 IST, backlog 150, 450/day), Razorpay college pre-fill compacted until
  the page field is switched to Text (then set RAZORPAY_COLLEGE_PLAIN_TEXT=1), KRS content from CMS (commit 286a93f).

## 13. CMS-editable site phases 2+3 live (2 Oct, commits 46c00e7, 4df9092)
- Website group in /admin: Site settings (society texts, footer, socials, Hidden pages = admins only), Page texts
  (home, AURIX landing incl. steps with {dates}, competitions, FAQ, rules, gallery), Privacy & terms (sections),
  Gallery albums, AURIX Schedule. All initialised once from today's text. Pages refresh within ~60-120 s (ISR).
- Hidden pages now come from the CMS (lib/site-settings.ts getHiddenRoutes; lib/visibility.ts list = default only).
- Email: no window by default, 1/min, 450/24 h, permanent 5xx fail at once, unique dedupeKey per registration,
  fixed Message-ID, registration "confirmationEmail" status. Waiting for MAIL_* (Google Workspace plan sent to owner).
- Staging tests: .codegen/{phase2-test,phase3-test,portal-test,e2e-retry}.sh; stage-test waits 90 s for its DB.
- 13:10 UTC disk-latency spike (1.3 s/IO, ~1 min) from back-to-back staging runs; no hung tasks. Batch staging runs.
- 10:23 UTC owner's account bulk-deleted all 5 registrations (tests?) in the CMS; 6 orphan ID files remain —
  waiting for owner: delete them or restore 3 from krs-db-20261002-093750. TODO: delete ID files with a registration.
- Open content fixes: AURIX "How to compete" steps (invite links / proposal screening are not real); privacy text outdated.

## 14. Later 2 Oct (UTC 14:00-14:35)
- 6 orphan test ID files deleted (owner confirmed tests). Registration delete now also deletes its ID files (DB + disk)
  and emails (afterDelete hook; emails matched by code because the FK is nulled first). Website 05412cd live.
- AURIX pages: navbar/footer use the logo's own "A" graphic (public/images/aurix-mark.png, owner's choice — never a
  typed letter); landing hero uses the full logo (aurix-logo-full.png). KRS side keeps the "K" from the KRS logo.
- Finance UI v2 live (b542f59): KRS palette, sidebar + phone drawer + FAB, tables as cards on phones, charts
  (colours validated with the dataviz validator: income #3987e5, expenses #d95926). CI job "screenshots" in
  finance-images.yml photographs every page (desktop + phone) with sample data; download: .codegen/get-shots.sh.
- krs-stage-test now waits for "PostgreSQL init process complete" (fixed restore races) — synced to ops/bin.
- Owner rules today: be careful with the server (no outages): one heavy job at a time, batch staging runs.
