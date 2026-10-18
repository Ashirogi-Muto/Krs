import test from 'node:test'
import assert from 'node:assert/strict'
import { SEED_AURIX_EVENTS } from '../src/lib/data/seed-events'
import { withDirectEntry } from '../src/lib/direct-entry'
import { SUBMITTABLE } from '../src/lib/submission-rules'

// Hackathon direct entry (owner, 18 Oct 2026): no screening round on the page, other events untouched
const hack: any = SEED_AURIX_EVENTS.find((e) => e.slug === 'hackathon')

test('direct entry: the Hackathon drops the screening round, renumbers the final and removes its rules', () => {
  const e: any = withDirectEntry(hack)
  assert.equal(e.rounds.length, 1)
  assert.match(e.rounds[0].name, /^Round 1 — 12-Hour Offline Hackathon/)
  assert.equal(e.rounds.some((r: any) => SUBMITTABLE.includes(String(r.submissionType)) && r.endDate && /screening/i.test(r.name)), false)
  assert.equal(e.rulesSections.some((s: any) => /selection process/i.test(s.title)), false)
  const text = JSON.stringify([e.rounds, e.rulesSections, e.schedule, e.faqs])
  assert.doesNotMatch(text, /screening/i)
  assert.doesNotMatch(text, /shortlisted/i)
})

test('direct entry: other events and the original record are left as they are', () => {
  const soccer: any = SEED_AURIX_EVENTS.find((e) => e.slug === 'robo-soccer')
  assert.equal(withDirectEntry(soccer), soccer)
  assert.equal(hack.rounds.length, 2, 'the source data is not changed')
})
