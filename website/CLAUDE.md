# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Canonical memory: AGENT.md

**`AGENT.md` is the canonical project memory and technical log.** Read it at the start of every session, and record decisions, what was tried/failed/worked, dated changes, and security-checklist progress there, not in this file. `SPEC.md` is the approved product/security specification and the source of truth for event facts. Both files are gitignored on purpose (local policy docs), so never delete them assuming they are generated.

## Commands

```bash
npm test                      # unit tests (node:test via tsx, 176 tests); run before every commit
npx tsc --noEmit -p .         # type-check (run before every commit)
npm run build                 # production build (CI does this; never on the server)
npm run generate:types        # Payload -> src/payload-types.ts (after schema changes)
npx payload generate:importmap  # after adding/removing admin components
# Local dev needs a throwaway Postgres (never prod): see docs/HANDOFF.md §3 (krs-dev-db on 127.0.0.1:5499, DB krs_dev;
# generate/test migrations only on krs_migtest; a DB used by `next dev` is marked "dev" and cannot run `payload migrate`).
```

There is no ESLint config in this repo (`npm run lint` does not work). Production deploys go only through CI image + `sudo krs-pull-deploy --finance skip` (see docs/HANDOFF.md §3 and docs/NEW-SERVER.md); take `sudo krs-db-backup` first even though the deploy script also backs up.

Host ports: this is a shared server (see ~/.gemini/rules/live-state.generated.md). Production web listens on 3003, local dev on 3099, Postgres for dev on 5499. Do not touch other host services or port 22.

## Architecture

A modular monolith: Next.js 16 App Router with Payload CMS 3 embedded (`src/payload.config.ts`, admin at `(payload)/admin`), TypeScript strict, Tailwind, and Postgres through `@payloadcms/db-postgres`. Path aliases: `@/*` → `src/*`, `@payload-config` → `src/payload.config.ts`.

Two branded products share one codebase and are split by route groups under `src/app/`:
- `(krs)`: public society site (home, projects, blogs, learning, team, and so on) with `components/krs/*` chrome.
- `(aurix)`: public competition site under `/aurix/*` with `components/aurix/*` chrome. Every competition page renders through the shared `components/aurix/EventPage.tsx`.
- `(portal)` (`/aurix/portal/*`) and `(judge)` (`/judge`): protected and `noindex`. Their layouts call `getSessionUser()` and redirect when it returns no user.
- `(auth)` pages (login, register, forgot/reset password, verify email) plus `app/api/auth/*` route handlers. Participant accounts need email confirmation (`lib/auth/participant.ts`).
- CMS-managed pages: every public page except the portal/staff tools comes from Website → Pages (blocks) or a CMS-driven component; hide/show pages in Website → Page visibility (`lib/visibility.ts`). Wording of forms and the portal: `lib/form-texts-defaults.ts`, `lib/portal-texts-defaults.ts`; staff tools and custom admin screens: `lib/staff-texts-defaults.ts` (CMS fields start with the built-in text; cleared = built-in text). `tests/cms-coverage.test.ts` fails on new hard-coded visible text.
- Live preview (`docs/LIVE_PREVIEW_PLAN.md`, AGENT.md §15): the CMS panel loads `/api/preview?c=&id=` / `?g=`, which checks the Payload session + editor role and turns on Next draft mode. In server code use `isPreview()` / `getPreviewUser()` from `lib/preview.ts` (draft mode AND an editor session; never trust the draft cookie alone). Pages have drafts: public page queries must filter `_status = 'published'` as well as `published = true`. Never give Events drafts (registration reads them). Field ↔ preview mapping: preview-only `data-cms-*` attributes from `lib/cms-attrs.ts` (`NO_CMS` renders nothing for visitors); every page section takes `cms = NO_CMS` and spreads `{...cms('field')}` on the element showing a field. The recipe for a new section type is in AGENT.md §15.

**Access control (8 Oct 2026, AGENT.md §20).** Team members' rights come from CMS → Accounts → Access roles. Every rule goes through `src/payload/access/permissions.ts` (`can`, `canFor`, `accessFor`, `eventScope`…) and the builders in `roles.ts`; never check account types or role names directly except `isAdmin`/`isSuperAdmin` for owner/admin-only actions. A new permission = a catalogue entry + the rule that checks it (+ a migration for the enum); `tests/rbac.test.ts` and `tests/access-roles.test.ts` fail when a collection or key is unaccounted for.

**Data layer.** Pages call async accessors in `src/lib/data/events.ts` and `src/lib/data/content.ts`, which read the CMS (Payload collections in `src/payload/collections/`, globals in `src/payload/globals/`) and fall back to the bundled seeds (`seed-events.ts`, `seed-krs.ts`) only when the database is unreachable (e.g. `next build`). Seeders (`syncSeedEvents`, `initPages`, `initNavigation`…) only create missing records, never overwrite live edits. The old empty collections (`teams`, `team-members`, `registrations`, `submissions`, `evaluations`, `results`) are hidden in the CMS and kept for Hackathon phase 2; live registrations are `event-registrations`.

**Generic Event Engine.** Every competition (Hackathon, Robo Soccer, Robo Race, Robo Expo, Robo Ideathon) is one `GenericEvent`/`events` record. A new edition or competition should need data changes only, never code changes. Keep `operatorCount` separate from `minTeamSize`/`maxTeamSize`. Robo Race has `operatorCount: 1` and team size `null`.

**Provider abstractions** in `src/lib/{email,payments}/index.ts`: email is SMTP from `MAIL_*` (queued in the Email outbox), payments are chosen by `PAYMENT_PROVIDER` (mocks throw when `NODE_ENV=production`; fail-closed). Uploads go through Payload upload collections (student IDs in `id-documents`, private volume; CMS images in `media`; both get a real-type check, `payload/hooks/realFileType.ts`), 2 MB per file (`payload.config.ts`). Round submissions are the exception: the browser uploads straight to a private Cloudflare R2 bucket through a signed link (`lib/r2.ts`, `lib/submissions.ts`, 15 MB, AGENT.md §18); the unused `lib/storage` and custom-JWT modules were deleted (7 Oct 2026). `src/lib/logger` writes rotating files to `logs/`. `src/lib/seo/` provides `constructMetadata` and JSON-LD components (Organization, Event, BlogPosting, Breadcrumbs).

## Rules that must hold (from SPEC.md)

- **Zero fabrication.** Event facts, fees, team sizes, prizes and results come only from SPEC §3 and official sources. If a value is unknown, leave it `null`/unset. Never infer it. No fake stats, testimonials or results.
- **Server-authoritative.** Never trust the client for roles, payment status, team size, deadlines or scores. A mock payment must never produce a production `CONFIRMED` registration.
- **Security lifecycle:** Plan → Implement → Test → Verify → Complete. Don't call a control "implemented" until tests verify it. Update the checklist in AGENT.md.
- `robots.txt` only controls indexing. Private routes need server-side authN/authZ.
- **Auth (fixed, verified 2026-10-03):** `src/lib/auth/session.ts` and every `/api/admin/*` route use Payload's verified auth (`payload.auth({ headers })`) plus a role check; `/api/auth/login` uses `payload.login` (password hash, lockout). Keep it that way: never decode the `payload-token` cookie yourself.

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
