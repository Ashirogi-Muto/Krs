import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import {
  ITEMS,
  KEYS,
  PRESETS,
  accessFor,
  can,
  canFor,
  canUseCms,
  checkInScope,
  eventScope,
  grantOf,
  idReuploadScope,
  legacyPresets,
  roleWithin,
  type RoleDoc,
} from '../src/payload/access/permissions'

/**
 * Custom access roles (owner, 8 Oct 2026; docs/ACCESS_ROLES_PLAN.md): union of roles, event and document limits,
 * fail-closed resolution, team-lead escalation rules, presets = the old fixed roles, and every permission wired.
 */
let n = 100
const member = (roles: RoleDoc[], extra: Record<string, unknown> = {}) => ({ id: n++, role: 'STAFF', accessRoles: { docs: roles }, legacyRolesMigrated: true, ...extra })
const role = (permissions: string[], more: Partial<RoleDoc> = {}): RoleDoc => ({ permissions, eventLimit: 'all', ...more })

test('a team member holds exactly the union of their access roles', () => {
  const u = member([role(['registrations.view']), role(['registrations.money', 'globals.navigation'])])
  assert.equal(can(u, 'registrations.view'), true)
  assert.equal(can(u, 'registrations.money'), true)
  assert.equal(can(u, 'globals.navigation'), true)
  assert.equal(can(u, 'registrations.contacts'), false)
  assert.equal(can(u, 'pages.edit'), false)
  assert.equal(canUseCms(u), true)
})

test('fail closed: unknown keys, empty roles, non-team accounts, legacy roles after migration', () => {
  assert.equal(can(member([role(['made.up', 'registrations.view.extra'])]), 'made.up'), false)
  assert.equal(can(member([]), 'registrations.view'), false)
  assert.equal(canUseCms(member([])), false)
  assert.equal(canUseCms(member([role([])])), true, 'belongs to a role: dashboard only')
  for (const type of ['PARTICIPANT', 'JUDGE']) {
    const u = { id: 1, role: type, accessRoles: { docs: [role(['registrations.contacts'])] }, roles: ['PRESIDENT'] }
    assert.equal(can(u, 'registrations.contacts'), false, type)
    assert.equal(canUseCms(u), false, type)
  }
  // Once migrated, the old fixed roles grant nothing (removing someone from a role really removes the rights)
  assert.equal(can(member([], { roles: ['PRESIDENT'] }), 'registrations.contacts'), false)
  assert.equal(can({ id: 1, role: 'STAFF', roles: ['PRESIDENT'] }, 'registrations.contacts'), true, 'not migrated yet: preset applies')
  // An event limit with no events = no access (not "all")
  assert.equal(can(member([role(['registrations.view'], { eventLimit: 'chosen', events: [] })]), 'registrations.view'), false)
  assert.equal(can(member([role(['registrations.view'], { eventLimit: 'assigned' })], { assignedEvents: [] }), 'registrations.view'), false)
})

test('event limits: all, chosen events, the account\'s assigned events; union across roles', () => {
  const chosen = member([role(['registrations.view', 'registrations.contacts'], { eventLimit: 'chosen', events: [{ id: 7 }, 9] })])
  assert.deepEqual(eventScope(chosen, 'registrations.view'), [7, 9])
  assert.equal(canFor(chosen, 'registrations.contacts', 7), true)
  assert.equal(canFor(chosen, 'registrations.contacts', { id: 9, title: 'x' }), true)
  assert.equal(canFor(chosen, 'registrations.contacts', 8), false)
  assert.equal(canFor(chosen, 'registrations.contacts', null), false, 'no event: refused')
  assert.deepEqual(accessFor(chosen, 'registrations.view', 'event'), { event: { in: [7, 9] } })

  const assigned = member([role(['tools.checkin'], { eventLimit: 'assigned' })], { assignedEvents: [3, { id: 4 }] })
  assert.deepEqual(checkInScope(assigned), [3, 4])

  // Role A: contacts for event 7 only; role B: view all → contacts still only for event 7
  const mixed = member([role(['registrations.contacts'], { eventLimit: 'chosen', events: [7] }), role(['registrations.view'])])
  assert.equal(canFor(mixed, 'registrations.view', 8), true)
  assert.equal(canFor(mixed, 'registrations.contacts', 8), false)
  // Same key in two roles: union of the limits; any unlimited grant wins
  const union = member([role(['submissions.view'], { eventLimit: 'chosen', events: [1] }), role(['submissions.view'], { eventLimit: 'chosen', events: [2] })])
  assert.deepEqual(eventScope(union, 'submissions.view'), [1, 2])
  assert.equal(eventScope(member([role(['submissions.view'], { eventLimit: 'chosen', events: [1] }), role(['submissions.view'])]), 'submissions.view'), 'all')
  // ID re-upload needs both permissions; the events both cover
  const re = member([role(['tools.idReupload'], { eventLimit: 'chosen', events: [1, 2] }), role(['registrations.ids'], { eventLimit: 'chosen', events: [2, 3] })])
  assert.deepEqual(idReuploadScope(re), [2])
  assert.equal(idReuploadScope(member([role(['tools.idReupload'])])), null)
})

