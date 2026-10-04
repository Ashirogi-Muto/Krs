# AURIX Participant Portal — Implementation Specification

**Audience:** the coding agent (or developer) who will build the participant portal.
**Written:** 2 Oct 2026 by the agent that deployed and operates the live site.
> **Status update, 4 Oct 2026 (owner decisions and what was built since 2 Oct).** Phase 1 is built and live. Where this
> file contradicts the list below, the list wins; the sections themselves keep their original wording as history.
> - **Accounts (live since 3 Oct):** sign-up needs a **mandatory email confirmation** (custom `users.emailVerified`, 24 h single-use link,
>   not Payload `auth.verify`); unconfirmed participant accounts are deleted after 7 days; only the team leader needs an account;
>   registration is login-gated. At most **2 confirmation emails per account per 24 h**, 2 minutes apart.
> - **Email exists:** docker-mailserver → Oracle Email Delivery, `noreply@` / `contact@kalamroboticssociety.com`, DKIM/SPF/DMARC pass,
>   70 emails/day, queue at the limit. **Password reset by email exists** (`/forgot-password`, 60-minute link); the "contact the organizers" note is gone.
> - **Claiming** is allowed only for a confirmed email (an email match is now proof). **Phase 1 (claim, dashboard, events, teams,
>   announcements, results empty state, profile) is done.** The portal wording is editable in the CMS (Website → Participant portal).
> - **Hackathon is live (4 Oct):** 12 hours, teams of 1–5, round 1 online PPT screening, round 2 on 27 Oct, ₹749, registration
>   closes 18 Oct, 9 tracks, no hardware provided. Phase 2 (team management, submissions, judge portal) is **not built**; the legacy empty collections
>   (`teams`, `team-members`, `registrations`, `submissions`, `evaluations`, `results`) are hidden in the CMS and kept for it.
> - **Storage for Phase 2 submissions:** the owner chose Google Drive (OAuth, `drive.file`) on 2 Oct, which differs from the R2/B2 plan in
>   rule 11 and §12 — still to be confirmed before Phase 2.
> - **Pages hidden today (CMS → Website → Page visibility, admins only):** /join, /insights, /aurix/schedule, /aurix/results, /judge, /learning.
>   /contact and /team are live. The rule "hide pages in `src/lib/visibility.ts`" is now the default only; the CMS decides.
> - **Admin:** Admin tools → Participants / Team accounts / Page visibility; every deploy runs a pre-deploy backup; the full CSP is enforced.

**Read this whole file before writing any code.** Every rule here exists because something already went wrong once,
or because the site is live and taking real registrations. If anything here conflicts with what you see in the code,
stop and ask the owner — do not guess.

---

## 0. The 15 rules that must never be broken

1. **Never touch the live server.** No `docker`, `nginx`, `systemctl`, `ufw`, database or file changes on the VM
   (`krs`, 10.10.10.10). You deliver a **git branch**; the operator agent reviews, tests and deploys it.
2. **Never build on the VM.** A build needs 3–4 GB of temporary disk; the VM must keep ≥ 8 GB free. Build on your own machine.
3. **Branch from `claude/deploy-ready`** (or `main` once it has been merged). Work on a new branch
   `antigravity/portal`. Never push to `main` or `claude/deploy-ready`. Never force-push.
4. **Never commit secrets** (`.env`, tokens, passwords, keys, real participant data). `.env*` is git-ignored — keep it that way.
5. **Use Payload's real authentication only.** Never re-introduce custom JWT signing, password-less login, roles derived
   from email strings, or any client-trusted identity. (The original code did all three — see §13.)
6. **Every protected page and API must authorise on the server** (`getSessionUser()` / `payload.auth()` / collection access
   functions). Hiding a link or a page in the UI is not security.
7. **Never trust the client** for: role, user id, registration id/ownership, payment status, ID-verification status,
   team size, deadlines, scores, amounts, or file type.
8. **Reuse the existing `event-registrations` collection.** Do not create a second registration system, and do not change
   the meaning of its existing fields — payment reconciliation and the public status page depend on them.
