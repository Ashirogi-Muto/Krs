import test from 'node:test'
import assert from 'node:assert/strict'
import configPromise from '../src/payload.config'
import { legacyPresets } from '../src/payload/access/permissions'

/**
 * RBAC audit (owner, 8 Oct 2026): the REAL config's access rules, evaluated for one account of every type/role,
 * must match the role design in src/payload/access/roles.ts. "W" = only some documents (a query filter).
 * A new collection/global fails here until its expected row is added, so nothing ships with Payload's default
 * ("any logged-in account").
 */
const ROLES = ['REGISTRATION', 'TECH_EVENT', 'LOGISTICS', 'DISCIPLINE', 'TECH_SUPPORT', 'MEDIA', 'SPONSORS', 'DECORATION', 'FINANCE', 'TEAM_HEAD', 'CORE_MEMBER', 'SUPERVISOR', 'PRESIDENT', 'EVENT_HEAD', 'TREASURER'] as const
const presetRoles = (r: string) => legacyPresets([r]).map((p) => ({ name: p.name, permissions: p.permissions, eventLimit: p.eventLimit }))
const P: Record<string, any> = {
  anon: null,
  participant: { id: 900, role: 'PARTICIPANT', roles: [], collection: 'users' },
  judge: { id: 901, role: 'JUDGE', roles: [], collection: 'users' },
  noRole: { id: 902, role: 'STAFF', roles: [], collection: 'users' },
  // Each fixed role of 2 Oct 2026 as its preset access role(s) (the old `roles` field was removed on 13 Oct 2026)
  ...Object.fromEntries(ROLES.map((r, i) => [r, { id: 910 + i, role: 'STAFF', accessRoles: { docs: presetRoles(r) }, assignedEvents: r === 'TECH_EVENT' ? [1] : [], collection: 'users' }])),
  admin: { id: 2, role: 'ADMIN', roles: [], collection: 'users' },
  super: { id: 1, role: 'SUPER_ADMIN', roles: [], collection: 'users' },
}
const NAMES = Object.keys(P)

// Who gets "Y" (everyone else must get "-"), unless a persona is listed in W (filtered access)
type Row = { Y: string[]; W?: string[] }
const A = ['admin', 'super']
const MGR = ['PRESIDENT', 'EVENT_HEAD', ...A]
const LOGGED_IN = NAMES.filter((n) => n !== 'anon')
// Team Head alone maps to no preset: since the old `roles` field is gone (13 Oct 2026) it opens no CMS at all
const CMS = [...ROLES.filter((r) => r !== 'TEAM_HEAD'), ...A]
const READ_ALL = ['CORE_MEMBER', 'SUPERVISOR', 'REGISTRATION', 'FINANCE', 'TREASURER', 'LOGISTICS', 'DISCIPLINE', 'TECH_SUPPORT', ...MGR]
const MEDIA = ['MEDIA', ...A]
const publicW = (editors: string[]) => ({ Y: editors, W: NAMES.filter((n) => !editors.includes(n)) })
const none: Row = { Y: [] }
const adminsOnlyRow: Row = { Y: A }
const superOnly: Row = { Y: ['super'] }

