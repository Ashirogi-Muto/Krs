import test from 'node:test'
import assert from 'node:assert/strict'
import { ORPHAN_AGE_MS, orphanKeys } from '../src/lib/submission-sweep'

/** Leftover submission files (9 Oct 2026): only unreferenced files under submissions/ older than 2 hours are deleted. */
test('leftover files: unreferenced and old enough, under submissions/ only', () => {
  const now = Date.parse('2026-10-15T12:00:00Z')
  const old = now - ORPHAN_AGE_MS - 1
  const objects = [
    { key: 'submissions/hackathon/round-1/AX26-HAC-AAAAAA/1.pdf', modified: old }, // saved: kept
    { key: 'submissions/hackathon/round-1/AX26-HAC-AAAAAA/2.pdf', modified: old }, // never saved: deleted
    { key: 'submissions/hackathon/round-1/AX26-HAC-BBBBBB/3.pptx', modified: now - 10 * 60_000 }, // upload in progress: kept
    { key: 'submissions/hackathon/round-1/AX26-HAC-BBBBBB/4.pptx', modified: now - ORPHAN_AGE_MS }, // exactly 2 h: deleted
    { key: '_owner-check/KRS-R2-check.pptx', modified: old }, // outside submissions/: never touched
  ]
  const referenced = new Set(['submissions/hackathon/round-1/AX26-HAC-AAAAAA/1.pdf'])
  assert.deepEqual(orphanKeys(objects, referenced, now), [
    'submissions/hackathon/round-1/AX26-HAC-AAAAAA/2.pdf',
    'submissions/hackathon/round-1/AX26-HAC-BBBBBB/4.pptx',
  ])
  // The age threshold covers the upload token (30 min) and the deadline grace (15 min) with room to spare
  assert.ok(ORPHAN_AGE_MS >= 45 * 60_000 * 2)
  assert.deepEqual(orphanKeys([], referenced, now), [])
})