9. **Every database schema change goes through a committed Payload migration** generated with `payload migrate:create`
   against a **throwaway** database. Never run Payload in dev/push mode against any shared database (see §10).
10. **Migrations must be safe on existing data:** add columns nullable, backfill, then add `NOT NULL`; data inserts use
    `ON CONFLICT DO NOTHING`; never drop or rename columns/tables without the owner's written approval.
11. **No files on the VM's disk for participant uploads** (PPT/PPTX, images, PDFs) except the existing student-ID flow.
    Submissions need object storage (R2 or B2) with presigned browser uploads — the provider is **not chosen yet** (§12).
12. **Zero fabrication.** No invented event facts, fees, prizes, dates, team sizes, results, testimonials, sample teams or
    statistics anywhere in the UI. Everything factual comes from the CMS. If data is missing, show an honest empty state.
13. **No hard-coded dates, fees, prizes or team sizes** in components. Read them from the CMS (`lib/data/events.ts`) and
    format with `lib/format.ts`.
14. **The portal stays hidden** (`src/lib/visibility.ts`) until the owner approves going live. Your branch must keep the
    hidden entries; the operator removes them at launch.
15. **Build and type-check must pass with zero errors** (`npx tsc --noEmit`, `npm run build`) before you hand over.

---

## 1. What is live today

| Thing | URL / location | Notes |
|---|---|---|
| Public site | https://kalamroboticssociety.com | Next.js 16 + Payload 3, behind Cloudflare + nginx |
| AURIX | /aurix, /aurix/competitions, /aurix/{robo-soccer,robo-race,robo-expo,robo-ideathon,hackathon} | Events come from the CMS |
| Registration | /aurix/register (`?event=<slug>`) | Public form, no account; creates `event-registrations` |
| Status lookup | /aurix/status (`?code=`) | Code + leader email → statuses |
| Short links | https://go.kalamroboticssociety.com/<slug>, /go/<slug> | CMS collection `short-links` |
| CMS | /admin | Staff only (SUPER_ADMIN, ADMIN, ORGANIZER) |
| Hidden (404) | set in the CMS (Page visibility); on 4 Oct: /join, /insights, /aurix/schedule, /aurix/results, /judge, /learning | CMS → Website → Page visibility (`src/lib/visibility.ts` = defaults) |

**Event dates:** 27–28 Oct 2026 (CMS). All five competitions are open for registration (the Hackathon went live on 4 Oct 2026).

Operational docs: `/opt/krs/DEPLOYMENT.md` (deploy, rollback, backups). Repository: `github.com/Ashirogi-Muto/Krs` (private).
The Next.js app is in `website/`. Ignore `financial/` (a separate app, out of scope).

---

## 2. Tech stack and conventions

- **Next.js 16.3.6** App Router, React 19, TypeScript strict, Tailwind 3. **Payload CMS 3.90.2** embedded
  (`src/payload.config.ts`), PostgreSQL 16 via `@payloadcms/db-postgres`.
- **Build output:** `output: 'standalone'`, Docker runtime `node:22-alpine`. Anything you read from disk at runtime must use
  `path.resolve(process.cwd(), ...)` (cwd is `/app`); relative paths resolve differently in standalone builds.
- **Path aliases:** `@/*` → `src/*`, `@payload-config` → `src/payload.config.ts`.
- **Route groups** under `src/app/(frontend)/`: `(krs)`, `(aurix)`, `(auth)`, `(portal)`, `(judge)`. Payload admin + REST/GraphQL
  live in `src/app/(payload)/`. Custom API routes live in `src/app/api/...` (a specific route file wins over Payload's
  catch-all `/api/[...slug]`).
- **Styling:** reuse the existing AURIX tokens/classes (`bg-aurix-dark`, `aurix-card`, `border-aurix-border`,
  `text-aurix-orange`, `font-display`, `font-mono`) and `lucide-react` icons. Look at `src/components/aurix/RegistrationForm.tsx`
  and `StatusLookup.tsx` for the current form/card style. Mobile-first; every page must work at 360 px width.
