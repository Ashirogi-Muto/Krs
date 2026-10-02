import { postgresAdapter } from '@payloadcms/db-postgres'
import { lexicalEditor } from '@payloadcms/richtext-lexical'
import path from 'node:path'
import { buildConfig } from 'payload'
import { fileURLToPath } from 'node:url'

import { Users } from './payload/collections/Users'
import { Events } from './payload/collections/Events'
import { Teams, TeamMembers, Registrations } from './payload/collections/Teams'
import { Submissions, Evaluations, Results } from './payload/collections/Submissions'
import { Projects, Posts, Resources, People, Media } from './payload/collections/Content'
import { EventRegistrations, IdDocuments } from './payload/collections/Registrations'
import { ShortLinks } from './payload/collections/ShortLinks'
import { hiddenUnlessManager } from './payload/access/roles'
import type { CollectionConfig } from 'payload'
import { migrations } from './migrations'
import { syncSeedEvents } from './payload/syncEvents'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

const TEAM_HIDDEN = new Set(['events', 'teams', 'team-members', 'registrations', 'submissions', 'evaluations', 'results', 'projects', 'posts', 'resources', 'people', 'media', 'short-links'])
const hideFromTeams = (collections: CollectionConfig[]): CollectionConfig[] =>
  collections.map((c) =>
    TEAM_HIDDEN.has(c.slug) && c.admin?.hidden === undefined ? { ...c, admin: { ...c.admin, hidden: hiddenUnlessManager } } : c
  )

export default buildConfig({
  admin: {
    user: Users.slug,
    components: {
      // Role-specific metrics for each team (organizers, finance, ID verification, coordinators)
      beforeDashboard: ['@/payload/components/RoleDashboard'],
    },
  },
  cors: [process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3003'],
  csrf: [
    process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3003',
    'http://127.0.0.1:3003',
    'http://0.0.0.0:3003',
  ],
  // Team accounts (finance, verification, coordinators) only see what their job needs
  collections: hideFromTeams([
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
    EventRegistrations,
    IdDocuments,
    ShortLinks,
  ]),
  editor: lexicalEditor(),
  upload: {
    // Hard cap per uploaded file (ID cards are compressed in the browser first)
    limits: { fileSize: 2 * 1024 * 1024 },
  },
  onInit: async (payload) => {
    // One-off: load bundled event content into the CMS (set SYNC_SEED_EVENTS=1 for one deploy only)
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
      connectionString:
        process.env.DATABASE_URL ||
        'postgresql://krs_admin:krs_secure_dev_pass_2026@127.0.0.1:5434/krs_db',
    },
  }),
})