test('document limits: only the chosen documents of the limited pages', () => {
  const u = member([
    role(['pages.view', 'pages.edit', 'posts.edit'], {
      limitedCollections: ['pages'],
      documents: [{ relationTo: 'pages', value: 5 }, { relationTo: 'posts', value: 99 }],
    }),
  ])
  assert.equal(canFor(u, 'pages.edit', 5), true)
  assert.equal(canFor(u, 'pages.edit', 6), false)
  assert.deepEqual(accessFor(u, 'pages.edit', 'id'), { id: { in: [5] } })
  assert.equal(grantOf(u, 'posts.edit')?.all, true, 'posts not limited: all posts')
  // Global keys ignore document limits; event keys ignore document limits
  const g = member([role(['globals.navigation', 'registrations.view'], { limitedCollections: ['pages'], documents: [] })])
  assert.equal(grantOf(g, 'globals.navigation')?.all, true)
  assert.equal(grantOf(g, 'registrations.view')?.all, true)
})

test('admins hold everything for everything; nobody else holds anything by default', () => {
  for (const r of ['ADMIN', 'SUPER_ADMIN']) for (const k of KEYS) assert.equal(grantOf({ role: r }, k)?.all, true, `${r} ${k}`)
  for (const k of KEYS) assert.equal(can({ id: 1, role: 'STAFF' }, k), false, k)
})

test('presets: valid keys, unique names, and the old fixed roles map onto them', () => {
  const names = PRESETS.map((p) => p.name)
  assert.equal(new Set(names).size, names.length)
  for (const p of PRESETS) for (const k of p.permissions) assert.ok(ITEMS[k], `${p.name}: ${k}`)
  for (const p of PRESETS) assert.ok(!p.permissions.includes('accessRoles.manage'), `${p.name} must not manage roles`)
  const of = (...r: string[]) => legacyPresets(r).map((p) => p.name).sort()
  assert.deepEqual(of('MEDIA', 'PRESIDENT'), ['Media & outreach', 'President'])
  assert.deepEqual(of('TEAM_HEAD'), [])
  assert.deepEqual(of('TEAM_HEAD', 'TECH_EVENT'), ['Technical event lead'])
  assert.deepEqual(of('TECH_EVENT'), ['Technical event team'])
  assert.deepEqual(of('TEAM_HEAD', 'REGISTRATION'), ['Registration lead', 'Registration team'])
  // A preset assigned as an access role gives exactly what the old fixed role gave
  for (const legacy of ['REGISTRATION', 'TECH_EVENT', 'LOGISTICS', 'DISCIPLINE', 'TECH_SUPPORT', 'MEDIA', 'SPONSORS', 'DECORATION', 'FINANCE', 'CORE_MEMBER', 'SUPERVISOR', 'PRESIDENT', 'EVENT_HEAD', 'TREASURER']) {
    const old = { id: 1, role: 'STAFF', roles: [legacy], assignedEvents: [3] }
    const now = member(legacyPresets([legacy]) as any, { assignedEvents: [3] })
    for (const k of KEYS) assert.deepEqual(eventScope(now, k), eventScope(old, k), `${legacy} ${k}`)
  }
})

test('team leads: only within what they hold, never "Manage access roles", events and documents included', () => {
  const lead = member([role(['accessRoles.manage', 'registrations.view', 'registrations.contacts'], { eventLimit: 'chosen', events: [1, 2] }), role(['pages.edit'], { limitedCollections: ['pages'], documents: [{ relationTo: 'pages', value: 5 }] })])
  assert.deepEqual(roleWithin(lead, role(['registrations.view'], { eventLimit: 'chosen', events: [1] })), { ok: true })
  assert.equal(roleWithin(lead, role(['registrations.view'])).ok, false, 'all events > events 1, 2')
  assert.equal(roleWithin(lead, role(['registrations.view'], { eventLimit: 'chosen', events: [3] })).ok, false)
  assert.equal(roleWithin(lead, role(['registrations.view'], { eventLimit: 'assigned' })).ok, false, 'assigned events depend on each account')
  assert.equal(roleWithin(lead, role(['registrations.money'], { eventLimit: 'chosen', events: [1] })).ok, false, 'not held')
  assert.equal(roleWithin(lead, role(['accessRoles.manage'])).ok, false, 'never passed on')
  assert.equal(roleWithin(lead, role(['pages.edit'], { limitedCollections: ['pages'], documents: [{ relationTo: 'pages', value: 5 }] })).ok, true)
  assert.equal(roleWithin(lead, role(['pages.edit'])).ok, false, 'all pages > page 5')
  assert.equal(roleWithin(lead, role(['made.up'])).ok, false)
  // Admins may grant anything
  assert.equal(roleWithin({ role: 'ADMIN' }, role(['accessRoles.manage', 'registrations.money'])).ok, true)
})