- **Helpers you must use:**
  - `src/lib/data/events.ts` — `getAllEvents`, `getEventBySlug`, `getEventsBySeries` (reads CMS, strips details of
    coming-soon events, falls back to bundled data only if the DB is unreachable).
  - `src/lib/format.ts` — `formatDateRange`, `formatFee`, `formatINR`, `formatTeamSize`.
  - `src/lib/auth/session.ts` — `getSessionUser()`, `requireAuthUser(role?)`.
  - `src/lib/visibility.ts` / `src/lib/visibility-guard.ts` — `isRouteVisible`, `requireVisibleRoute`.
  - `src/lib/rateLimit.ts` — `rateLimit(key, limit, windowMs)`, `clientIp(req)` (nginx sets `X-Real-IP` to the real visitor IP).
  - `src/lib/logger` — `logger.info/warn/error/audit` (writes to `/app/logs`, never log passwords, tokens, ID images or full phone numbers).
- **Pages that read CMS data** use `export const revalidate = 60` (or `dynamic = 'force-dynamic'` for per-user pages —
  **all portal pages must be dynamic**, never statically cached).
- **Generated files:** after changing collections run `npx payload generate:types` (updates `src/payload-types.ts`) and commit it.
  Run `npx payload generate:importmap` if you add custom admin components.

---

## 3. Current data model (exact, as deployed)

### 3.1 `users` (auth collection — `src/payload/collections/Users.ts`)
Fields: `email` (Payload auth), `password` (hashed by Payload), `name` (required), `role` (select:
`SUPER_ADMIN | ADMIN | ORGANIZER | JUDGE | PARTICIPANT`, default `PARTICIPANT`), `institution`, `phone` (read: self or admin).
Auth options: lockout after 5 failed logins for 10 min, token 7 days, cookie `payload-token` (Secure, SameSite=Lax), `verify: false` (email confirmation for participants is the custom `emailVerified` field, see the status update at the top).
Access:
- `admin` (can open /admin): SUPER_ADMIN, ADMIN, ORGANIZER only. **Participants and judges cannot open /admin — keep it so.**
- `create`: admins only (via REST). Public sign-up goes through `/api/auth/register`, which uses `overrideAccess` and
  passes `context: { publicRegistration: true }` and forces `role: 'PARTICIPANT'`.
