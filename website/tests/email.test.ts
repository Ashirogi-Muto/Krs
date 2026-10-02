import test from 'node:test'
import assert from 'node:assert/strict'
import { registrationConfirmation } from '../src/lib/email/templates'
import { MAX_ATTEMPTS, retryDelayMinutes } from '../src/lib/email/outbox'

const data = {
  registrationCode: 'AX26-SOC-ABC123',
  teamName: 'Bots <script>alert(1)</script>',
  leaderName: 'Asha',
  leaderEmail: 'asha@college.edu',
  leaderPhone: '9876543210',
  college: 'IILM University',
  members: [
    { name: 'Asha', college: 'IILM University' },
    { name: 'Ravi', college: 'IILM University' },
  ],
  event: { title: 'Robo Soccer', slug: 'robo-soccer', startDate: '2026-10-27T03:30:00.000Z', endDate: '2026-10-28T12:00:00.000Z', venue: 'IILM University' },
  amountDue: 499,
  paymentUrl: 'https://pages.razorpay.com/x?email=asha%40college.edu',
}

test('confirmation email contains the registration details and escapes user input', () => {
  const { subject, html, text } = registrationConfirmation(data)
  assert.match(subject, /Robo Soccer — AX26-SOC-ABC123/)
  assert.ok(html.includes('AX26-SOC-ABC123'))
  assert.ok(!html.includes('<script>'), 'team name must be escaped')
  assert.ok(html.includes('&lt;script&gt;'))
  assert.ok(html.includes('Ravi'))
  assert.ok(html.includes('₹499'))
  assert.ok(html.includes('/aurix/status'))
  assert.ok(text.includes('Registration code: AX26-SOC-ABC123'))
  assert.ok(text.includes('2. Ravi'))
})

test('no payment block when there is no fee', () => {
  const { html, text } = registrationConfirmation({ ...data, amountDue: null, paymentUrl: null })
  assert.ok(!html.includes('pages.razorpay.com'))
  assert.ok(!text.includes('If you have not paid yet'))
})

test('retry schedule: 1, 5, 15, 60 minutes, then give up', () => {
  assert.deepEqual([1, 2, 3, 4].map(retryDelayMinutes), [1, 5, 15, 60])
  assert.equal(MAX_ATTEMPTS, 5)
})

test('retention: data is due 30 days after the event ends (or starts, when there is no end date)', async () => {
  const { deleteAfter, RETENTION_DAYS } = await import('../src/lib/retention')
  assert.equal(RETENTION_DAYS, 30)
  assert.equal(deleteAfter({ startDate: '2026-10-27T03:30:00.000Z', endDate: '2026-10-28T12:30:00.000Z' })?.toISOString(), '2026-11-27T12:30:00.000Z')
  assert.equal(deleteAfter({ startDate: '2026-10-27T03:30:00.000Z' })?.toISOString(), '2026-11-26T03:30:00.000Z')
  assert.equal(deleteAfter({}), null)
})