test('the role editor refuses escalation on save (hooks, not only the screen)', async () => {
  const { AccessRoles } = await import('../src/payload/collections/AccessRoles')
  const hook = AccessRoles.hooks!.beforeChange![0] as any
  const staffIds = new Set([5000, 5001])
  const req = (user: any) => ({
    user,
    payload: {
      find: async ({ where }: any) => {
        const asked = where.and[0].id.in as number[]
        return { docs: asked.filter((i) => !staffIds.has(i)).map((id) => ({ id })) }
      },
      findGlobal: async () => ({}),
    },
  })
  const lead = member([role(['accessRoles.manage', 'registrations.view', 'registrations.contacts'])])
  const run = (user: any, data: any, originalDoc?: any) => hook({ data, originalDoc, operation: originalDoc ? 'update' : 'create', req: req(user) })
  await assert.doesNotReject(run(lead, { name: 'Desk', permissions: ['registrations.view'], eventLimit: 'all', members: [5000] }))
  await assert.rejects(run(lead, { name: 'X', permissions: ['registrations.money'], eventLimit: 'all' }), /only grant what you hold/)
  await assert.rejects(run(lead, { name: 'X', permissions: ['accessRoles.manage'], eventLimit: 'all' }), /only be granted by an admin/)
  await assert.rejects(run(lead, { name: 'X', permissions: ['registrations.view'], eventLimit: 'all', members: [lead.id] }), /add yourself/)
  await assert.rejects(run(lead, { name: 'X', permissions: ['registrations.view'], eventLimit: 'all', members: [999] }), /team member accounts/)
  // A role the lead holds, or one granting more than they hold, can't be edited by them
  await assert.rejects(run(lead, { description: 'x' }, { name: 'Mine', permissions: ['registrations.view'], eventLimit: 'all', members: [lead.id] }), /role you hold/)
  await assert.rejects(run(lead, { description: 'x' }, { name: 'Big', permissions: ['registrations.money'], eventLimit: 'all', members: [] }), /only grant what you hold/)
  await assert.rejects(run(lead, { preset: true }, { name: 'P', permissions: ['registrations.view'], eventLimit: 'all', preset: false }), /preset flag/)
  // Create can't be limited to chosen documents (for anyone)
  await assert.rejects(run({ role: 'ADMIN', id: 1 }, { name: 'X', permissions: ['pages.create'], limitedCollections: ['pages'], eventLimit: 'all' }), /not possible on Pages/)
  // Admins may grant anything to team members
  await assert.doesNotReject(run({ role: 'ADMIN', id: 1 }, { name: 'Y', permissions: ['accessRoles.manage', 'registrations.money'], eventLimit: 'all', members: [5000, 5001] }))
})

test('every permission is enforced somewhere, and every permission named in the code exists', () => {
  const SRC = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'src')
  const files = (dir: string): string[] =>
    fs.readdirSync(dir, { withFileTypes: true }).flatMap((e) => (e.isDirectory() ? files(path.join(dir, e.name)) : /\.tsx?$/.test(e.name) ? [path.join(dir, e.name)] : []))
  const code = files(SRC)
    .filter((f) => !/payload\/access\/permissions\.ts$|payload-types\.ts$|migrations\//.test(f))
    .map((f) => fs.readFileSync(f, 'utf8'))
    .join('\n')
  // Keys built from templates: content pages (collections/Content.ts) and CSV views (registrations-export, dashboard)
  const dynamic = (k: string) => {
    const [page, action] = k.split('.')
    if (['projects', 'posts', 'resources', 'people', 'gallery'].includes(page) && ['view', 'create', 'edit', 'delete'].includes(action)) return code.includes(`contentAccess('${page}')`) && code.includes(`contentHidden('${page}')`)
    // Enforced through helpers in permissions.ts (checkInScope, idReuploadScope); their callers must exist
    if (k === 'tools.checkin') return code.includes('checkInScope(')
    if (k === 'tools.idReupload') return code.includes('idReuploadScope(')
    if (page === 'exports') return code.includes('`exports.${view}`') && code.includes("'full', 'finance', 'checkin', 'roster'")
    return false
  }
  const unused = KEYS.filter((k) => !code.includes(`'${k}'`) && !dynamic(k))
  assert.deepEqual(unused, [], 'catalogue permissions that no rule checks')
  const named = [...code.matchAll(/\b(?:can|canFor|canAll|canAny|keyAccess|createAccess|keyAllowed|eventFieldKey|docFieldKey|grantOf|eventScope|holdsKey|accessFor)\((?:[^,()]+, )?'([a-zA-Z]+\.[a-zA-Z]+)'/g)].map((m) => m[1])
  assert.deepEqual([...new Set(named.filter((k) => !ITEMS[k]))], [], 'permissions checked in code but missing from the catalogue')
})

test('team leads see team member accounts (to pick people for roles), never participants', async () => {
  const { Users } = await import('../src/payload/collections/Users')
  const read = Users.access!.read as any
  const lead = member([role(['accessRoles.manage'])])
  assert.deepEqual(await read({ req: { user: lead } }), { or: [{ id: { equals: lead.id } }, { role: { equals: 'STAFF' } }] })
  const plain = member([role(['registrations.view'])])
  assert.deepEqual(await read({ req: { user: plain } }), { id: { equals: plain.id } })
})
