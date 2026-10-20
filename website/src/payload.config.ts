import { postgresAdapter } from '@payloadcms/db-postgres'
import { startIdReuploadJob } from './lib/id-reupload-job'
import { startSubmissionSweepJob } from './lib/submission-sweep-job'
import { withDeleteAudit } from './payload/hooks/auditDelete'
import { RoundSubmissions } from './payload/collections/RoundSubmissions'
import { JudgingRounds, JudgeScores, JudgingDecisions } from './payload/collections/Judging'
import { JudgingTexts } from './payload/globals/JudgingTexts'
import { Tournaments } from './payload/collections/Tournaments'
import { TournamentTexts } from './payload/globals/TournamentTexts'
import { lexicalEditor } from '@payloadcms/richtext-lexical'
import path from 'node:path'
import { buildConfig } from 'payload'
import { fileURLToPath } from 'node:url'

import { Users } from './payload/collections/Users'
import { AccessRoles } from './payload/collections/AccessRoles'
import { Events } from './payload/collections/Events'
import { Teams, TeamMembers, Registrations } from './payload/collections/Teams'
import { Submissions, Evaluations, Results } from './payload/collections/Submissions'
import { Projects, Posts, Resources, People, Media, GalleryAlbums } from './payload/collections/Content'
import { EventRegistrations, IdDocuments } from './payload/collections/Registrations'
import { PaymentReports } from './payload/collections/PaymentReports'
import { ShortLinks } from './payload/collections/ShortLinks'
import { AurixSchedule } from './payload/globals/AurixSchedule'
import { CouponSettings } from './payload/globals/CouponSettings'
import { Coupons } from './payload/collections/Coupons'
import { StaffTexts } from './payload/globals/StaffTexts'
import { SiteSettings } from './payload/globals/SiteSettings'
import { LegalPages } from './payload/globals/LegalPages'
import { PageTexts } from './payload/globals/PageTexts'
import { Navigation } from './payload/globals/Navigation'
import { EventPageLabels } from './payload/globals/EventPageLabels'
import { FormTexts } from './payload/globals/FormTexts'
import { SchoolEntryTexts } from './payload/globals/SchoolEntryTexts'
import { PortalTexts } from './payload/globals/PortalTexts'
import { Pages } from './payload/collections/Pages'
import { FormSubmissions } from './payload/collections/FormSubmissions'
import { initPages } from './payload/initPages'
import { initSiteSettings, initLegalPages, initNavigation } from './payload/initSiteSettings'
import { EmailOutbox } from './payload/collections/EmailOutbox'
import { Announcements } from './payload/collections/Announcements'
import { startEmailWorker } from './lib/email/outbox'
import { startUnverifiedCleanup } from './lib/auth/participant'
import { importSeedContent } from './payload/importSeedContent'
import type { CollectionConfig } from 'payload'
import { migrations } from './migrations'
import { syncSeedEvents } from './payload/syncEvents'
import type { GlobalConfig, SanitizedConfig } from 'payload'
import { adminsOnly, canUseAdmin, superAdminOnly } from './payload/access/roles'
import { revalidateSite } from './lib/revalidate'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

// Old, empty and unused by the site (the live registrations are "Event registrations"): hidden from the sidebar for
// everyone (owner, 4 Oct 2026: fewer admin pages). Tables and data stay; they come back when the hackathon
// phase 2 (team management, submissions, judging) is built.
const LEGACY_HIDDEN = new Set(['teams', 'team-members', 'registrations', 'submissions', 'evaluations', 'results'])
// Sidebar groups: Accounts, AURIX, Content (Website = pages, menus, settings, texts: set on the globals/pages)
const GROUPS: Record<string, string> = {
  users: 'Accounts',
  events: 'AURIX',
  'event-registrations': 'AURIX',
  'id-documents': 'AURIX',
  announcements: 'AURIX',
  'email-outbox': 'AURIX',
  'form-submissions': 'AURIX',
  'short-links': 'AURIX',
  projects: 'Content',
  posts: 'Content',
  resources: 'Content',
  people: 'Content',
  'gallery-albums': 'Content',
  media: 'Content',
}
// Collections shown on the public site: a change clears the page cache so it is visible on the next visit
const PUBLIC_CONTENT = new Set(['pages', 'events', 'projects', 'posts', 'resources', 'people', 'media', 'gallery-albums', 'short-links', 'announcements'])
const withCacheRefresh = (collections: CollectionConfig[]): CollectionConfig[] =>
  collections.map((c) =>
    PUBLIC_CONTENT.has(c.slug)
      ? {
          ...c,
          hooks: {
            ...c.hooks,
            // Draft saves (Pages autosave every 2 s) change nothing visitors see: no cache refresh for them
            afterChange: [...(c.hooks?.afterChange || []), ({ doc }) => (doc?._status === 'draft' ? undefined : revalidateSite(c.slug))],
            afterDelete: [...(c.hooks?.afterDelete || []), () => revalidateSite(c.slug)],
          },
        }
      : c
  )
const globalsWithCacheRefresh = (globals: GlobalConfig[]): GlobalConfig[] =>
  globals.map((g) => ({ ...g, hooks: { ...g.hooks, afterChange: [...(g.hooks?.afterChange || []), () => revalidateSite(g.slug)] } }))
const hideFromTeams = (collections: CollectionConfig[]): CollectionConfig[] =>
  collections.map((c) => {
    const admin = { ...c.admin, ...(GROUPS[c.slug] ? { group: GROUPS[c.slug] } : {}) }
    // Legacy: admins only for every operation (RBAC audit, 8 Oct 2026: their old rules still let participants update
    // "their" teams and judges create evaluations); their own rules come back with phase 2
    if (LEGACY_HIDDEN.has(c.slug)) {
      admin.hidden = true
      return { ...c, admin, access: { ...c.access, read: adminsOnly, create: adminsOnly, update: adminsOnly, delete: superAdminOnly } }
    }
    return { ...c, admin }
  })

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