- `role` field create/update: admins only (prevents privilege escalation).
- Hook: the very first user created when the table is empty becomes SUPER_ADMIN (unless `publicRegistration`).
- read/update: admins all; others only themselves. delete: SUPER_ADMIN.
**Existing data:** 1 user (the owner's SUPER_ADMIN). Do not change it.

### 3.2 `events` (`Events.ts`)
title, shortName, slug (unique), edition, series (`AURIX|KRS`), eventType, status
(`DRAFT|ANNOUNCED|REGISTRATION_OPEN|REGISTRATION_CLOSED|IN_PROGRESS|JUDGING|RESULTS_PENDING|RESULTS_PUBLISHED|ARCHIVED`),
shortDescription, description, startDate, endDate, registrationOpen, registrationClose, timezone, venue, location,
registrationFee, currency, minTeamSize, maxTeamSize, operatorCount, prizePool, specsSummary, paymentEventLabel,
comingSoon, comingSoonMessage, participantRequirements, registrationUrl, mediaGalleryUrl, specialNotice,
requiresPayment, requiresSubmission, requiresJudging, resultsPublished, featured,
arrays: tracks{number,name,mission,examples[item]}, rounds{number,name,description,startDate,endDate,evaluationFormat,submissionType},
judgingCriteria{name,description,maxScore,weightPercent}, rulesSections{title,rules[rule]}, schedule{timeLabel,title,description,location},
faqs{question,answer}.
Public read: everything except `DRAFT`. **Organizers edit events in the CMS — never overwrite event content from code**
(`SYNC_SEED_EVENTS` must stay `0`; do not change `src/payload/syncEvents.ts` behaviour).

### 3.3 `event-registrations` (`Registrations.ts`) — **the source of truth for registrations**
| Field | Meaning (do not change) |
|---|---|
| registrationCode | unique, e.g. `AX26-SOC-7KENPH` (`AX26-<HAC|SOC|RAC|EXP|IDE>-<6 chars A-Z/2-9>`) |
| event | relationship → events |
| teamName | |
| leaderName, leaderEmail (lower-case), leaderPhone | the team leader = member #1 |
| college | the leader's college (sent to Razorpay) |
| members[] | name, email?, phone?, college, idDocument → id-documents. **members[0] is the leader** |
| amountDue | fee (INR) at registration time |
| status | `PENDING | CONFIRMED | REJECTED | CANCELLED` |
| paymentStatus | `AWAITING_PAYMENT | PAID_VERIFIED | NOT_FOUND | REFUNDED` |
| idVerification | `PENDING | APPROVED | REJECTED` |
| paymentReference, verifiedAt, adminNotes, consent | organizer / reconciliation fields |

Access: read/update staff (SUPER_ADMIN, ADMIN, ORGANIZER); create: nobody via REST (only `/api/aurix/register` with
`overrideAccess`); delete: SUPER_ADMIN. **Participants must never be able to change status, paymentStatus,
idVerification, paymentReference, verifiedAt, adminNotes, amountDue, event or registrationCode.**
Payment reconciliation (daily Razorpay report → match on email + phone + event + amount) is being built separately by
the operator agent and will write `paymentStatus`, `paymentReference`, `verifiedAt`, `status`. Do not build payment logic.

### 3.4 `id-documents` (upload collection)
Student ID images/PDFs in the private volume (`/app/.private_uploads/id-documents`), staff-only read. Fields:
memberName, registrationCode. **Never expose these files or their URLs in the portal** (not even to the team itself)
unless the owner explicitly asks.

### 3.5 `short-links`
slug, destinationType (`EVENT|PATH|URL`), event, eventTarget (`DETAILS|REGISTER`), path, url, active, notes, clicks,
plus display-only virtual fields shortUrl/resolvesTo. Not related to the portal; don't change.

### 3.6 Legacy collections — currently unused by any page
`teams`, `team-members`, `registrations`, `submissions`, `evaluations`, `results` (in `Teams.ts`, `Submissions.ts`).
They were part of the original design; all writes are restricted to staff. They contain **no data**.
- You may **reuse** `submissions`, `evaluations`, `results` for the Hackathon phase (§6) if you re-point their
  relationships to `event-registrations` via a migration (team → registration). Explain the change in the handover.
- Do **not** use `teams`/`team-members`/`registrations` for new features (that would duplicate `event-registrations`).
  Leave them in place; removing them needs owner approval and a migration.

### 3.7 Content collections
projects, posts, resources, people, media — CMS content for the KRS site; out of scope.

---

## 4. Current authentication (how it really works)

- Login: `POST /api/auth/login` → `payload.login()` → sets cookie with `generatePayloadCookie` (from `payload/shared`).
  Register: `POST /api/auth/register` → creates PARTICIPANT with `overrideAccess` + `context.publicRegistration` → logs in.
  Logout: `POST /api/auth/logout` → expired cookie → 303 redirect (to `/login` if visible, else `/`).
  **All three return 404 while `/login` / `/register` are hidden** (see the `isRouteVisible` checks at the top of each route).
- Session: `getSessionUser()` in `src/lib/auth/session.ts` calls `await headers()` **first** (this marks the page dynamic —
  if Payload is called before `headers()`, Next tries to prerender at build time and the build fails), then
  `payload.auth({ headers })`.
- Payload validates the cookie only when the request's `Origin` is in the `csrf` list (`NEXT_PUBLIC_SITE_URL`,
  `http://127.0.0.1:3003`, `http://0.0.0.0:3003`) or for same-origin browser navigations. When testing with curl, send
  `-H 'Origin: https://kalamroboticssociety.com'`, and remember the cookie is `Secure` (curl won't send it over `http://`
  unless you pass it as a header).
- `src/lib/auth/jwt.ts` is **legacy**: only the unit tests import it. **Do not use it for authentication.**
- Payload initialises lazily on the first request that needs the database; migrations run at that moment in production.

---

## 5. What exists in the portal folder today (all of it is mock-up)

