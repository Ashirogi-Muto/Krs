/**
 * Custom access roles (owner, 8 Oct 2026; docs/ACCESS_ROLES_PLAN.md).
 *
 * A team member's rights = the union of the access roles they belong to (CMS → Accounts → Access roles). A role is a
 * list of permission keys from the fixed CATALOGUE below plus limits: which events (registrations, submissions, check-in,
 * exports, events) and which documents (pages, posts, …) the keys apply to. Super Admin and Admin hold every key for
 * everything. Pure module (no Payload runtime): used by access functions, field rules, sidebar visibility, custom
 * screens, staff pages and /api/admin/* routes, and unit-tested. Unknown or missing = no access (fail closed).
 */

// ---------------------------------------------------------------------------------------------------------------
// Catalogue

/** What a key's limit is measured against: events (AURIX), documents of a collection, or nothing (global key). */
export type LimitKind = 'event' | 'doc' | 'none'

export type CatalogueItem = {
  key: string
  label: string
  /** CRUD column in the matrix (or an extra row) */
  kind: 'view' | 'create' | 'edit' | 'delete' | 'extra'
  limit: LimitKind
  /** For limit 'doc': the collection whose documents limit it */
  collection?: string
  help?: string
}
export type CatalogueSection = { id: string; label: string; group: 'AURIX' | 'Content' | 'Website settings' | 'Tools' | 'Dashboard' | 'Admin'; items: CatalogueItem[] }

const ev = (key: string, label: string, kind: CatalogueItem['kind'], help?: string): CatalogueItem => ({ key, label, kind, limit: 'event', help })
const doc = (collection: string, key: string, label: string, kind: CatalogueItem['kind'], help?: string): CatalogueItem => ({ key, label, kind, limit: 'doc', collection, help })
const plain = (key: string, label: string, kind: CatalogueItem['kind'], help?: string): CatalogueItem => ({ key, label, kind, limit: 'none', help })

/** Website content collections that can be limited to chosen documents. */
export const DOC_LIMIT_COLLECTIONS = ['pages', 'projects', 'posts', 'resources', 'people', 'gallery-albums', 'short-links', 'announcements'] as const
export type DocLimitCollection = (typeof DOC_LIMIT_COLLECTIONS)[number]

const content = (collection: DocLimitCollection, id: string, label: string, opts: { del?: boolean; versions?: boolean } = {}): CatalogueSection => ({
  id,
  label,
  group: 'Content',
  items: [
    doc(collection, `${id}.view`, 'View unpublished / drafts', 'view'),
    doc(collection, `${id}.create`, 'Create', 'create', 'Not possible when the role is limited to chosen documents of this page.'),
    doc(collection, `${id}.edit`, 'Edit & publish', 'edit'),
    doc(collection, `${id}.delete`, 'Delete', 'delete'),
    ...(opts.versions ? [doc(collection, `${id}.versions`, 'View history', 'extra')] : []),
  ],
})

