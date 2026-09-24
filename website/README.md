# Kalam Robotics Society (KRS) & AURIX Digital Platform

A production-grade, extensible digital platform and competition engine engineered for **Kalam Robotics Society (KRS)** at **IILM University, Greater Noida**.

The platform is architected as a modular monolith housing two distinct experiences powered by a unified data and identity core:
1. **KRS Public Society Portal** — The permanent public home for Kalam Robotics Society, showcasing research initiatives, hardware projects, member directories, learning resources, and technical blog posts.
2. **AURIX Competition Engine** — The high-octane competition and hackathon platform powering national robotics challenges (Robotics & AI Hackathon, Robo Soccer, Robo Race, Robo Expo, and Robo Ideathon), team registrations, project submissions with AI disclosure, automated judging rubrics, and live leaderboards.

---

## 🏛️ Architectural Overview

```
                                  ┌──────────────────────────────┐
                                  │      Client Applications     │
                                  ├──────────────┬───────────────┤
                                  │  KRS Portal  │ AURIX Engine  │
                                  │   (Public)   │(Public/Portal)│
                                  └──────┬───────┴───────┬───────┘
                                         │               │
                                         ▼               ▼
┌────────────────────────────────────────────────────────────────────────┐
│                   Next.js 16 Active LTS App Router                     │
├────────────────────────────────────────────────────────────────────────┤
│ • Edge/SSR Route Groups: (krs), (aurix), (auth), (portal), (judge)    │
│ • Identity & RBAC Session Guard (Secure HttpOnly JWT / Cookie Claims)  │
│ • Abstracted Subsystems: Logger, Payments, Email, Storage, SEO Graph   │
└──────────────────────────────────┬─────────────────────────────────────┘
                                   │
                                   ▼
┌────────────────────────────────────────────────────────────────────────┐
│                     Payload CMS 3.90.2 (Embedded)                      │
├────────────────────────────────────────────────────────────────────────┤
│ • Collections: Users, Events, Teams, Registrations, Submissions,       │
│                Evaluations, Results, Projects, Posts, Resources, Media │
│ • Native Database Adapter: PostgreSQL 16 (Port 5434)                   │
└────────────────────────────────────────────────────────────────────────┘
```

### Key Technical Stack
- **Framework**: Next.js 16 Active LTS (App Router, Server Components)
- **CMS**: Payload CMS 3.90.2 (Headless & Embedded Admin at `/admin`)
- **Database**: PostgreSQL 16 via `@payloadcms/db-postgres`
- **Styling**: Tailwind CSS & Lucide Icons (Curated dual design tokens)
- **Language**: TypeScript 5.7+ (Strict Mode)
- **Testing**: Node Test Runner via `tsx --test`
- **Logging**: Rotating file system logger (10MB max size, 5 files max per process)

---

## 🔒 Security & Core Invariants

1. **Single Identity Model**: `User` is the canonical authentication entity across both KRS and AURIX. Profile roles (`PARTICIPANT`, `JUDGE`, `ORGANIZER`, `ADMIN`, `SUPER_ADMIN`) map directly without credential duplication.
2. **Fail-Closed Provider Design**: In `NODE_ENV=production`, mock payment and mock email providers fail closed and throw fatal errors. Mock payments can never create `CONFIRMED` registrations in production.
3. **Robo Race Modeling**: Modeled with `operatorCount: 1` explicitly separated from `minTeamSize`/`maxTeamSize` (which remain `null` until officially confirmed by society leadership).
4. **Zero Content Fabrication**: Unconfirmed brochure fields (such as Hackathon entry fees) remain `null` in code and CMS rather than inventing speculative numbers.
5. **Structured AI Disclosure**: Competition submissions require structured declaration of Generative AI assistance (`usedAI`, `aiToolsUsed`, `aiUsageDescription`).
6. **Host Port Protection**: Bound to dedicated Docker port `5434:5432` to avoid collisions with host production services (`22`, `80`, `443`, `3000`, `3002`, `5432`, `5433`).

---

## 🚀 Quick Start & Local Setup

### 1. Prerequisites
- **Node.js**: v22.x LTS (tested on v22.23.2)
- **Docker & Docker Compose**: For local PostgreSQL container

### 2. Database Initialization
Start the dedicated PostgreSQL 16 database:
```bash
docker compose up -d
```
Verify container health:
```bash
docker ps --filter name=krs-website-postgres
```

### 3. Environment Configuration
Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```
Default local variables:
```ini
NODE_ENV=development
PORT=3000
DATABASE_URL=postgresql://krs_admin:krs_secure_dev_pass_2026@127.0.0.1:5434/krs_db
PAYLOAD_SECRET=your_32_byte_secret_here
PAYMENT_PROVIDER=mock
EMAIL_PROVIDER=mock
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

