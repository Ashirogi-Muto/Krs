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
import { migrations } from './migrations'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

export default buildConfig({
  admin: {
    user: Users.slug,
  },
  cors: [process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3003'],
  csrf: [
    process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3003',
    'http://127.0.0.1:3003',
    'http://0.0.0.0:3003',
  ],
  collections: [
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
  ],
  editor: lexicalEditor(),
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