export const CATALOGUE: CatalogueSection[] = [
  {
    id: 'registrations',
    label: 'Event registrations',
    group: 'AURIX',
    items: [
      ev('registrations.view', 'View registrations', 'view', 'Team, event, college, member names, statuses, check-in.'),
      ev('registrations.contacts', 'See contacts', 'extra', 'Leader and member email and phone.'),
      ev('registrations.leaderPhone', 'See the leader phone only', 'extra'),
      ev('registrations.ids', 'See student IDs', 'extra', 'ID card files, ID rejection reason, re-upload dates (also opens CMS → Student IDs).'),
      ev('registrations.money', 'See money', 'extra', 'Amount due, payment reference, verified date.'),
      ev('registrations.portalAccounts', 'See linked portal accounts', 'extra'),
      ev('registrations.notes', 'See and edit staff notes', 'extra'),
      ev('registrations.editStatus', 'Edit team status', 'edit', 'Confirm / reject / cancel a team.'),
      ev('registrations.editIdCheck', 'Edit ID verification', 'edit', 'Approve / reject IDs and the rejection reason.'),
      ev('registrations.editPayment', 'Edit payment', 'edit', 'Payment status, reference and verified date.'),
      ev('registrations.editDetails', 'Edit team details', 'edit', 'Team name, leader, college, members, event, amount due, portal accounts.'),
      ev('registrations.editCheckin', 'Edit check-in fields', 'edit', 'In the CMS (the check-in desk has its own permission).'),
      ev('registrations.delete', 'Delete registrations', 'delete', 'Permanent: also deletes the team\'s student IDs, submissions and receipt. Only the Super Admin can put this in a role.'),
    ],
  },
  {
    id: 'idDocuments',
    label: 'Student IDs',
    group: 'AURIX',
    items: [
      ev('idDocuments.edit', 'Replace ID files', 'edit', 'Viewing them is "See student IDs" on Event registrations.'),
      ev('idDocuments.delete', 'Delete ID files', 'delete', 'Permanent. Only the Super Admin can put this in a role.'),
    ],
  },
  {
    id: 'submissions',
    label: 'Submissions',
    group: 'AURIX',
    items: [
      ev('submissions.view', 'View submissions', 'view'),
      ev('submissions.download', 'Download files', 'extra'),
      ev('submissions.review', 'Set review status & notes', 'edit', 'Qualified / Not qualified decides who enters the next round.'),
      ev('submissions.delete', 'Delete', 'delete', 'Also deletes the stored file.'),
    ],
  },
  {
    id: 'events',
    label: 'Events',
    group: 'AURIX',
    items: [
      ev('events.viewDrafts', 'View draft & coming-soon details', 'view'),
      ev('events.editTexts', 'Edit texts', 'edit', 'Descriptions, rules, tracks, schedule, FAQs, notice, SEO.'),
      ev('events.editLocked', 'Edit locked fields', 'edit', 'Dates, closing times, fees, team sizes, prize pool, status, payment label, flags.'),
      plain('events.create', 'Add events', 'create', 'A new competition gets its page at /aurix/<slug>.'),
      plain('events.delete', 'Delete events', 'delete', 'Permanent. Only the Super Admin can put this in a role.'),
    ],
  },
  {
    id: 'announcements',
    label: 'Announcements',
    group: 'AURIX',
    items: [doc('announcements', 'announcements.create', 'Create', 'create'), doc('announcements', 'announcements.edit', 'Edit', 'edit'), doc('announcements', 'announcements.delete', 'Delete', 'delete')],
  },
  {
    id: 'emailOutbox',
    label: 'Email queue',
    group: 'AURIX',
    items: [
      plain('emailOutbox.view', 'View', 'view'),
      plain('emailOutbox.edit', 'Edit (retry, cancel)', 'edit'),
      plain('emailOutbox.delete', 'Delete', 'delete', 'Only the Super Admin can put this in a role.'),
    ],
  },
  {
    id: 'formSubmissions',
    label: 'Form submissions (join / contact)',
    group: 'AURIX',
    items: [
      plain('formSubmissions.view', 'View', 'view', 'Names, emails and roll numbers from the website forms.'),
      plain('formSubmissions.handle', 'Mark handled', 'edit'),
      plain('formSubmissions.delete', 'Delete', 'delete'),
    ],
  },
  {
    id: 'shortLinks',
    label: 'Short links',
    group: 'AURIX',
    items: [
      doc('short-links', 'shortLinks.view', 'View', 'view'),
      doc('short-links', 'shortLinks.create', 'Create', 'create'),
      doc('short-links', 'shortLinks.edit', 'Edit', 'edit'),
      doc('short-links', 'shortLinks.delete', 'Delete', 'delete'),
    ],
  },
  content('pages', 'pages', 'Pages', { versions: true }),
  content('projects', 'projects', 'Projects'),
  content('posts', 'posts', 'Posts'),
  content('resources', 'resources', 'Learning resources'),
  content('people', 'people', 'People'),
  content('gallery-albums', 'gallery', 'Gallery'),
  { id: 'media', label: 'Media library', group: 'Content', items: [plain('media.create', 'Upload', 'create'), plain('media.edit', 'Edit', 'edit'), plain('media.delete', 'Delete', 'delete')] },
  {
    id: 'globals',
    label: 'Website settings',
    group: 'Website settings',
    items: [
      plain('globals.siteSettings', 'Site settings', 'edit'),
      plain('globals.navigation', 'Navigation', 'edit'),
      plain('globals.eventPageLabels', 'Event pages (wording)', 'edit'),
      plain('globals.formTexts', 'Labels & messages', 'edit'),
      plain('globals.portalTexts', 'Participant portal texts', 'edit'),
      plain('globals.pageTexts', 'Page texts', 'edit'),
      plain('globals.legalPages', 'Legal pages', 'edit'),
      plain('globals.aurixSchedule', 'AURIX schedule', 'edit'),
      plain('globals.staffTexts', 'Staff & admin texts', 'edit', 'Wording of the staff tools and the custom CMS screens.'),
    ],
  },
  {
    id: 'tools',
    label: 'Tools',
    group: 'Tools',
    items: [
      ev('tools.checkin', 'Check-in desk (/checkin)', 'extra'),
      ev('tools.paymentMatching', 'Payment matching (Registrations → Payment matching)', 'extra', 'Upload the Razorpay report and mark matched teams paid. Stored reports list every event\'s payers: they open only with this for all events.'),
      ev('tools.idReupload', 'ID re-upload screen and emails', 'extra', 'Needs "See student IDs" too.'),
      ev('exports.full', 'CSV export: full', 'extra', 'Columns still follow the "See …" permissions.'),
      ev('exports.finance', 'CSV export: finance', 'extra'),
      ev('exports.checkin', 'CSV export: check-in', 'extra'),
      ev('exports.roster', 'CSV export: roster', 'extra'),
      plain('paymentReports.manage', 'Stored payment reports (view, download, delete)', 'extra', 'Every event\'s payers are in them.'),
      plain('admin.retention', 'Data retention (delete participant data after the event)', 'extra', 'Permanent. Only the Super Admin can put this in a role.'),
    ],
  },
  {
    id: 'dashboard',
    label: 'Dashboard panels',
    group: 'Dashboard',
    items: [
      ev('dashboard.overview', 'Overview (registrations and money)', 'extra'),
      ev('dashboard.finance', 'Finance', 'extra'),
      ev('dashboard.desk', 'Registration desk', 'extra'),
      ev('dashboard.events', 'Your events', 'extra'),
      ev('dashboard.counts', 'Counts per event', 'extra'),
      ev('dashboard.totals', 'Totals', 'extra'),
    ],
  },
  {
    id: 'admin',
    label: 'Admin screens',
    group: 'Admin',
    items: [
      plain('admin.pageVisibility', 'Page visibility', 'extra', 'Show/hide website pages, e.g. the participant portal.'),
      plain('admin.participants', 'Participants', 'extra', 'List, confirm, lock and unlock participant accounts (personal data).'),
      plain('accounts.team', 'Team accounts', 'extra', 'See team and judge accounts, create new ones (Team member or Judge, without rights until someone adds them to a role), send password resets, unlock. Only admins can grant this.'),
      plain('accounts.delete', 'Delete accounts', 'extra', 'Team member, judge and participant accounts that lead no team; never admins. Only the Super Admin can put this in a role.'),
      plain('accessRoles.manage', 'Manage access roles', 'extra', 'Team lead: create/edit roles within their own permissions and assign them. Only admins can grant this.'),
    ],
  },
]