/**
 * Payload adds its own internal collections while building the config, with "any logged-in account" as their rule
 * (RBAC audit, 8 Oct 2026: a participant could create/remove the CMS's "being edited by" locks over REST). Edit locks are
 * a CMS feature: only accounts that may use the CMS. (payload-migrations has no REST endpoints; payload-preferences
 * and payload-kv already limit access to the owner / nobody.)
 */
const lockInternalCollections = (config: SanitizedConfig): SanitizedConfig => {
  const cmsOnly = ({ req: { user } }: { req: { user?: unknown } }) => canUseAdmin(user as any)
  const locks = config.collections.find((c) => c.slug === 'payload-locked-documents')
  if (locks) locks.access = { ...locks.access, read: cmsOnly, create: cmsOnly, update: cmsOnly, delete: cmsOnly }
  return config
}

export default buildConfig({
  admin: {
    user: Users.slug,
    meta: {
      titleSuffix: ' — KRS CMS',
      icons: [{ rel: 'icon', type: 'image/png', url: '/images/krs-mark-light.png' }],
    },
    // Live preview (docs/LIVE_PREVIEW_PLAN.md): device sizes in the preview panel; the URL is set per collection/global
    livePreview: {
      breakpoints: [
        { name: 'desktop', label: 'Desktop', width: 1280, height: 800 },
        { name: 'tablet', label: 'Tablet', width: 768, height: 1024 },
        { name: 'mobile', label: 'Mobile', width: 390, height: 844 },
      ],
    },
    components: {
      // Role-specific dashboard panels (see RoleDashboard.tsx)
      beforeDashboard: ['@/payload/components/RoleDashboard'],
      // Live preview: field focus ↔ preview highlight (docs/LIVE_PREVIEW_PLAN.md phases 2–3)
      providers: ['@/payload/components/CmsPreviewBridge'],
      // Sidebar group "Admin tools" (admins only) and its two screens; both re-check admin rights on the server
      beforeNavLinks: ['@/payload/components/AdminNavLinks'],
      views: {
        pageVisibility: { Component: '@/payload/components/PageVisibilityView', path: '/page-visibility', meta: { title: 'Page visibility' } },
        whereToEdit: { Component: '@/payload/components/WhereToEditView', path: '/where-to-edit', meta: { title: 'Where to edit' } },
        idReupload: { Component: '@/payload/components/IdReuploadView', path: '/id-reupload', meta: { title: 'ID re-upload' } },
        paymentMatching: { Component: '@/payload/components/PaymentMatchingView', path: '/payment-matching', meta: { title: 'Payment matching' } },
        participants: { Component: '@/payload/components/ParticipantsView', path: '/participants', meta: { title: 'Participants' } },
        teamAccounts: { Component: '@/payload/components/TeamAccountsView', path: '/team-accounts', meta: { title: 'Team accounts' } },
        accounts: { Component: '@/payload/components/AccountsView', path: '/accounts' }, // old address → Participants
      },
    },
  },
  cors: [process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3003'],
  csrf: [
    process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3003',
    'http://127.0.0.1:3003',
    'http://0.0.0.0:3003',
  ],
  // Team accounts only see what their roles need (src/payload/access/roles.ts)
  // Every collection: deletes go to the audit log (payload/hooks/auditDelete.ts)
  collections: withDeleteAudit(withCacheRefresh(hideFromTeams([
    RoundSubmissions,
    JudgingRounds,
    JudgeScores,
    JudgingDecisions,
    Tournaments,
    Pages,
    FormSubmissions,
    Users,
    AccessRoles,
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
    PaymentReports,
    Coupons,
    EmailOutbox,
    Announcements,
    ShortLinks,
  ]))),
  globals: [...globalsWithCacheRefresh([SiteSettings, Navigation, EventPageLabels, FormTexts, SchoolEntryTexts, PortalTexts, PageTexts, LegalPages, AurixSchedule]), StaffTexts, JudgingTexts, TournamentTexts, CouponSettings],
  // Nothing uses GraphQL (it only returned errors): one API surface less (security fix, 7 Oct 2026)
  graphQL: { disable: true },
  editor: lexicalEditor(),
  upload: {
    // Hard cap per uploaded file: 10 MB so editors can upload camera photos (owner, 13 Oct 2026; was 2 MB). Student IDs
    // stay at 2 MB (their own checks: lib/id-files.ts, IdDocuments hook) and Razorpay reports too (report-file.ts).
    limits: { fileSize: 10 * 1024 * 1024 },
  },
  onInit: async (payload) => {
    // Background sender for the Email outbox (registration confirmations)
    startEmailWorker(payload)
    // Delete participant accounts not confirmed within 7 days (participants are told on sign-up and in the email)
    startUnverifiedCleanup(payload)
    // Cancel registrations whose student ID is still rejected after the re-upload deadline (lib/id-reupload.ts)
    startIdReuploadJob(payload)
    // Delete submission files in R2 that no submission points to (closed page mid-save, two devices at once)
    startSubmissionSweepJob(payload)
    // One-time: KRS content that used to be in code goes into empty CMS collections (never overwrites)
    if (process.env.NEXT_PHASE !== 'phase-production-build') await importSeedContent(payload)
    if (process.env.NEXT_PHASE !== 'phase-production-build') await initSiteSettings(payload)
    if (process.env.NEXT_PHASE !== 'phase-production-build') await initLegalPages(payload)
    if (process.env.NEXT_PHASE !== 'phase-production-build') await initNavigation(payload)
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
}).then(lockInternalCollections)
