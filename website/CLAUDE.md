# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Canonical memory: AGENT.md

**`AGENT.md` is the canonical project memory and technical log.** Read it at the start of every session, and record decisions, what was tried/failed/worked, dated changes, and security-checklist progress there, not in this file. `SPEC.md` is the approved product/security specification and the source of truth for event facts. Both files are gitignored on purpose (local policy docs), so never delete them assuming they are generated.

## Commands

```bash
docker compose up -d          # Postgres 16 container `krs-website-postgres` on 127.0.0.1:5434
npm run dev                   # Next.js dev server (port 3000)
npm run build                 # production build (acceptance requires zero TS/build errors)
npm run lint                  # next lint
npm run generate:types        # Payload -> src/payload-types.ts
npx tsc --noEmit              # type-check only
```

No test runner is configured yet. SPEC requires automated tests before any security control is marked complete, so adding one is a prerequisite for closing checklist items in AGENT.md.

Port 5434 is deliberate: 5432 is host Postgres and 5433 is a production `sih-postgres`. Do not touch other host services (22, 80, 443, 3000, 3002, 5432, 5433, 9180).

## Architecture

A modular monolith: Next.js 16 App Router with Payload CMS 3 embedded (`src/payload.config.ts`, admin at `(payload)/admin`), TypeScript strict, Tailwind, and Postgres through `@payloadcms/db-postgres`. Path aliases: `@/*` → `src/*`, `@payload-config` → `src/payload.config.ts`.

Two branded products share one codebase and are split by route groups under `src/app/`:
- `(krs)`: public society site (home, projects, blogs, learning, team, and so on) with `components/krs/*` chrome.
- `(aurix)`: public competition site under `/aurix/*` with `components/aurix/*` chrome. Every competition page renders through the shared `components/aurix/EventPage.tsx`.
- `(portal)` (`/aurix/portal/*`) and `(judge)` (`/judge`): protected and `noindex`. Their layouts call `getSessionUser()` and redirect when it returns no user.
- `(auth)` pages plus `app/api/auth/{login,logout,register}` route handlers.

**Data layer.** Pages never import seed data directly. They call async accessors in `src/lib/data/events.ts` and `src/lib/data/content.ts`, which currently return static seeds (`seed-events.ts`, `seed-krs.ts`, typed by `types.ts`). The plan is to swap these accessors to Payload queries without changing the pages. Payload collections live in `src/payload/collections/`; several files export more than one collection (for example, `Teams.ts` exports Teams, TeamMembers and Registrations). SPEC §6 lists the full target collection set, and most of it isn't built yet.

**Generic Event Engine.** Every competition (Hackathon, Robo Soccer, Robo Race, Robo Expo, Robo Ideathon) is one `GenericEvent`/`events` record. A new edition or competition should need data changes only, never code changes. Keep `operatorCount` separate from `minTeamSize`/`maxTeamSize`. Robo Race has `operatorCount: 1` and team size `null`.

**Provider abstractions** in `src/lib/{email,payments,storage}/index.ts` are chosen by the `EMAIL_PROVIDER`/`PAYMENT_PROVIDER`/`STORAGE_PROVIDER` env vars. Mocks throw when `NODE_ENV=production`, and real providers throw when their credentials are missing (fail-closed). Storage defines the MIME whitelist and the 15 MB upload cap. Keep uploads off the 1 MB JSON body limit. `src/lib/logger` writes rotating files to `logs/`. `src/lib/seo/` provides `constructMetadata` and JSON-LD components (Organization, Event, BlogPosting, Breadcrumbs).

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
