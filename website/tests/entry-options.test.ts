import test from 'node:test'
import assert from 'node:assert/strict'
import { couponAllowedFor, couponFee, entryOptionsOf, pickOption } from '../src/lib/entry-options'

// Entry options (owner, 18 Oct 2026): BGMI Solo ₹99 (1 player, no coupons) / Squad ₹199 (1–4 players, coupons)
const BGMI = entryOptionsOf([
  { name: 'Solo', fee: 99, feeSuffix: ' / player', minTeamSize: 1, maxTeamSize: 1, couponsAllowed: false },
  { name: 'Squad', fee: 199, feeSuffix: ' / squad', minTeamSize: 1, maxTeamSize: 4, couponsAllowed: true },
])

test('options from the CMS: complete rows only', () => {
  assert.equal(BGMI.length, 2)
  assert.deepEqual(BGMI[1], { name: 'Squad', fee: 199, feeSuffix: ' / squad', minTeam: 1, maxTeam: 4, couponsAllowed: true })
  assert.deepEqual(entryOptionsOf([{ name: '', fee: 1, minTeamSize: 1, maxTeamSize: 1 }, { name: 'X', fee: -1, minTeamSize: 1, maxTeamSize: 1 }, { name: 'Y', fee: 5, minTeamSize: 3, maxTeamSize: 2 }]), [])
  assert.equal(entryOptionsOf([{ name: 'Z', fee: 0, minTeamSize: 1, maxTeamSize: 2 }])[0].couponsAllowed, true, 'coupons allowed unless unticked')
  assert.deepEqual(entryOptionsOf(undefined), [])
})

test('choice: exact option name only', () => {
  assert.equal(pickOption(BGMI, 'Squad')?.fee, 199)
  assert.equal(pickOption(BGMI, ' Solo ')?.fee, 99)
  assert.equal(pickOption(BGMI, 'squad'), null)
  assert.equal(pickOption(BGMI, ''), null)
})

test('coupons: never for Solo (CMS switch); unknown option refused; competitions without options unchanged', () => {
  assert.equal(couponAllowedFor(BGMI, 'Squad'), true)
  assert.equal(couponAllowedFor(BGMI, 'Solo'), false)
  assert.equal(couponAllowedFor(BGMI, ''), false, 'fail closed')
  assert.equal(couponAllowedFor(BGMI, 'Duo'), false, 'renamed / unknown option: refused')
  assert.equal(couponAllowedFor([], null), true, 'no options: as before')
})

test('offers count against an option that takes coupons', () => {
  assert.equal(couponFee(BGMI, 99), 199)
  assert.equal(couponFee([BGMI[0]], 99), null, 'no option takes coupons: no offer')
  assert.equal(couponFee([], 749), 749)
})