| File | Problem |
|---|---|
| `(portal)/aurix/portal/layout.tsx` | Real session check + redirect (fixed). Nav + logout are fine to keep. |
| `portal/page.tsx` | Hard-coded sample team "CyberKinetic Squad", fake deadlines ("Due 20 October 2026") |
| `portal/submissions/page.tsx` | Form "submits" with `setTimeout`, saves nothing, fake squad name |
| `portal/teams/page.tsx`, `events/page.tsx`, `announcements/page.tsx`, `results/page.tsx` | Static sample content |
| `(judge)/judge/page.tsx` | Role-gated (fixed) but shows a fake team and fake scores |
| `(auth)/login`, `(auth)/register` | UI is fine and wired to the real auth routes |

**Rewrite these pages against real data. Do not simply un-hide them.** Delete every sample team, date, score and announcement.

---

## 6. Scope

### Phase 1 — Participant portal MVP (target: before 20 Oct 2026)
1. **Accounts:** participants sign up at `/register` and log in at `/login` (existing routes/UI). Fields: name, email,
   password (≥ 8 chars), institution, phone.
2. **Claiming a registration** (written when there was no email verification; since 3 Oct accounts must confirm their email first, which the claim route also checks):
   - Page `/aurix/portal/claim`: user enters **registration code + team-leader email**; server checks both match an
     `event-registrations` row (same rule as `/api/aurix/status`), and that the logged-in user's email equals that
     `leaderEmail` **or** one of `members[].email`. Only then link the account.
   - Store the link on the registration: add field `participants` (relationship → users, hasMany, staff-editable,
     read-only in admin for others) via migration. A registration can be claimed by several members; a user can have
     several registrations (different events).
   - Rate-limit claims (e.g. 10/hour/IP and 10/hour/user). Log claims with `logger.audit`.
3. **Dashboard `/aurix/portal`:** list the user's claimed registrations: event (title, dates, venue from CMS), team name,
   member names + colleges, amount due, and the three statuses with the same wording/colours as `StatusLookup.tsx`.
   Show next steps: if `AWAITING_PAYMENT` → link to pay (rebuild the Razorpay URL with `buildRazorpayPaymentUrl` from
   `src/lib/payments/razorpayPage.ts`, using the registration's leader details and the event's `paymentEventLabel`/fee).
   Never show leader phone/emails of other members, ID files, admin notes or payment references.
4. **Event info `/aurix/portal/events`:** for each claimed event: rules summary link, schedule (CMS `schedule` array),
   reporting info (CMS `participantRequirements`, `specialNotice`). No hard-coded text.
5. **Announcements `/aurix/portal/announcements`:** new CMS collection `announcements`:
   title, body (textarea or rich text), audience (`ALL` or relationship → events, hasMany), publishedAt (date),
   published (checkbox), pinned (checkbox). Access: create/update/delete staff; read: authenticated participants see
   only `published` ones whose audience is ALL or includes one of their claimed events (enforce in the access function
   or in a server-side query — not in the UI).