export const ITEMS: Record<string, CatalogueItem> = Object.fromEntries(CATALOGUE.flatMap((s) => s.items).map((i) => [i.key, i]))
export const KEYS = Object.keys(ITEMS)
export type PermissionKey = string
/** Only Super Admin / Admin may put this key in a role. */
export const ADMIN_GRANTED_ONLY = new Set(['accessRoles.manage', 'accounts.team'])
/**
 * Permanent deletions that only the Super Admin could do before 13 Oct 2026: only the Super Admin may put them in a
 * role or change who holds such a role (an Admin could otherwise give them to a team account they control).
 */
export const SUPER_GRANTED_ONLY = new Set(['registrations.delete', 'idDocuments.delete', 'events.delete', 'emailOutbox.delete', 'admin.retention', 'accounts.delete'])

// ---------------------------------------------------------------------------------------------------------------
// Roles and resolution

export type EventLimit = 'all' | 'assigned' | 'chosen'
/** An access role as stored (depth 0 relations: ids, or {relationTo, value} for the polymorphic documents). */
export type RoleDoc = {
  id?: number | string
  name?: string
  permissions?: unknown
  eventLimit?: unknown
  events?: unknown
  limitedCollections?: unknown
  documents?: unknown
}

/** all = every document/event; otherwise only these ids (strings). */
export type Grant = { all: true } | { all: false; ids: Set<string> }
const ALL: Grant = { all: true }

