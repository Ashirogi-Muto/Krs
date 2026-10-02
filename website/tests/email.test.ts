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

test('sending window 17:00-09:00 IST (wraps past midnight)', async () => {
  const { inSendWindow } = await import('../src/lib/email/outbox')
  const ist = (h: number, m = 0) => new Date(Date.UTC(2026, 9, 2, h, m) - 330 * 60_000) // IST wall time -> UTC
  const w = '17:00-09:00'
  assert.equal(inSendWindow(ist(17, 0), w), true)
  assert.equal(inSendWindow(ist(23, 30), w), true)
  assert.equal(inSendWindow(ist(2, 0), w), true)
  assert.equal(inSendWindow(ist(8, 59), w), true)
  assert.equal(inSendWindow(ist(9, 0), w), false)
  assert.equal(inSendWindow(ist(13, 0), w), false)
  assert.equal(inSendWindow(ist(16, 59), w), false)
  assert.equal(inSendWindow(ist(13, 0), 'always'), true)
  assert.equal(inSendWindow(ist(13, 0), '10:00-12:00'), false)
})

test('maySend: window, backlog override and daily limit', async () => {
  const { maySend } = await import('../src/lib/email/outbox')
  const day = new Date(Date.UTC(2026, 9, 2, 7, 30)) // 13:00 IST
  const night = new Date(Date.UTC(2026, 9, 2, 14, 30)) // 20:00 IST
  const base = { window: '17:00-09:00', backlogOverride: 150, dailyLimit: 450, sentLast24h: 0 }
  assert.equal(maySend({ ...base, now: night, due: 3 }).ok, true)
  assert.equal(maySend({ ...base, now: day, due: 3 }).ok, false)
  assert.equal(maySend({ ...base, now: day, due: 150 }).ok, true) // large backlog: send during the day too
  assert.equal(maySend({ ...base, now: night, due: 3, sentLast24h: 450 }).ok, false) // daily limit wins
  assert.equal(maySend({ ...base, now: night, due: 0 }).ok, false)
})
