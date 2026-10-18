import test from 'node:test'
import assert from 'node:assert/strict'
import { confirmsOnIdApproval, isSchoolYear, schoolEntryChange, schoolEntryFields } from '../src/lib/school-entry'
import { eligible, receiptNeeded } from '../src/lib/submission-rules'
import { FORM_TEXT_GROUPS } from '../src/lib/form-texts-defaults'

// Free registration for school students (owner, 18 Oct 2026): leader in Class 5–12, free, confirmed on ID approval

test('school classes: Class 5–12 only', () => {
  for (const y of ['C5', 'C8', 'C12']) assert.equal(isSchoolYear(y), true, y)
  for (const y of ['Y1', 'Y4', 'C4', 'C13', '', null, 5, 'c5']) assert.equal(isSchoolYear(y), false, String(y))
})

test('a new school entry has nothing to pay and is never "awaiting payment"', () => {
  assert.deepEqual(schoolEntryFields(), { schoolEntry: true, amountDue: 0, paymentStatus: 'NOT_REQUIRED' })
})

test('free teams are never asked for a payment receipt (they can submit rounds and be checked in)', () => {
  const free = { status: 'PENDING', paymentStatus: 'NOT_REQUIRED', receiptUploadedAt: null }
  assert.equal(receiptNeeded(free), false)
  assert.deepEqual(eligible(free, 1), { ok: true })
  assert.equal(receiptNeeded({ status: 'PENDING', paymentStatus: 'AWAITING_PAYMENT', receiptUploadedAt: null }), true, 'paid teams unchanged')
})

test('staff tick / untick "School entry": the payment fields follow', () => {
  // untick after a failed school ID check → the normal fee is due again
  assert.deepEqual(schoolEntryChange({ schoolEntry: true, paymentStatus: 'NOT_REQUIRED' }, { schoolEntry: false }, 749), { amountDue: 749, paymentStatus: 'AWAITING_PAYMENT' })
  // tick on an unpaid team → free, coupon dropped
  assert.deepEqual(schoolEntryChange({ schoolEntry: false, paymentStatus: 'AWAITING_PAYMENT' }, { schoolEntry: true }, 749), { amountDue: 0, paymentStatus: 'NOT_REQUIRED', coupon: null, couponCode: null, discountAmount: null, originalFee: null })
  // a verified payment is never touched; no change = nothing
  assert.equal(schoolEntryChange({ schoolEntry: false, paymentStatus: 'PAID_VERIFIED' }, { schoolEntry: true }, 749), null)
  assert.equal(schoolEntryChange({ schoolEntry: true, paymentStatus: 'NOT_REQUIRED' }, { schoolEntry: true }, 749), null)
  assert.equal(schoolEntryChange({ schoolEntry: true, paymentStatus: 'NOT_REQUIRED' }, {}, 749), null)
})

test('approving the school ID confirms a pending free team, and nothing else does', () => {
  const free = { schoolEntry: true, paymentStatus: 'NOT_REQUIRED', status: 'PENDING' }
  assert.equal(confirmsOnIdApproval({ ...free, idVerification: 'PENDING' }, { ...free, idVerification: 'APPROVED' }), true)
  assert.equal(confirmsOnIdApproval({ ...free, idVerification: 'APPROVED' }, { ...free, idVerification: 'APPROVED' }), false, 'already approved')
  assert.equal(confirmsOnIdApproval({ ...free, idVerification: 'PENDING' }, { ...free, idVerification: 'REJECTED' }), false)
  assert.equal(confirmsOnIdApproval({ ...free, idVerification: 'PENDING' }, { ...free, status: 'REJECTED', idVerification: 'APPROVED' }), false, 'rejected team stays rejected')
  const paid = { schoolEntry: false, paymentStatus: 'AWAITING_PAYMENT', status: 'PENDING' }
  assert.equal(confirmsOnIdApproval({ ...paid, idVerification: 'PENDING' }, { ...paid, idVerification: 'APPROVED' }), false, 'paid teams: staff confirm after payment')
})

test('"Labels & messages" (form_texts) must not grow: its database row is at the Postgres 8 KB limit', () => {
  // 18 Oct 2026: 14 more columns made every save of that CMS screen fail ("row is too big: size 8248, maximum size
  // 8160"). Each column costs ~20 bytes inline however short its text. New wording goes into another global.
  const n = FORM_TEXT_GROUPS.reduce((a, g) => a + g.fields.length, 0)
  assert.ok(n <= 482, `form_texts has ${n} fields (max 482): put new wording in another global, e.g. School entry (free)`)
})