const idOf = (v: unknown): string | null => {
  if (v === null || v === undefined) return null
  if (typeof v === 'object') {
    const o = v as Record<string, unknown>
    if ('value' in o) return idOf(o.value)
    if ('id' in o) return idOf(o.id)
    return null
  }
  return String(v)
}
const list = (v: unknown): unknown[] => (Array.isArray(v) ? v : [])

/** The grant one role gives for one key (null = the role doesn't hold it). */
export function roleGrant(role: RoleDoc, key: string, user: { assignedEvents?: unknown } | null): Grant | null {
  const item = ITEMS[key]
  if (!item || !list(role.permissions).includes(key)) return null
  if (item.limit === 'event') {
    const limit = role.eventLimit === 'assigned' || role.eventLimit === 'chosen' ? role.eventLimit : 'all'
    if (limit === 'all') return ALL
    const src = limit === 'assigned' ? list(user?.assignedEvents) : list(role.events)
    return { all: false, ids: new Set(src.map(idOf).filter((x): x is string => Boolean(x))) }
  }
  if (item.limit === 'doc' && item.collection && list(role.limitedCollections).includes(item.collection)) {
    const ids = list(role.documents)
      .filter((d) => d && typeof d === 'object' && (d as any).relationTo === item.collection)
      .map(idOf)
      .filter((x): x is string => Boolean(x))
    return { all: false, ids: new Set(ids) }
  }
  return ALL
}

const merge = (a: Grant | null, b: Grant | null): Grant | null => {
  if (!a) return b
  if (!b) return a
  if (a.all || b.all) return ALL
  return { all: false, ids: new Set([...a.ids, ...b.ids]) }
}

type MaybeUser = Record<string, any> | null | undefined
export const isSuperAdminUser = (u: MaybeUser) => Boolean(u && u.role === 'SUPER_ADMIN')
export const isAdminUser = (u: MaybeUser) => Boolean(u && (u.role === 'SUPER_ADMIN' || u.role === 'ADMIN'))

/** The roles of a team member: their access roles (join field, populated on req.user). */
export function rolesOf(user: MaybeUser): RoleDoc[] {
  if (!user || user.role !== 'STAFF') return []
  const joined = user.accessRoles
  return (Array.isArray(joined) ? joined : Array.isArray(joined?.docs) ? joined.docs : []).filter((r: unknown) => r && typeof r === 'object') as RoleDoc[]
}

const cacheByUser = new WeakMap<object, Map<string, Grant | null>>()

/** The combined grant of a key for a user (Super Admin: all; Admin: all but the Super Admin's keys). Memoised per user. */
export function grantOf(user: MaybeUser, key: string): Grant | null {
  if (!user || !ITEMS[key]) return null
  if (isSuperAdminUser(user)) return ALL
  if (isAdminUser(user)) return SUPER_GRANTED_ONLY.has(key) ? null : ALL
  let memo = cacheByUser.get(user)
  if (!memo) cacheByUser.set(user, (memo = new Map()))
  if (memo.has(key)) return memo.get(key)!
  let g: Grant | null = null
  for (const role of rolesOf(user)) g = merge(g, roleGrant(role, key, user))
  if (g && !g.all && g.ids.size === 0) g = null // limited to nothing = no access
  memo.set(key, g)
  return g
}

/** Holds the key for at least one event/document (sidebar, menus, "may open this screen"). */
export const can = (user: MaybeUser, key: string) => grantOf(user, key) !== null
/** Holds the key for everything (no limit). */
export const canAll = (user: MaybeUser, key: string) => Boolean(grantOf(user, key)?.all)
/** Holds the key for this event/document id. A missing id counts only for unlimited grants (fail closed). */
export function canFor(user: MaybeUser, key: string, id: unknown): boolean {
  const g = grantOf(user, key)
  if (!g) return false
  if (g.all) return true
  const s = idOf(id)
  return s !== null && g.ids.has(s)
}
export const canAny = (user: MaybeUser, keys: string[]) => keys.some((k) => can(user, k))