6. **Profile `/aurix/portal/profile`:** edit own name, phone, institution; change password (current password required —
   use Payload's auth operations). Users cannot change their email or role.
7. **Password reset:** *(done 3 Oct)* by email at `/forgot-password` (60-minute single-use link); admins can also send one from Admin tools → Participants.
8. **Remove fake pages:** `results` page shows a real empty state until event `resultsPublished` is true (Phase 2).

### Phase 2 — Hackathon (only after the owner confirms Hackathon details and storage provider)
- Team management for Hackathon registrations (members claim, leader sees roster), submission of PPT/PPTX + project fields
  + AI-use disclosure (existing `submissions` fields), deadlines enforced server-side from CMS `rounds`.
- File upload: presigned direct-to-bucket uploads (R2/B2), server validates type (PPT/PPTX/PDF) and size (owner to decide,
  Cloudflare limits proxied request bodies to 100 MB — direct-to-bucket avoids it), object keys never guessable, downloads via
  short-lived signed URLs for staff/judges only.
- Judge portal `/judge`: JUDGE role sees only assigned submissions, scores against CMS `judgingCriteria`
  (`evaluations`), cannot see other judges' private feedback; results published by admins only.

### Explicitly out of scope
Payment processing/reconciliation, sending emails, changing the registration form, the KRS (non-AURIX) site, the
`financial/` app, infrastructure/deployment.

---

## 7. Security requirements (checklist — all mandatory)

- [ ] Every `/aurix/portal/*` page: `export const dynamic = 'force-dynamic'`, `requireVisibleRoute('/aurix/portal')`,
      `getSessionUser()` → redirect to `/login` if null. Role check where relevant.
- [ ] Every new API route: authenticate with `payload.auth({ headers })` (or `getSessionUser`) and authorise ownership
      on the server for every record it reads or writes.
- [ ] Any `overrideAccess: true` call must be preceded by an explicit, server-side ownership/role check in the same function.
      Prefer `overrideAccess: false` with a `user` and proper collection access functions.
- [ ] Validate all input with `zod` (lengths, formats, enums). Reject unknown fields — never spread request bodies into
      `payload.create/update`.
- [ ] Field-level access on new fields so participants cannot write staff fields (pattern: see `role` in `Users.ts`).
- [ ] Rate-limit login/claim/profile/password endpoints (Payload already locks accounts after 5 failed logins).
- [ ] No sensitive data in responses or logs: passwords, tokens, ID documents, other members' phone/email, admin notes.
- [ ] Portal pages `noindex` (`constructMetadata({ ..., noIndex: true })`) and not in the sitemap.
- [ ] No `dangerouslySetInnerHTML` with CMS/user content unless sanitised.
- [ ] Errors shown to users are generic; details go to `logger.error`.
- [ ] Uploads (Phase 2): validate magic bytes, size, extension; private bucket; signed URLs with short expiry.

---

## 8. Data model changes you will need (Phase 1)

1. `event-registrations.participants` — relationship → `users`, `hasMany: true`; field access: create/update staff only
   (claims are written server-side with `overrideAccess` after the checks in §6.2); admin description "Accounts that
   claimed this registration".
2. New collection `announcements` as in §6.5, admin group "AURIX Registrations".
3. Optionally `users.lastLoginAt` (date, read-only) — not required.
Generate **one migration per logical change**, review the SQL, and commit it with `src/migrations/index.ts` and
`src/payload-types.ts`.

---

## 9. How to run locally (on your machine, not the VM)

```bash
cd website
npm ci
# throwaway Postgres
docker run -d --name portal-db -e POSTGRES_USER=dev -e POSTGRES_PASSWORD=dev -e POSTGRES_DB=dev -p 127.0.0.1:55432:5432 postgres:16-alpine
export DATABASE_URL=postgresql://dev:dev@127.0.0.1:55432/dev PAYLOAD_SECRET=$(openssl rand -hex 24) NEXT_PUBLIC_SITE_URL=http://localhost:3003
NODE_ENV=production npx payload migrate        # apply committed migrations (do NOT use dev push on shared DBs)
SYNC_SEED_EVENTS=1 npm run build && SYNC_SEED_EVENTS=1 npm run start   # loads bundled events into YOUR local DB only
```
Create the first admin at http://localhost:3003/admin (first user becomes SUPER_ADMIN). For participant tests, enable
the portal locally by temporarily removing the hidden entries in `visibility.ts` — **do not commit that change**.
`npm run dev` is fine for UI work **only against your throwaway DB** (dev mode pushes schema changes directly).

---

## 10. Migrations — exact procedure

1. Change the collection config.
2. Against a **fresh throwaway** Postgres: `NODE_ENV=production npx payload migrate` (brings it to the current schema),
   then `npx payload migrate:create <short_name>`.
3. Open the generated `src/migrations/<timestamp>_<name>.ts` and review every statement:
   - New `NOT NULL` column on a table that may have rows → rewrite as: add nullable → `UPDATE` backfill → `SET NOT NULL`
     (see `20261002_030724_shortlinks_member_college_specs.ts` for the pattern).
   - Seed/data rows → `INSERT ... ON CONFLICT ("slug") DO NOTHING` (idempotent).
   - Any `DROP`/`RENAME` → stop and ask the owner.
4. Re-run `npx payload migrate` on a fresh DB to prove the whole chain applies from scratch.
5. Commit the `.ts` + `.json` migration files, `index.ts`, `payload-types.ts`.
Production applies pending migrations automatically on first request (`prodMigrations`). The operator tests each
migration against a copy of the production database before deploying.
**Never** run `payload` CLI or `npm run dev` with a `DATABASE_URL` that points at production or staging.

---

## 11. Testing and acceptance

Run before every handover: `npx tsc --noEmit` (0 errors), `npm run build` (succeeds; "cannot connect to Postgres" logs
during build are expected — pages fall back), then manual tests against your local DB:

**Phase 1 acceptance tests (all must pass):**
1. Anonymous user → `/aurix/portal` redirects to `/login` (with the portal un-hidden locally).
2. Sign-up creates role PARTICIPANT even if the request body includes `role: "SUPER_ADMIN"`.
3. Participant cannot open `/admin` (redirected to `/admin/unauthorized`) and gets 403 from `/api/event-registrations`.
4. Claim with wrong code, wrong email, or an email that isn't the leader/member → generic failure; no data leaked.
5. Claim with correct code + matching email → registration appears on the dashboard with correct statuses.
6. User A cannot see or claim User B's registration by changing ids in requests (test every API with another user's ids).
7. Participant PATCH attempts on `status`, `paymentStatus`, `idVerification`, `amountDue`, `participants` → rejected/ignored.
8. Announcements: unpublished hidden; event-targeted ones visible only to participants of that event.
9. Profile update cannot change email or role.
10. With the portal hidden (default branch state): every portal route and `/api/auth/*` return 404.
11. All pages usable at 360 px wide; no console errors; no hard-coded dates/fees (grep your diff for `Oct`, `₹`, `2026`).
12. `grep -rn "CyberKinetic\|setTimeout(() =>" src/app/(frontend)/(portal)` returns nothing.