const COLLECTIONS: Record<string, Record<string, Row>> = {
  'event-registrations': { read: { Y: READ_ALL, W: ['TECH_EVENT'] }, create: none, update: { Y: ['REGISTRATION', 'FINANCE', ...MGR] }, delete: superOnly },
  'id-documents': { read: { Y: ['REGISTRATION', ...MGR] }, create: none, update: { Y: MGR }, delete: superOnly },
  'round-submissions': { read: { Y: [...MGR, 'judge'] }, create: none, update: { Y: MGR }, delete: { Y: MGR } },
  'email-outbox': { read: { Y: MGR }, create: none, update: adminsOnlyRow, delete: superOnly },
  // Razorpay reports (9 Oct 2026): created and read back only through the Payment matching screen's own checks
  'payment-reports': { read: adminsOnlyRow, create: none, update: none, delete: adminsOnlyRow },
  // Coupons (13 Oct 2026): admins by default; any access role can be given the coupon permissions (in no preset)
  coupons: { read: adminsOnlyRow, create: adminsOnlyRow, update: adminsOnlyRow, delete: adminsOnlyRow },
  'form-submissions': { read: { Y: ['MEDIA', ...MGR] }, create: none, update: { Y: ['MEDIA', ...MGR] }, delete: adminsOnlyRow },
  users: { admin: { Y: CMS }, read: { Y: A, W: LOGGED_IN.filter((n) => !A.includes(n)) }, create: adminsOnlyRow, update: { Y: ['super'], W: LOGGED_IN.filter((n) => n !== 'super') }, delete: superOnly, unlock: { Y: ['super'], W: ['admin'] } },
  events: { read: publicW(['MEDIA', ...MGR]), create: adminsOnlyRow, update: { Y: ['MEDIA', 'EVENT_HEAD', ...A] }, delete: superOnly },
  pages: { read: publicW(MEDIA), readVersions: { Y: MEDIA }, create: { Y: MEDIA }, update: { Y: MEDIA }, delete: { Y: MEDIA } },
  projects: { read: publicW(MEDIA), create: { Y: MEDIA }, update: { Y: MEDIA }, delete: adminsOnlyRow },
  posts: { read: publicW(MEDIA), create: { Y: MEDIA }, update: { Y: MEDIA }, delete: adminsOnlyRow },
  resources: { read: publicW(MEDIA), create: { Y: MEDIA }, update: { Y: MEDIA }, delete: adminsOnlyRow },
  people: { read: publicW(MEDIA), create: { Y: MEDIA }, update: { Y: MEDIA }, delete: adminsOnlyRow },
  media: { read: { Y: NAMES }, create: { Y: MEDIA }, update: { Y: MEDIA }, delete: { Y: MEDIA } },
  'gallery-albums': { read: publicW(MEDIA), create: { Y: MEDIA }, update: { Y: MEDIA }, delete: { Y: MEDIA } },
  'short-links': { read: { Y: MEDIA }, create: { Y: MEDIA }, update: { Y: MEDIA }, delete: { Y: MEDIA } },
  announcements: { read: { Y: CMS, W: ['participant', 'judge', 'noRole', 'TEAM_HEAD'] }, create: { Y: ['MEDIA', ...MGR] }, update: { Y: ['MEDIA', ...MGR] }, delete: { Y: ['MEDIA', ...MGR] } },
  // Legacy, hidden and unused until phase 2: admins only
  ...Object.fromEntries(['teams', 'team-members', 'registrations', 'submissions', 'evaluations', 'results'].map((s) => [s, { read: adminsOnlyRow, create: adminsOnlyRow, update: adminsOnlyRow, delete: superOnly }])),
  // Payload internals
  // Access roles (8 Oct 2026): admins and team leads ("Manage access roles", in no preset)
  'access-roles': { read: adminsOnlyRow, create: adminsOnlyRow, update: adminsOnlyRow, delete: adminsOnlyRow },
  'payload-locked-documents': { read: { Y: CMS }, create: { Y: CMS }, update: { Y: CMS }, delete: { Y: CMS } },
  'payload-preferences': { read: { Y: [], W: LOGGED_IN }, create: { Y: LOGGED_IN }, update: { Y: [], W: LOGGED_IN }, delete: { Y: [], W: LOGGED_IN } },
  'payload-kv': { read: none, create: none, update: none, delete: none },
}
// payload-migrations keeps Payload's default rule but has no REST endpoints (endpoints: false), checked below
const GLOBALS: Record<string, Row> = {
  'site-settings': { Y: MEDIA },
  navigation: { Y: MEDIA },
  'event-page-labels': { Y: ['MEDIA', 'EVENT_HEAD', ...A] },
  'form-texts': { Y: MEDIA },
  // School entry wording (18 Oct 2026): same editors as Labels & messages
  'school-entry-texts': { Y: MEDIA },
  'portal-texts': { Y: MEDIA },
  'page-texts': { Y: MEDIA },
  'legal-pages': { Y: MEDIA },
  'aurix-schedule': { Y: ['MEDIA', 'EVENT_HEAD', ...A] },
  'staff-texts': adminsOnlyRow,
  // Coupon limits: admins only, never through access roles
  'coupon-settings': adminsOnlyRow,
}

const stub = { find: async () => ({ docs: [] }), findGlobal: async () => ({}), findByID: async () => null, count: async () => ({ totalDocs: 0 }), config: { admin: { user: 'users' } } }
const evaluate = async (fn: any, user: any) => {
  const v = await fn({ req: { user, payload: stub, headers: new Headers(), context: {} } })
  return v === true ? 'Y' : v ? 'W' : '-'
}
const expected = (row: Row, n: string) => (row.Y.includes(n) ? 'Y' : row.W?.includes(n) ? 'W' : '-')

