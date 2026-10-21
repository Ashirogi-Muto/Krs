import test from 'node:test'
import assert from 'node:assert/strict'
import { autoConfirms, paymentDone, readyToConfirm } from '../src/lib/auto-confirm'
import { ListQueryError, parseListQuery, searchWhere } from '../src/lib/list-query'

// Owner, 21 Oct 2026: auto-confirm when payment + IDs are verified; exports follow the Event registrations filters.

const P = { status: 'PENDING', paymentStatus: 'AWAITING_PAYMENT', idVerification: 'PENDING', schoolEntry: false }

test('auto-confirm: the save that makes payment and IDs both done confirms a pending team', () => {
  // ID approved after payment
  assert.equal(autoConfirms({ ...P, paymentStatus: 'PAID_VERIFIED' }, { ...P, paymentStatus: 'PAID_VERIFIED', idVerification: 'APPROVED' }), true)
  // payment verified after ID (e.g. Finance or payment matching)
  assert.equal(autoConfirms({ ...P, idVerification: 'APPROVED' }, { ...P, idVerification: 'APPROVED', paymentStatus: 'PAID_VERIFIED' }), true)
  // both in one save
  assert.equal(autoConfirms(P, { ...P, idVerification: 'APPROVED', paymentStatus: 'PAID_VERIFIED' }), true)
  // free school entry: ID approval is enough
  assert.equal(autoConfirms({ ...P, schoolEntry: true, paymentStatus: 'NOT_REQUIRED' }, { ...P, schoolEntry: true, paymentStatus: 'NOT_REQUIRED', idVerification: 'APPROVED' }), true)
})

test('auto-confirm: not when one check is missing, not for rejected / cancelled / confirmed teams, not again after staff reset it', () => {
  assert.equal(autoConfirms(P, { ...P, idVerification: 'APPROVED' }), false, 'payment not verified')
  assert.equal(autoConfirms(P, { ...P, paymentStatus: 'PAID_VERIFIED' }), false, 'IDs not approved')
  assert.equal(autoConfirms(P, { ...P, idVerification: 'APPROVED', paymentStatus: 'RECEIPT_UPLOADED' }), false)
  assert.equal(autoConfirms(P, { ...P, idVerification: 'APPROVED', paymentStatus: 'NOT_REQUIRED' }), false, 'nothing to pay only counts for school entries')
  for (const status of ['REJECTED', 'CANCELLED', 'CONFIRMED']) assert.equal(autoConfirms(P, { ...P, status, idVerification: 'APPROVED', paymentStatus: 'PAID_VERIFIED' }), false, status)
  const done = { ...P, idVerification: 'APPROVED', paymentStatus: 'PAID_VERIFIED' }
  // staff put a verified team back to Pending (or edit its notes): no automatic re-confirmation
  assert.equal(autoConfirms({ ...done, status: 'CONFIRMED' }, done), false)
  assert.equal(autoConfirms(done, done), false)
  assert.equal(paymentDone({ paymentStatus: 'PAID_VERIFIED' }), true)
  assert.equal(readyToConfirm({ idVerification: 'REJECTED', paymentStatus: 'PAID_VERIFIED' }), false)
})

test('list query: Payload bracket filters, search and sort', () => {
  const q = parseListQuery('?limit=10&page=2&sort=-createdAt&search=%20robo%20&where[or][0][and][0][status][equals]=PENDING&where[or][0][and][1][event][in][0]=2&where[or][0][and][1][event][in][1]=3')
  assert.deepEqual(q, { where: { or: [{ and: [{ status: { equals: 'PENDING' } }, { event: { in: ['2', '3'] } }] }] }, search: 'robo', sort: '-createdAt' })
  assert.deepEqual(parseListQuery(''), { where: null, search: '', sort: null })
  assert.equal(parseListQuery('sort=createdAt;drop').sort, null, 'odd sort ignored')
  assert.deepEqual(searchWhere('ax26', ['teamName', 'registrationCode']), { or: [{ teamName: { like: 'ax26' } }, { registrationCode: { like: 'ax26' } }] })
  assert.equal(searchWhere('', ['teamName']), null)
})

test('list query: malformed or hostile input refused', () => {
  for (const bad of [
    'where[__proto__][polluted]=1',
    'where[constructor][prototype][x]=1',
    'where[status]x[equals]=1',
    'where[]=1',
    'where[a][b][c][d][e][f][g][h][i][j][k][l][m]=1',
    'where[status]=1&where[status][equals]=2',
    'where[x]=' + 'a'.repeat(9000),
    Array.from({ length: 201 }, (_, i) => `where[or][${i}][status][equals]=A`).join('&'),
  ]) {
    assert.throws(() => parseListQuery(bad), ListQueryError, bad.slice(0, 60))
  }
  assert.equal(({} as any).polluted, undefined)
})