---

## 12. Decisions only the owner can make (ask, don't assume)

- Object storage provider for submissions (Cloudflare R2 vs Backblaze B2) and file size limit. Do not assume pricing or
  free tiers.
- ~~Email provider~~ — decided and live (see the status update at the top).
- ~~Whether every team member gets an account~~ — decided: only the team leader.
- ~~Hackathon details~~ — decided and live on 4 Oct (see the status update at the top); the "50 shortlisted teams" claim was removed.

---

## 13. Mistakes already made on this project — do not repeat

1. **Fake auth:** `/api/auth/login` once issued an ADMIN session to any email containing "admin" with no password check.
2. **Mock pages presented as real:** portal/judge/join/contact forms "submitted" with `setTimeout` and saved nothing.
3. **Hard-coded facts:** "29–30 Oct", old fees and old robot sizes were typed into components and went live after the
   CMS had the correct values. Always read from the CMS.
4. **Dev-mode schema push on a shared DB:** left a `dev` marker in `payload_migrations` that made production migrations
   prompt interactively and would have crash-looped the app.
5. **Build-time DB access:** calling Payload before `headers()` in a server component made Next prerender it and fail the build.
6. **Secrets in files:** an admin password was hard-coded in `seed.ts`; never put credentials in code — use env vars.
7. **Disk exhaustion:** Docker build cache reached 12.7 GB on a 29 GB disk. Do not build on the VM.
8. **Relative paths in standalone builds** (`staticDir: 'public/uploads'`) resolve differently — use `process.cwd()`.
9. **Testing with curl** without `Origin` header or over `http://` with `Secure` cookies gives false "logged out" results.

---

## 14. Handover checklist (what to send the operator)

- Branch name and the list of commits.
- Summary of every new/changed collection field and each migration file name with its SQL summary.
- Any new environment variables (names only) and why.
- Results of the §11 acceptance tests (pass/fail per item).
- Screenshots or a short description of each new page.
- Anything you could not finish, and any assumption you had to make.
The operator will review the diff, test migrations against a copy of production, deploy with a backup and rollback ready,
and only then (with the owner's approval) remove the portal entries from `visibility.ts`.
