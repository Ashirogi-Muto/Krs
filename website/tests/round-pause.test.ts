import test from 'node:test'
import assert from 'node:assert/strict'
import { closeFor, FINISH_GRACE_MS, pauseWindow, roundOpen, shownDeadline, type Round } from '../src/lib/submission-rules'
import { submittableRounds } from '../src/lib/submissions'

/**
 * Hackathon Round 1 (owner, 9 Oct 2026): closes 15 Oct 23:59:59 IST, reopens a few hours later (time set in the CMS),
 * really ends 19 Oct 23:59:59 IST. Shown deadline: 15 Oct until the reopening, then 19 Oct.
 */
const IST = (s: string) => new Date(`${s}+05:30`)
const round: Round = {
  number: 1,
  submissionType: 'PROPOSAL',
  startDate: '2026-09-01T00:00:00+05:30',
  endDate: IST('2026-10-19T23:59:59').toISOString(),
  pauseFrom: IST('2026-10-15T23:59:59').toISOString(),
  pauseUntil: IST('2026-10-16T03:00:00').toISOString(),
}

test('open before the early close, closed in the break, open again until the real end', () => {
  assert.equal(roundOpen(round, IST('2026-10-15T23:59:58')), true)
  assert.equal(roundOpen(round, IST('2026-10-15T23:59:59')), false)
  assert.equal(roundOpen(round, IST('2026-10-16T02:59:59')), false)
  assert.equal(roundOpen(round, IST('2026-10-16T03:00:00')), true)
  assert.equal(roundOpen(round, IST('2026-10-19T23:59:59')), true)
  assert.equal(roundOpen(round, IST('2026-10-20T00:00:00')), false)
})

test('shown deadline: 15 Oct until the reopening, then 19 Oct', () => {
  assert.equal(shownDeadline(round, IST('2026-10-10T12:00:00')), round.pauseFrom)
  assert.equal(shownDeadline(round, IST('2026-10-16T01:00:00')), round.pauseFrom)
  assert.equal(shownDeadline(round, IST('2026-10-16T03:00:00')), round.endDate)
  assert.equal(shownDeadline({ ...round, pauseFrom: null, pauseUntil: null }, IST('2026-10-10T12:00:00')), round.endDate)
})

test('an upload started just before the early close may finish within the grace; one started after the reopening uses the end', () => {
  const started = IST('2026-10-15T23:58:00').getTime()
  assert.equal(closeFor(round, started), new Date(round.pauseFrom!).getTime())
  assert.ok(IST('2026-10-16T00:10:00').getTime() <= closeFor(round, started) + FINISH_GRACE_MS)
  assert.ok(IST('2026-10-16T00:20:00').getTime() > closeFor(round, started) + FINISH_GRACE_MS)
  assert.equal(closeFor(round, IST('2026-10-16T03:30:00').getTime()), new Date(round.endDate!).getTime())
})

test('a half-filled or impossible break is ignored (fails safe: the normal round applies)', () => {
  assert.equal(pauseWindow({ ...round, pauseUntil: null }), null)
  assert.equal(pauseWindow({ ...round, pauseUntil: round.pauseFrom }), null) // reopens = closes
  assert.equal(pauseWindow({ ...round, pauseFrom: round.pauseUntil, pauseUntil: round.pauseFrom }), null) // reversed
  assert.equal(pauseWindow({ ...round, pauseFrom: IST('2026-10-20T10:00:00').toISOString(), pauseUntil: IST('2026-10-20T12:00:00').toISOString() }), null) // after the end
  assert.equal(roundOpen({ ...round, pauseUntil: null }, IST('2026-10-16T01:00:00')), true)
})

test('the portal and upload API get the break too (rounds as loaded from the CMS)', () => {
  const [r] = submittableRounds({ rounds: [{ ...round, name: 'Round 1', number: 1 }, { number: 2, submissionType: 'IN_PERSON_DEMO' }] })
  assert.equal(r.pauseFrom, round.pauseFrom)
  assert.equal(r.pauseUntil, round.pauseUntil)
  assert.equal(roundOpen(r, IST('2026-10-16T01:00:00')), false)
})