### 4. Running the Platform
Install dependencies and generate types:
```bash
npm install
npm run generate:types
```

Run unit and invariant test suite:
```bash
npm test
```

Start the development server:
```bash
npm run dev
```
Access the application:
- **KRS Public Portal**: [http://localhost:3000](http://localhost:3000)
- **AURIX Competitions**: [http://localhost:3000/aurix](http://localhost:3000/aurix)
- **Participant Portal**: [http://localhost:3000/aurix/portal](http://localhost:3000/aurix/portal)
- **Judge Portal**: [http://localhost:3000/judge](http://localhost:3000/judge)
- **Payload Admin CMS**: [http://localhost:3000/admin](http://localhost:3000/admin)
- **Health Check**: [http://localhost:3000/api/health](http://localhost:3000/api/health)

---

## 📂 Project Directory Structure

```
├── docker-compose.yml           # Dedicated PostgreSQL 16 container (Port 5434)
├── logs/                        # Rotating log files (10MB max, 5 rotations)
│   ├── app.log
│   ├── audit.log
│   └── error.log
├── src/
│   ├── app/
│   │   ├── (aurix)/             # AURIX competition public routes
│   │   │   └── aurix/
│   │   │       ├── competitions/
│   │   │       ├── hackathon/
│   │   │       ├── robo-soccer/
│   │   │       ├── robo-race/
│   │   │       ├── robo-expo/
│   │   │       ├── robo-ideathon/
│   │   │       └── schedule, rules, faq, results...
│   │   ├── (auth)/              # Login and registration flows
│   │   ├── (judge)/             # Judge evaluation scoring portal
│   │   ├── (krs)/               # KRS public society pages
│   │   │   └── projects, learning, insights, gallery, team...
│   │   ├── (payload)/           # Payload CMS App Router integration
│   │   │   ├── admin/           # Embedded CMS Admin interface
│   │   │   └── api/             # REST & GraphQL endpoints
│   │   ├── (portal)/            # Participant self-service dashboard
│   │   ├── api/
│   │   │   ├── auth/            # Auth API routes
│   │   │   └── health/          # System health check
│   │   ├── robots.ts            # Dynamic SEO robots directive
│   │   └── sitemap.ts           # Dynamic XML sitemap generator
│   ├── components/
│   │   ├── aurix/               # AURIX cyberpunk UI design system
│   │   └── krs/                 # KRS aerospace technical UI system
│   ├── lib/
│   │   ├── auth/                # Session parsing & RBAC authorization
│   │   ├── data/                # Seed data & query services
│   │   ├── email/               # Abstracted fail-closed email service
│   │   ├── logger/              # 10MB rotating multi-stream logger
│   │   ├── payments/            # Fail-closed payment gateway adapter
│   │   ├── seo/                 # JSON-LD Schema.org generators
│   │   └── storage/             # File storage & MIME validation
│   ├── payload/
│   │   └── collections/         # Payload CMS schema definitions
│   └── payload.config.ts        # Payload configuration
└── tests/
    └── business-logic.test.ts   # Automated invariant test suite
```

---

## 🔄 Adding Future AURIX Editions (e.g., AURIX 2027)

The platform is designed so that future editions require **zero code refactoring**. All competition aspects are modeled in the database and manageable through the CMS:

1. **Create Edition in Events Collection**:
   - Navigate to `/admin/collections/events`.
   - Add new event with `edition: '2027'`, slug, tracks, registration window, and judging criteria.
2. **Define Judging Rubrics**:
   - Each event accepts customizable criteria with designated `maxScore` and `weightPercent` values.
3. **Configure Registration Parameters**:
   - Define `minTeamSize`, `maxTeamSize`, `operatorCount`, `registrationFee`, and required submission dossier fields.
4. **Publish Schedule & Rules**:
   - Populate `rulesSections` and `schedule` timeline steps in the CMS.
   - The frontend dynamically pulls and renders the new edition based on the active event slug and edition tag.

---

## 🛡️ Operations & Maintenance

### Log Rotation
All system logs are written to `/logs`:
- File size is capped at **10MB**.
- Up to **5 historical backup files** are retained per log category (`.1`, `.2`, etc.).
- Rotations are triggered automatically during append operations.

### Database Backups
To take an out-of-band snapshot of the local Postgres database:
```bash
docker exec -t krs-website-postgres pg_dump -U krs_admin krs_db > backups/krs_db_$(date +%F).sql
```
Restore from a snapshot:
```bash
cat backups/krs_db_2026-09-24.sql | docker exec -i krs-website-postgres psql -U krs_admin -d krs_db
```
