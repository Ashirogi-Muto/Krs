# Kalam Robotics Society (KRS) & AURIX website

The live site for **Kalam Robotics Society** (IILM University, Greater Noida) and its competition festival **AURIX**,
at <https://kalamroboticssociety.com>. One Next.js 16 app with Payload CMS 3 embedded and PostgreSQL 16.

| Part | Routes | What it does |
|---|---|---|
| KRS society site | `/`, `/projects`, `/blogs`, `/team`, `/gallery`, `/contact`… | Public pages, all edited in the CMS (Website → Pages, blocks) |
| AURIX competition site | `/aurix/*` | Hackathon, Robo Soccer, Robo Race, Robo Expo, Robo Ideathon: one `events` record each, rendered by `components/aurix/EventPage.tsx` |
| Registration and payment | `/aurix/register`, `/aurix/status`, `/aurix/update-id` | Login-gated team registration (leader's student ID required), Razorpay payment page, status lookup, ID re-upload for rejected IDs |
| Participant portal | `/aurix/portal/*` | Dashboard, claim a registration, round submissions (PPT/PPTX/PDF to Cloudflare R2). Hidden until the owner shows it |
| Staff tools | `/admin` (Payload) | CMS, registrations, payment matching, check-in, accounts, page visibility, ID re-upload, retention, submissions |

Not built yet: judge scoring portal, results, team management by participants (see `PORTAL_SPEC.md`).

## Documentation (read these, not this file, for details)

- `AGENT.md`: canonical project memory and technical log (local only, gitignored).
- `SPEC.md`: approved product and security spec and the source of truth for event facts (local only, gitignored).
- `CLAUDE.md`: commands, architecture and rules for coding agents.
- `../docs/HANDOFF.md`: current state, deploy procedure and what's left.
- `../docs/NEW-SERVER.md`: the server (shared Oracle host), pull-only deploys, backups and recovery.
- `../PORTAL_SPEC.md`: participant portal spec and status.

## Stack

- Next.js 16 (App Router, standalone output) with Payload CMS 3.90 (`src/payload.config.ts`, admin at `/admin`).
- PostgreSQL 16 via `@payloadcms/db-postgres`, with migrations in `src/migrations/` (additive only on the live site).
- TypeScript strict, Tailwind CSS.
- Email: SMTP through the shared mailserver, queued in an outbox (`src/lib/email`).
- Payments: Razorpay payment page plus staff verification (`src/lib/payments`).
- Files:
  - CMS images: `media`;
  - student IDs: `id-documents`, a private volume, 2 MB;
  - round submissions: private Cloudflare R2 bucket via signed links, 15 MB.
- Tests: `node:test` via `tsx` (`tests/`).
- Logs: rotating files in `logs/` (`app.log`, `audit.log`, `error.log`).

## Development

```bash
npm ci
npm test                 # unit tests; run before every commit
npx tsc --noEmit -p .    # type-check; run before every commit
npm run generate:types   # after schema changes
npx payload generate:importmap   # after adding/removing admin components
```

- **Never point a dev server at the live database.** Local development uses a throwaway Postgres (`krs-dev-db` on
  127.0.0.1:5499), described in `docs/HANDOFF.md` §3.
- **Settings:** the variable names are in `.env.example`.
- **Production builds** happen in CI (GitHub Actions builds an arm64 image) and never on the server.

## Deploying

- **Only through CI and the deploy script.** Push to `claude/deploy-ready`, wait for the "Build website image"
  workflow, then on the server run `sudo krs-db-backup` followed by `sudo krs-pull-deploy --finance skip`.
- **What the deploy script does:** it backs up again, pulls the image, runs pending migrations, health-checks, and
  rolls back on failure.
- **The full checklist** is in `docs/HANDOFF.md` §3.
- `docker-compose.yml` in this folder is the old single-VM setup. Production uses `/opt/krs/deploy/compose.yml` on the
  server.

## Rules that must hold

- **No made-up facts.** Event facts, fees, team sizes, prizes and results come only from official sources. If a value
  is unknown, leave it empty.
- **The server decides.** Never trust the browser for roles, payment status, team size, deadlines or file
  types and sizes.
- **Real authentication only.** Use Payload's own authentication (`payload.auth`, `payload.login`) and never decode
  tokens yourself.
- **Never lose live data.** Back up before every deploy, keep migrations additive, and keep seeders create-only.
