import test from 'node:test'
import assert from 'node:assert/strict'
import {
  MAX_SUBMISSION_BYTES,
  checkUpload,
  cleanFilename,
  eligible,
  isHttpsUrl,
  realSubmissionType,
  roundOpen,
  signUploadToken,
  verifyUploadToken,
} from '../src/lib/submission-rules'

// Round submissions (owner, 8 Oct 2026): PPT/PPTX/PDF, hard 15 MB, team leader of an active team, until the deadline

test('only PPT, PPTX and PDF up to exactly 15 MB', () => {
  assert.equal(MAX_SUBMISSION_BYTES, 15 * 1024 * 1024)
  assert.deepEqual(checkUpload('Deck.PPTX', 1000), { ok: true, ext: 'pptx', contentType: 'application/vnd.openxmlformats-officedocument.presentationml.presentation' })
  assert.equal(checkUpload('idea.pdf', MAX_SUBMISSION_BYTES).ok, true, 'exactly 15 MB is allowed')
  assert.deepEqual(checkUpload('idea.pdf', MAX_SUBMISSION_BYTES + 1), { ok: false, reason: 'size' })
  for (const bad of ['deck.key', 'deck.pptx.exe', 'deck.html', 'deck', 'deck.svg', 'deck.zip'])
    assert.deepEqual(checkUpload(bad, 10), { ok: false, reason: 'type' }, bad)
  for (const size of [0, -1, 1.5, '100', null]) assert.equal(checkUpload('a.pdf', size).ok, false, String(size))
})

test("the stored file's real content must match its extension", () => {
  const zip = Buffer.from([0x50, 0x4b, 0x03, 0x04, 0, 0, 0, 0])
  assert.equal(realSubmissionType('pdf', Buffer.from('%PDF-1.7\n'), Buffer.alloc(0)), true)
  assert.equal(realSubmissionType('pdf', Buffer.from('<html>'), Buffer.alloc(0)), false)
  assert.equal(realSubmissionType('pptx', zip, Buffer.from('....ppt/presentation.xml....')), true)
  assert.equal(realSubmissionType('pptx', zip, Buffer.from('....word/document.xml....')), false, 'a .docx renamed to .pptx')
  assert.equal(realSubmissionType('ppt', Buffer.from([0xd0, 0xcf, 0x11, 0xe0, 0xa1, 0xb1, 0x1a, 0xe1]), Buffer.alloc(0)), true)
  assert.equal(realSubmissionType('ppt', Buffer.from('%PDF-1.7'), Buffer.alloc(0)), false)
  assert.equal(realSubmissionType('exe', Buffer.from('MZ'), Buffer.alloc(0)), false)
})

test('rounds: open between start and end (server time); only online submission types', () => {
  const r1 = { number: 1, startDate: '2026-08-31T18:30:00Z', endDate: '2026-10-19T18:29:59Z', submissionType: 'PROPOSAL' }
  assert.equal(roundOpen(r1, new Date('2026-10-19T18:29:59Z')), true, '23:59:59 IST on 19 Oct is still open')
  assert.equal(roundOpen(r1, new Date('2026-10-19T18:30:00Z')), false, 'midnight IST is closed')
  assert.equal(roundOpen(r1, new Date('2026-08-31T18:00:00Z')), false, 'before the start')
  assert.equal(roundOpen({ ...r1, submissionType: 'IN_PERSON_DEMO' }, new Date('2026-10-10T00:00:00Z')), false)
  assert.equal(roundOpen({ ...r1, endDate: null }, new Date('2026-10-10T00:00:00Z')), false, 'no deadline set = not open')
})

test('who may submit: active teams; round 2+ only when qualified in the previous round', () => {
  assert.deepEqual(eligible({ status: 'PENDING' }, 1), { ok: true }, 'payment not required')
  assert.deepEqual(eligible({ status: 'CONFIRMED' }, 1), { ok: true })
  assert.deepEqual(eligible({ status: 'CANCELLED' }, 1), { ok: false, reason: 'inactive' })
  assert.deepEqual(eligible({ status: 'PENDING' }, 2, { status: 'SUBMITTED' }), { ok: false, reason: 'notQualified' })
  assert.deepEqual(eligible({ status: 'PENDING' }, 2, null), { ok: false, reason: 'notQualified' })
  assert.deepEqual(eligible({ status: 'PENDING' }, 2, { status: 'QUALIFIED' }), { ok: true })
})

test('upload token: tamper-proof and expiring', () => {
  const t = { r: 7, n: 1, k: 'submissions/hackathon/round-1/AX26-HAC-ABC123/x.pptx', s: 1234, e: 'pptx', f: 'deck.pptx', iat: 1000, exp: 2000 }
  const token = signUploadToken(t, 'secret-1')
  assert.deepEqual(verifyUploadToken(token, 'secret-1', 1500), t)
  assert.equal(verifyUploadToken(token, 'secret-1', 2001), null, 'expired')
  assert.equal(verifyUploadToken(token, 'other-secret', 1500), null)
  const [body, mac] = token.split('.')
  const forged = Buffer.from(JSON.stringify({ ...t, s: 99_999_999 })).toString('base64url')
  assert.equal(verifyUploadToken(`${forged}.${mac}`, 'secret-1', 1500), null, 'changed size')
  assert.equal(verifyUploadToken(`${body}.`, 'secret-1', 1500), null)
  assert.equal(verifyUploadToken(42, 'secret-1', 1500), null)
})

test('file names and links typed by teams', () => {
  assert.equal(cleanFilename('../../etc/My Deck (final) é.pptx'), 'My Deck _final_ e.pptx')
  assert.equal(cleanFilename('a"b<script>.pdf'), 'a_b_script_.pdf')
  assert.equal(isHttpsUrl('https://github.com/team/repo'), true)
  for (const bad of ['http://github.com/x', 'javascript:alert(1)', 'github.com/x', '', 'https://']) assert.equal(isHttpsUrl(bad), false, bad)
})