/** Payload access result for a key: true (all), false, or a where on `field` (event or id). */
export function accessFor(user: MaybeUser, key: string, field: string): boolean | Record<string, unknown> {
  const g = grantOf(user, key)
  if (!g) return false
  if (g.all) return true
  return { [field]: { in: [...g.ids].map((x) => (/^\d+$/.test(x) ? Number(x) : x)) } }
}
/** Access for any of several keys (OR of their limits). */
export function accessForAny(user: MaybeUser, keys: string[], field: string): boolean | Record<string, unknown> {
  const parts = keys.map((k) => accessFor(user, k, field)).filter((r) => r !== false)
  if (!parts.length) return false
  if (parts.some((r) => r === true)) return true
  return parts.length === 1 ? (parts[0] as Record<string, unknown>) : { or: parts }
}

/** Event ids a key is limited to: 'all', or the ids (empty = none). */
export function eventScope(user: MaybeUser, key: string): 'all' | (number | string)[] {
  const g = grantOf(user, key)
  if (!g) return []
  if (g.all) return 'all'
  return [...g.ids].map((x) => (/^\d+$/.test(x) ? Number(x) : x))
}

/** Check-in desk: 'all', the event ids, or null (no access). */
export function checkInScope(user: MaybeUser): 'all' | (number | string)[] | null {
  const s = eventScope(user, 'tools.checkin')
  return Array.isArray(s) && !s.length ? null : s
}

/** ID re-upload screen + emails: needs "ID re-upload" AND "See student IDs"; the events both cover (null = none). */
export function idReuploadScope(user: MaybeUser): 'all' | (number | string)[] | null {
  const a = eventScope(user, 'tools.idReupload')
  const b = eventScope(user, 'registrations.ids')
  if ((Array.isArray(a) && !a.length) || (Array.isArray(b) && !b.length)) return null
  if (a === 'all') return b
  if (b === 'all') return a
  const keep = new Set(b.map(String))
  const both = a.filter((x) => keep.has(String(x)))
  return both.length ? both : null
}

/** Event id of a registration/submission (relation populated or not). */
export const eventIdOf = (doc: unknown): string | null => idOf((doc as any)?.event)

/** The key is in one of the user's roles, whatever its limits (e.g. "Your events" with no events assigned yet). */
export const holdsKey = (user: MaybeUser, key: string) => isAdminUser(user) || rolesOf(user).some((r) => list(r.permissions).includes(key))

/**
 * May use the CMS at all: admins, and team members who belong to at least one access role. A role with nothing usable
 * only shows the dashboard guide. Judges/participants: never.
 */
export const canUseCms = (user: MaybeUser) => isAdminUser(user) || rolesOf(user).length > 0

// ---------------------------------------------------------------------------------------------------------------
// Presets: the 15 fixed staff roles of 2 Oct 2026, reproduced exactly (tests/rbac.test.ts), plus the Team Head
// combinations. Seeded create-only as editable access roles. The old `roles` field on accounts was removed on
// 13 Oct 2026 (owner); `legacy` only names the fixed role a preset stands for.