test('every collection operation matches the role design (nothing more, nothing less)', async () => {
  const config: any = await configPromise
  const slugs = config.collections.map((c: any) => c.slug).filter((s: string) => s !== 'payload-migrations')
  assert.deepEqual(slugs.filter((s: string) => !COLLECTIONS[s]), [], 'collection without an expected RBAC row')
  for (const c of config.collections) {
    const rows = COLLECTIONS[c.slug]
    if (!rows) continue
    for (const [op, row] of Object.entries(rows)) {
      const fn = c.access?.[op]
      assert.ok(fn, `${c.slug}.${op} has no rule`)
      for (const n of NAMES) assert.equal(await evaluate(fn, P[n]), expected(row, n), `${c.slug}.${op} for ${n}`)
    }
  }
})

test('payload-migrations is not reachable over REST', async () => {
  const config: any = await configPromise
  assert.equal(config.collections.find((c: any) => c.slug === 'payload-migrations')?.endpoints, false)
})

test('every global: anyone may read the public texts; only the right roles edit', async () => {
  const config: any = await configPromise
  assert.deepEqual(config.globals.map((g: any) => g.slug).filter((s: string) => !GLOBALS[s]), [], 'global without an expected RBAC row')
  for (const g of config.globals) {
    for (const n of NAMES) {
      assert.equal(await evaluate(g.access.update, P[n]), expected(GLOBALS[g.slug], n), `${g.slug}.update for ${n}`)
      const read = await evaluate(g.access.read, P[n])
      assert.equal(read, g.slug === 'staff-texts' ? (n === 'anon' ? '-' : 'Y') : g.slug === 'coupon-settings' ? expected(adminsOnlyRow, n) : 'Y', `${g.slug}.read for ${n}`)
    }
  }
})

test('registration fields: contacts, phones, IDs, money and notes only for the right roles', async () => {
  const config: any = await configPromise
  const regs = config.collections.find((c: any) => c.slug === 'event-registrations')
  const field = (path: string): any => {
    let fields = regs.fields
    let f: any
    for (const part of path.split('.')) {
      const flat = (list: any[]): any[] => list.flatMap((x) => (x.name ? [x] : x.fields ? flat(x.fields) : x.tabs ? flat(x.tabs.flatMap((t: any) => t.fields)) : []))
      f = flat(fields).find((x) => x.name === part)
      fields = f?.fields || []
    }
    return f
  }
  const CONTACTS = ['REGISTRATION', 'FINANCE', ...MGR]
  const want: Record<string, string[]> = {
    leaderEmail: CONTACTS,
    'members.email': CONTACTS,
    'members.phone': CONTACTS,
    leaderPhone: [...CONTACTS, 'TECH_EVENT', 'LOGISTICS'],
    'members.idDocument': ['REGISTRATION', ...MGR],
    amountDue: ['CORE_MEMBER', 'SUPERVISOR', 'FINANCE', 'TREASURER', ...MGR],
    paymentReference: ['CORE_MEMBER', 'SUPERVISOR', 'FINANCE', 'TREASURER', ...MGR],
    adminNotes: CONTACTS,
    idRejectReason: ['REGISTRATION', ...MGR],
  }
  for (const [path, who] of Object.entries(want)) {
    const f = field(path)
    assert.ok(f?.access?.read, `${path} has no read rule`)
    // A registration always belongs to an event (field rules are per event since the access roles; event 1 is assigned to TECH_EVENT)
    for (const n of NAMES) assert.equal(Boolean(await f.access.read({ req: { user: P[n] }, doc: { event: 1 }, siblingData: {} })), who.includes(n), `${path} read for ${n}`)
  }
  // Who may change the decisions on a registration
  const upd: Record<string, string[]> = { status: ['REGISTRATION', ...MGR], idVerification: ['REGISTRATION', ...MGR], paymentStatus: ['FINANCE', ...MGR], teamName: MGR, amountDue: MGR }
  for (const [path, who] of Object.entries(upd)) {
    const f = field(path)
    for (const n of NAMES) assert.equal(Boolean(await f.access.update({ req: { user: P[n] }, doc: { event: 1 }, siblingData: {}, data: {} })), who.includes(n), `${path} update for ${n}`)
  }
})
