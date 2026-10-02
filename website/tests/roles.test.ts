import test from 'node:test'
import assert from 'node:assert/strict'
import {
  REG_READ_ALL,
  SEE_CONTACTS,
  SEE_IDS,
  SEE_LEADER_PHONE,
  SEE_MONEY,
  canUseAdmin,
  exportViews,
  hasRole,
  isManager,
  limitedToAssignedEvents,
  type StaffRole,
} from '../src/payload/access/roles'

const staff = (...roles: StaffRole[]) => ({ id: 1, role: 'STAFF', roles, assignedEvents: [3] })

test('account types: admins pass every role check, participants and judges none', () => {
  for (const role of ['SUPER_ADMIN', 'ADMIN']) {
    assert.equal(hasRole({ role }, ['FINANCE']), true)
    assert.equal(canUseAdmin({ role }), true)
  }
  for (const role of ['PARTICIPANT', 'JUDGE']) {
    // staff roles on a non-staff account mean nothing
    assert.equal(hasRole({ role, roles: ['PRESIDENT'] }, ['PRESIDENT']), false)
    assert.equal(canUseAdmin({ role, roles: ['PRESIDENT'] }), false)
  }
  assert.equal(canUseAdmin(staff()), false) // team member with no roles ticked
  assert.equal(canUseAdmin(staff('DECORATION')), true)
  assert.equal(hasRole(null, ['MEDIA']), false)
})

test('roles overlap: a member holds the union of their roles', () => {
  const u = staff('DISCIPLINE', 'FINANCE')
  assert.equal(hasRole(u, SEE_CONTACTS), true) // via FINANCE
  assert.equal(hasRole(u, SEE_IDS), false)
  assert.equal(hasRole(staff('DISCIPLINE'), SEE_CONTACTS), false)
})

test('sensitive fields per team', () => {
  const sees = (r: StaffRole) => ({
    contacts: hasRole(staff(r), SEE_CONTACTS),
    phone: hasRole(staff(r), SEE_LEADER_PHONE),
    ids: hasRole(staff(r), SEE_IDS),
    money: hasRole(staff(r), SEE_MONEY),
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
    assert.equal(hasRole(staff(r), REG_READ_ALL), false, `${r} must not open registrations`)
  }
})

test('technical event members only see assigned events unless head or another all-events role', () => {
  assert.equal(limitedToAssignedEvents(staff('TECH_EVENT')), true)
  assert.equal(limitedToAssignedEvents(staff('TECH_EVENT', 'TEAM_HEAD')), false)
  assert.equal(limitedToAssignedEvents(staff('TECH_EVENT', 'LOGISTICS')), false)
  assert.equal(limitedToAssignedEvents({ role: 'ADMIN' }), false)
})

test('registration managers', () => {
  assert.equal(isManager(staff('PRESIDENT')), true)
  assert.equal(isManager(staff('EVENT_HEAD')), true)
  assert.equal(isManager(staff('CORE_MEMBER')), false)
  assert.equal(isManager(staff('TEAM_HEAD')), false)
})

test('CSV exports per role', () => {
  assert.deepEqual(exportViews({ role: 'SUPER_ADMIN' }), ['full', 'finance', 'checkin', 'roster'])
  assert.deepEqual(exportViews(staff('PRESIDENT')), ['full', 'finance', 'checkin', 'roster'])
  assert.deepEqual(exportViews(staff('REGISTRATION')), [])
  assert.deepEqual(exportViews(staff('REGISTRATION', 'TEAM_HEAD')), ['full'])
  assert.deepEqual(exportViews(staff('FINANCE')), ['finance'])
  assert.deepEqual(exportViews(staff('TREASURER')), ['finance'])
  assert.deepEqual(exportViews(staff('TECH_EVENT')), ['checkin', 'roster'])
  assert.deepEqual(exportViews(staff('LOGISTICS')), [])
  assert.deepEqual(exportViews(staff('LOGISTICS', 'TEAM_HEAD')), ['checkin', 'roster'])
  assert.deepEqual(exportViews(staff('DISCIPLINE', 'TEAM_HEAD')), ['roster'])
  for (const r of ['DISCIPLINE', 'TECH_SUPPORT', 'MEDIA', 'SPONSORS', 'DECORATION', 'CORE_MEMBER', 'SUPERVISOR'] as StaffRole[]) {
    assert.deepEqual(exportViews(staff(r)), [], r)
  }
})