export type Preset = { name: string; description: string; legacy: string; eventLimit: EventLimit; permissions: string[] }
const CONTENT_ALL = (['pages', 'projects', 'posts', 'resources', 'people'] as const).flatMap((c) => [`${c}.view`, `${c}.create`, `${c}.edit`])
const MEDIA_KEYS = [
  ...CONTENT_ALL,
  'pages.delete',
  'pages.versions',
  'gallery.view', 'gallery.create', 'gallery.edit', 'gallery.delete',
  'media.create', 'media.edit', 'media.delete',
  'shortLinks.view', 'shortLinks.create', 'shortLinks.edit', 'shortLinks.delete',
  'announcements.create', 'announcements.edit', 'announcements.delete',
  'formSubmissions.view', 'formSubmissions.handle',
  'events.viewDrafts', 'events.editTexts',
  'globals.siteSettings', 'globals.navigation', 'globals.eventPageLabels', 'globals.formTexts', 'globals.portalTexts', 'globals.pageTexts', 'globals.legalPages', 'globals.aurixSchedule',
  'dashboard.totals',
]
const REG_ALL = ['registrations.view', 'registrations.contacts', 'registrations.leaderPhone', 'registrations.ids', 'registrations.money', 'registrations.portalAccounts', 'registrations.notes', 'registrations.editStatus', 'registrations.editIdCheck', 'registrations.editPayment', 'registrations.editDetails', 'registrations.editCheckin']
const MANAGER_KEYS = [
  ...REG_ALL,
  'idDocuments.edit',
  'submissions.view', 'submissions.download', 'submissions.review', 'submissions.delete',
  'emailOutbox.view',
  'events.viewDrafts',
  'formSubmissions.view', 'formSubmissions.handle',
  'announcements.create', 'announcements.edit', 'announcements.delete',
  'tools.checkin', 'tools.idReupload',
  'exports.full', 'exports.finance', 'exports.checkin', 'exports.roster',
  'dashboard.overview',
]
const REGISTRATION_KEYS = ['registrations.view', 'registrations.contacts', 'registrations.leaderPhone', 'registrations.ids', 'registrations.portalAccounts', 'registrations.notes', 'registrations.editStatus', 'registrations.editIdCheck', 'tools.checkin', 'tools.idReupload', 'dashboard.desk']
const TECH_KEYS = ['registrations.view', 'registrations.leaderPhone', 'tools.checkin', 'exports.checkin', 'exports.roster', 'dashboard.events']
const LOGISTICS_KEYS = ['registrations.view', 'registrations.leaderPhone', 'tools.checkin', 'dashboard.counts']

export const PRESETS: Preset[] = [
  { name: 'Registration team', legacy: 'REGISTRATION', eventLimit: 'all', description: 'All registrations with contacts and student IDs; confirms teams and checks IDs; check-in; ID re-upload.', permissions: REGISTRATION_KEYS },
  { name: 'Technical event team', legacy: 'TECH_EVENT', eventLimit: 'assigned', description: 'Registrations of the events assigned on the account (leader phone), check-in and check-in/roster CSV for them.', permissions: TECH_KEYS },
  { name: 'Logistics', legacy: 'LOGISTICS', eventLimit: 'all', description: 'Registrations without emails or IDs (leader phone), check-in, counts per event.', permissions: LOGISTICS_KEYS },
  { name: 'Discipline committee', legacy: 'DISCIPLINE', eventLimit: 'all', description: 'Names, teams, colleges and events; no contacts or IDs.', permissions: ['registrations.view', 'dashboard.counts'] },
  { name: 'Technical support', legacy: 'TECH_SUPPORT', eventLimit: 'all', description: 'Status look-ups; no contacts or IDs.', permissions: ['registrations.view', 'dashboard.counts'] },
  { name: 'Media & outreach', legacy: 'MEDIA', eventLimit: 'all', description: 'All website content and wording, event texts, short links, announcements, form submissions.', permissions: MEDIA_KEYS },
  { name: 'Sponsors', legacy: 'SPONSORS', eventLimit: 'all', description: 'Totals only.', permissions: ['dashboard.totals'] },
  { name: 'Decoration', legacy: 'DECORATION', eventLimit: 'all', description: 'Counts per event.', permissions: ['dashboard.counts'] },
  { name: 'Finance', legacy: 'FINANCE', eventLimit: 'all', description: 'Money dashboard, contacts, payment fields, payment matching, finance CSV.', permissions: ['registrations.view', 'registrations.contacts', 'registrations.leaderPhone', 'registrations.money', 'registrations.notes', 'registrations.editPayment', 'tools.paymentMatching', 'exports.finance', 'dashboard.finance'] },
  { name: 'Treasurer', legacy: 'TREASURER', eventLimit: 'all', description: 'Finance view, finance CSV and payment matching.', permissions: ['registrations.view', 'registrations.money', 'tools.paymentMatching', 'exports.finance', 'dashboard.finance'] },
  { name: 'Core member', legacy: 'CORE_MEMBER', eventLimit: 'all', description: 'All dashboards; registrations read-only without contacts or IDs.', permissions: ['registrations.view', 'registrations.money', 'dashboard.overview'] },
  { name: 'Supervisor', legacy: 'SUPERVISOR', eventLimit: 'all', description: 'All dashboards; registrations read-only without contacts or IDs.', permissions: ['registrations.view', 'registrations.money', 'dashboard.overview'] },
  { name: 'President', legacy: 'PRESIDENT', eventLimit: 'all', description: 'Manages registrations (all fields, all exports), submissions, announcements and form submissions; payment matching.', permissions: [...MANAGER_KEYS, 'tools.paymentMatching'] },
  { name: 'Event Head', legacy: 'EVENT_HEAD', eventLimit: 'all', description: 'As President except payment matching, plus edits events (including dates, fees and team sizes), event wording and the AURIX schedule.', permissions: [...MANAGER_KEYS, 'events.editTexts', 'events.editLocked', 'globals.eventPageLabels', 'globals.aurixSchedule'] },
  { name: 'Registration lead', legacy: 'TEAM_HEAD+REGISTRATION', eventLimit: 'all', description: 'Registration team plus the full CSV export.', permissions: [...REGISTRATION_KEYS, 'exports.full'] },
  { name: 'Logistics lead', legacy: 'TEAM_HEAD+LOGISTICS', eventLimit: 'all', description: 'Logistics plus the check-in and roster CSV.', permissions: [...LOGISTICS_KEYS, 'exports.checkin', 'exports.roster'] },
  { name: 'Discipline lead', legacy: 'TEAM_HEAD+DISCIPLINE', eventLimit: 'all', description: 'Discipline committee plus the roster CSV.', permissions: ['registrations.view', 'dashboard.counts', 'exports.roster'] },
  { name: 'Technical event lead', legacy: 'TEAM_HEAD+TECH_EVENT', eventLimit: 'all', description: 'Technical event team for every event.', permissions: TECH_KEYS },
]

