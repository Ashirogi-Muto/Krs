import test from 'node:test'
import assert from 'node:assert/strict'
import { can, canUseCms, checkInScope, eventScope } from '../src/payload/access/permissions'
import type { StaffRole } from '../src/payload/access/roles'

// The fixed staff roles of 2 Oct 2026, now presets of the access roles (8 Oct 2026): same answers as before.
const staff = (...roles: StaffRole[]) => ({ id: 1, role: 'STAFF', roles, assignedEvents: [3] })
const exportsOf = (u: any) => (['full', 'finance', 'checkin', 'roster'] as const).filter((v) => can(u, `exports.${v}`))

test('account types: admins pass every check, participants and judges none', () => {
  for (const role of ['SUPER_ADMIN', 'ADMIN']) {
    assert.equal(can({ role }, 'registrations.money'), true)
    assert.equal(canUseCms({ role }), true)
  }
  for (const role of ['PARTICIPANT', 'JUDGE']) {
    // staff roles on a non-staff account mean nothing
    assert.equal(can({ role, roles: ['PRESIDENT'] }, 'registrations.view'), false)
    assert.equal(canUseCms({ role, roles: ['PRESIDENT'] }), false)
  }
  assert.equal(canUseCms(staff()), false) // team member with no roles
  assert.equal(canUseCms(staff('DECORATION')), true)
  assert.equal(can(null, 'globals.navigation'), false)
})

test('roles overlap: a member holds the union of their roles', () => {
  const u = staff('DISCIPLINE', 'FINANCE')
  assert.equal(can(u, 'registrations.contacts'), true) // via FINANCE
  assert.equal(can(u, 'registrations.ids'), false)
  assert.equal(can(staff('DISCIPLINE'), 'registrations.contacts'), false)
})

test('sensitive fields per team', () => {
  const sees = (r: StaffRole) => ({
    contacts: can(staff(r), 'registrations.contacts'),
    phone: can(staff(r), 'registrations.leaderPhone') || can(staff(r), 'registrations.contacts'),
    ids: can(staff(r), 'registrations.ids'),
    money: can(staff(r), 'registrations.money'),
  })
  assert.deepEqual(sees('REGISTRATION'), { contacts: true, phone: true, ids: true, money: false })
  assert.deepEqual(sees('TECH_EVENT'), { contacts: false, phone: true, ids: false, money: false })
  assert.deepEqual(sees('LOGISTICS'), { contacts: false, phone: true, ids: false, money: false })
  assert.deepEqual(sees('DISCIPLINE'), { contacts: false, phone: false, ids: false, money: false })
  assert.deepEqual(sees('TECH_SUPPORT'), { contacts: false, phone: false, ids: false, money: false })
  assert.deepEqual(sees('FINANCE'), { contacts: true, phone: true, ids: false, money: true })
  assert.deepEqual(sees('TREASURER'), { contacts: false, phone: false, ids: false, money: true })
  assert.deepEqual(sees('CORE_MEMBER'), { contacts: false, phone: false, ids: false, money: true })
  for (const r of ['SPONSORS', 'DECORATION', 'MEDIA'] as StaffRole[]) {
    assert.equal(can(staff(r), 'registrations.view'), false, `${r} must not open registrations`)
  }
})

test('technical event members only see assigned events unless head or another all-events role', () => {
  assert.deepEqual(eventScope(staff('TECH_EVENT'), 'registrations.view'), [3])
  assert.equal(eventScope(staff('TECH_EVENT', 'TEAM_HEAD'), 'registrations.view'), 'all')
  assert.equal(eventScope(staff('TECH_EVENT', 'LOGISTICS'), 'registrations.view'), 'all')
  assert.equal(eventScope({ role: 'ADMIN' }, 'registrations.view'), 'all')
})

test('registration managers', () => {
  const manager = (u: any) => can(u, 'registrations.editDetails')
  assert.equal(manager(staff('PRESIDENT')), true)
  assert.equal(manager(staff('EVENT_HEAD')), true)
  assert.equal(manager(staff('CORE_MEMBER')), false)
  assert.equal(manager(staff('TEAM_HEAD')), false)
})

test('CSV exports per role', () => {
  assert.deepEqual(exportsOf({ role: 'SUPER_ADMIN' }), ['full', 'finance', 'checkin', 'roster'])
  assert.deepEqual(exportsOf(staff('PRESIDENT')), ['full', 'finance', 'checkin', 'roster'])
  assert.deepEqual(exportsOf(staff('REGISTRATION')), [])
  assert.deepEqual(exportsOf(staff('REGISTRATION', 'TEAM_HEAD')), ['full'])
  assert.deepEqual(exportsOf(staff('FINANCE')), ['finance'])
  assert.deepEqual(exportsOf(staff('TREASURER')), ['finance'])
  assert.deepEqual(exportsOf(staff('TECH_EVENT')), ['checkin', 'roster'])
  assert.deepEqual(exportsOf(staff('LOGISTICS')), [])
  assert.deepEqual(exportsOf(staff('LOGISTICS', 'TEAM_HEAD')), ['checkin', 'roster'])
  assert.deepEqual(exportsOf(staff('DISCIPLINE', 'TEAM_HEAD')), ['roster'])
  for (const r of ['DISCIPLINE', 'TECH_SUPPORT', 'MEDIA', 'SPONSORS', 'DECORATION', 'CORE_MEMBER', 'SUPERVISOR'] as StaffRole[]) {
    assert.deepEqual(exportsOf(staff(r)), [], r)
  }
})

test('check-in scope', () => {
  assert.equal(checkInScope({ role: 'ADMIN' }), 'all')
  assert.equal(checkInScope(staff('LOGISTICS')), 'all')
  assert.equal(checkInScope(staff('REGISTRATION')), 'all')
  assert.deepEqual(checkInScope(staff('TECH_EVENT')), [3])
  assert.deepEqual(checkInScope(staff('TECH_EVENT', 'DISCIPLINE')), [3]) // discipline adds no write rights
  assert.equal(checkInScope(staff('TECH_EVENT', 'TEAM_HEAD')), 'all')
  for (const r of ['DISCIPLINE', 'TECH_SUPPORT', 'MEDIA', 'SPONSORS', 'DECORATION', 'FINANCE', 'CORE_MEMBER'] as StaffRole[]) {
    assert.equal(checkInScope(staff(r)), null, r)
  }
})
