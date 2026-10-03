import { postgresAdapter } from '@payloadcms/db-postgres'
import { lexicalEditor } from '@payloadcms/richtext-lexical'
import path from 'node:path'
import { buildConfig } from 'payload'
import { fileURLToPath } from 'node:url'

import { Users } from './payload/collections/Users'
import { Events } from './payload/collections/Events'
import { Teams, TeamMembers, Registrations } from './payload/collections/Teams'
import { Submissions, Evaluations, Results } from './payload/collections/Submissions'
import { Projects, Posts, Resources, People, Media, GalleryAlbums } from './payload/collections/Content'
import { EventRegistrations, IdDocuments } from './payload/collections/Registrations'
import { ShortLinks } from './payload/collections/ShortLinks'
import { AurixSchedule } from './payload/globals/AurixSchedule'
import { SiteSettings } from './payload/globals/SiteSettings'
import { LegalPages } from './payload/globals/LegalPages'
import { PageTexts } from './payload/globals/PageTexts'
import { Navigation } from './payload/globals/Navigation'
import { EventPageLabels } from './payload/globals/EventPageLabels'
import { FormTexts } from './payload/globals/FormTexts'
import { Pages } from './payload/collections/Pages'
import { FormSubmissions } from './payload/collections/FormSubmissions'
import { initPages } from './payload/initPages'
import { initSiteSettings, initLegalPages } from './payload/initSiteSettings'
import { EmailOutbox } from './payload/collections/EmailOutbox'
import { Announcements } from './payload/collections/Announcements'
import { startEmailWorker } from './lib/email/outbox'
import { startUnverifiedCleanup } from './lib/auth/participant'
import { importSeedContent } from './payload/importSeedContent'
import { hiddenUnlessManager } from './payload/access/roles'
import type { CollectionConfig } from 'payload'
import { migrations } from './migrations'
import { syncSeedEvents } from './payload/syncEvents'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

// Participant-portal and judging collections (not in use yet): registration managers only.
// Every other collection sets its own `admin.hidden` from the roles in access/roles.ts.
const TEAM_HIDDEN = new Set(['teams', 'team-members', 'registrations', 'submissions', 'evaluations', 'results'])
const hideFromTeams = (collections: CollectionConfig[]): CollectionConfig[] =>
  collections.map((c) =>
    TEAM_HIDDEN.has(c.slug) && c.admin?.hidden === undefined ? { ...c, admin: { ...c.admin, hidden: hiddenUnlessManager } } : c
  )

if (
  process.env.NODE_ENV === 'production' &&
  !process.env.PAYLOAD_SECRET &&
  process.env.NEXT_PHASE !== 'phase-production-build'
) {
  throw new Error('FATAL: PAYLOAD_SECRET environment variable is missing in production environment.')
}
if (
  process.env.NODE_ENV === 'production' &&
  !process.env.DATABASE_URL &&
  process.env.NEXT_PHASE !== 'phase-production-build'
) {
  throw new Error('FATAL: DATABASE_URL environment variable is missing in production environment.')
}

export default buildConfig({
  admin: {
    user: Users.slug,
    meta: {
      titleSuffix: ' — KRS CMS',
      icons: [{ rel: 'icon', type: 'image/png', url: '/images/krs-mark-light.png' }],
    },
    components: {
      // Role-specific dashboard panels (see RoleDashboard.tsx)
      beforeDashboard: ['@/payload/components/RoleDashboard'],
    },
  },
  cors: [process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3003'],
  csrf: [
    process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3003',
    'http://127.0.0.1:3003',
    'http://0.0.0.0:3003',
  ],
  // Team accounts only see what their roles need (src/payload/access/roles.ts)
  collections: hideFromTeams([
    Pages,
    FormSubmissions,
    Users,
    Events,
    Teams,
    TeamMembers,
    Registrations,
    Submissions,
    Evaluations,
    Results,
    Projects,
    Posts,
    Resources,
    People,
    Media,
    GalleryAlbums,
    EventRegistrations,
    IdDocuments,
    EmailOutbox,
    Announcements,
    ShortLinks,
  ]),
  globals: [SiteSettings, Navigation, EventPageLabels, FormTexts, PageTexts, LegalPages, AurixSchedule],
  editor: lexicalEditor(),
  upload: {
    // Hard cap per uploaded file (ID cards are compressed in the browser first)
    limits: { fileSize: 2 * 1024 * 1024 },
  },
  onInit: async (payload) => {
    // Background sender for the Email outbox (registration confirmations)
    startEmailWorker(payload)
    // Delete participant accounts not confirmed within 7 days (participants are told on sign-up and in the email)
    startUnverifiedCleanup(payload)
    // One-time: KRS content that used to be in code goes into empty CMS collections (never overwrites)
    if (process.env.NEXT_PHASE !== 'phase-production-build') await importSeedContent(payload)
    if (process.env.NEXT_PHASE !== 'phase-production-build') await initSiteSettings(payload)
    if (process.env.NEXT_PHASE !== 'phase-production-build') await initLegalPages(payload)
    // Built-in pages (home, …) go into the CMS once, with today's content (never overwrites)
    if (process.env.NEXT_PHASE !== 'phase-production-build') await initPages(payload)
    // Create bundled events missing from the CMS (never overwrites existing events; SYNC_SEED_EVENTS=1)
    if (process.env.SYNC_SEED_EVENTS === '1') {
      await syncSeedEvents(payload)
    }
  },
  secret: process.env.PAYLOAD_SECRET || 'fallback-secret-for-type-generation-only',
  typescript: {
    outputFile: path.resolve(dirname, 'payload-types.ts'),
  },
  db: postgresAdapter({
    // Applies committed migrations on startup when NODE_ENV=production (dev uses schema push)
    prodMigrations: migrations,
    pool: {
      // No credentials in code: production must provide DATABASE_URL (checked above); the placeholder only
      // lets `next build` and type generation load the config without a database
      connectionString: process.env.DATABASE_URL || 'postgresql://localhost:5432/database-url-not-set',
    },
  }),
})