/** Fixed-role names → the presets they stand for (Team Head only counts together with a team role). Tests. */
export function legacyPresets(roles: unknown): Preset[] {
  const mine = new Set(list(roles).map(String))
  const head = mine.has('TEAM_HEAD')
  return PRESETS.filter((p) => {
    if (p.legacy.startsWith('TEAM_HEAD+')) return head && mine.has(p.legacy.slice('TEAM_HEAD+'.length))
    // a Team Head's technical-event role is the lead preset (all events), not the assigned-events one
    if (p.legacy === 'TECH_EVENT' && head) return false
    return mine.has(p.legacy)
  })
}

// ---------------------------------------------------------------------------------------------------------------
// Escalation rules (team leads)

/** A role holding a key that only the Super Admin may grant. */
export const superGrantedKey = (role: RoleDoc | null | undefined): string | null => list(role?.permissions).map(String).find((k) => SUPER_GRANTED_ONLY.has(k)) ?? null

/**
 * Is `role` (keys + limits) entirely within what `editor` holds? Super Admin: always. Admins: all but the Super Admin's
 * keys. "Manage access roles" and "Team accounts": admins only.
 */
export function roleWithin(editor: MaybeUser, role: RoleDoc, memberForAssigned?: MaybeUser): { ok: true } | { ok: false; key: string } {
  if (isSuperAdminUser(editor)) return { ok: true }
  if (isAdminUser(editor)) {
    const key = superGrantedKey(role)
    return key ? { ok: false, key } : { ok: true }
  }
  for (const key of list(role.permissions).map(String)) {
    if (!ITEMS[key] || ADMIN_GRANTED_ONLY.has(key) || SUPER_GRANTED_ONLY.has(key)) return { ok: false, key }
    const mine = grantOf(editor, key)
    if (!mine) return { ok: false, key }
    if (mine.all) continue
    // "assigned events" depends on each member's account: only someone holding the key for all events may grant it
    if (ITEMS[key].limit === 'event' && role.eventLimit === 'assigned') return { ok: false, key }
    const theirs = roleGrant(role, key, memberForAssigned || null)
    if (!theirs || theirs.all) return { ok: false, key }
    for (const id of theirs.ids) if (!mine.ids.has(id)) return { ok: false, key }
  }
  return { ok: true }
}

/** Every catalogue key that a role may never hold whatever the editor (validation). */
export const unknownKeys = (keys: unknown) => list(keys).map(String).filter((k) => !ITEMS[k])
