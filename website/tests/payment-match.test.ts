import test from 'node:test'
import assert from 'node:assert/strict'
import { guessColumns, matchPayments, normPhone, parseAmount, parseCsv, type RegForMatch } from '../src/lib/payments/match'

const reg = (id: number, over: Partial<RegForMatch> = {}): RegForMatch => ({
  id,
  code: `AX26-SOC-${id}`,
  team: `Team ${id}`,
  leaderEmail: `lead${id}@college.edu`,
  leaderPhone: `98765432${String(id).padStart(2, '0')}`,
  eventLabel: 'Robo - Soccer',
  eventTitle: 'Robo Soccer',
  amountDue: 499,
  paymentStatus: 'AWAITING_PAYMENT',
  paymentReference: null,
  ...over,
})
const row = (over: Record<string, any> = {}) => ({
  paymentId: 'pay_1',
  email: 'LEAD1@college.edu ',
  phone: '+91 98765-43201',
  amount: 499,
  event: 'Robo - Soccer',
  status: 'captured',
  ...over,
})

test('normalisers', () => {
  assert.equal(normPhone('+91 98765-43201'), '9876543201')
  assert.equal(normPhone('09876543201'), '9876543201')
  assert.equal(parseAmount('₹ 1,499.00'), 1499)
  assert.equal(parseAmount('49900', true), 499)
  assert.equal(parseAmount(''), null)
})

test('exact match on email + phone + event + amount', () => {
  const [r] = matchPayments([row()], [reg(1), reg(2)])
  assert.equal(r.kind, 'MATCH')
  assert.equal(r.reg?.id, 1)
})

test('event label compare ignores case, spaces and trailing space', () => {
  const [r] = matchPayments([row({ event: 'robo  soccer ' })], [reg(1, { eventLabel: 'Robo - Soccer ' })])
  assert.equal(r.kind, 'MATCH')
})

test('amount or event mismatch goes to CHECK with reasons', () => {
  const [a] = matchPayments([row({ amount: 399 })], [reg(1)])
  assert.equal(a.kind, 'CHECK')
  assert.match(a.reasons.join(' '), /amount/)
  const [b] = matchPayments([row({ event: 'Robo - Race' })], [reg(1)])
  assert.equal(b.kind, 'CHECK')
})

test('phone matches but email differs -> CHECK', () => {
  const [r] = matchPayments([row({ email: 'other@x.com' })], [reg(1)])
  assert.equal(r.kind, 'CHECK')
  assert.deepEqual(r.reasons, ['email differs'])
})

test('already recorded, duplicates, failed payments, unknown payers', () => {
  const regs = [reg(1, { paymentReference: 'pay_1', paymentStatus: 'PAID_VERIFIED' }), reg(2)]
  const res = matchPayments(
    [
      row(),
      row({ paymentId: 'pay_9', email: 'lead1@college.edu' }), // second payment for an already-paid team
      row({ paymentId: 'pay_2', email: 'lead2@college.edu', phone: '9876543202' }),
      row({ paymentId: 'pay_2', email: 'lead2@college.edu', phone: '9876543202' }),
      row({ paymentId: 'pay_3', status: 'failed' }),
      row({ paymentId: 'pay_4', email: 'x@y.z', phone: '1111111111' }),
    ],
    regs
  )
  assert.deepEqual(
    res.map((r) => r.kind),
    ['ALREADY_RECORDED', 'DUPLICATE', 'MATCH', 'DUPLICATE', 'NOT_PAID', 'NO_MATCH']
  )
})

test('one payment cannot be matched to two registrations', () => {
  const res = matchPayments([row(), row({ paymentId: 'pay_2' })], [reg(1)])
  assert.deepEqual(res.map((r) => r.kind), ['MATCH', 'DUPLICATE'])
})

test('CSV parsing and column guessing', () => {
  const rows = parseCsv('﻿Payment ID,Email,Contact,Amount,Select Event,Status,Created At\r\n"pay_1","a@b.c","+919876543210","₹ 499","Robo - Soccer ",captured,"2 Oct, 10:00"\r\n')
  assert.equal(rows.length, 2)
  assert.equal(rows[1][4], 'Robo - Soccer ')
  assert.equal(rows[1][6], '2 Oct, 10:00')
  const g = guessColumns(rows[0])
  assert.equal(g.paymentId, 'Payment ID')
  assert.equal(g.email, 'Email')
  assert.equal(g.phone, 'Contact')
  assert.equal(g.amount, 'Amount')
  assert.equal(g.event, 'Select Event')
  assert.equal(g.status, 'Status')
  assert.equal(g.paidAt, 'Created At')
})
