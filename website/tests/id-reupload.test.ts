import test from 'node:test'
import assert from 'node:assert/strict'
import { canReupload, deadlineEndIST, formatDeadline, parseDeadline } from '../src/lib/id-reupload-rules'
import { idReuploadRequest, registrationCancelledNoId } from '../src/lib/email/templates'
import { sniffMime } from '../src/lib/id-files'
import { EventRegistrations } from '../src/payload/collections/Registrations'

// Student ID re-upload (owner, 8 Oct 2026)

test('deadline = end of the chosen day in India; today up to 60 days ahead', () => {
  assert.equal(deadlineEndIST('2026-10-12')!.toISOString(), '2026-10-12T18:29:59.000Z')
  for (const bad of ['2026-02-30', '2026-13-01', '12-10-2026', '2026-10-12T00:00', '', 'tomorrow']) assert.equal(deadlineEndIST(bad), null, bad)
  const now = new Date('2026-10-08T10:00:00Z') // 15:30 IST
  assert.ok(parseDeadline('2026-10-08', now), 'today (until midnight IST) is allowed')
  assert.equal(parseDeadline('2026-10-07', now), null, 'the past is refused')
  assert.ok(parseDeadline('2026-12-07', now))
  assert.equal(parseDeadline('2026-12-09', now), null, 'more than 60 days ahead is refused')
  assert.equal(parseDeadline(20261012 as any, now), null)
  assert.match(formatDeadline('2026-10-12T18:29:59.000Z'), /12 October 2026.*11:59/)
})

test('only rejected, active teams before their deadline may upload new cards', () => {
  const now = new Date('2026-10-10T00:00:00Z')
  assert.equal(canReupload({ idVerification: 'REJECTED', status: 'PENDING' }, now), true, 'rejected, no deadline yet')
  assert.equal(canReupload({ idVerification: 'REJECTED', status: 'CONFIRMED', idReuploadDeadline: '2026-10-12T18:29:59Z' }, now), true)
  assert.equal(canReupload({ idVerification: 'REJECTED', status: 'PENDING', idReuploadDeadline: '2026-10-09T18:29:59Z' }, now), false, 'deadline passed')
  for (const v of ['PENDING', 'APPROVED']) assert.equal(canReupload({ idVerification: v, status: 'PENDING' }, now), false, v)
  for (const s of ['CANCELLED', 'REJECTED']) assert.equal(canReupload({ idVerification: 'REJECTED', status: s }, now), false, s)
})

test('emails: team data and the reason are escaped; deadline and upload link included', () => {
  const d = { name: 'Asha <b>', team: 'Bots & "Co"', code: 'AX26-SOC-ABC123', event: 'AURIX Robo Soccer', reason: 'Member 2: <script>alert(1)</script> fee receipt', deadline: '12 October 2026, 11:59 pm' }
  const r = idReuploadRequest(d)
  assert.doesNotMatch(r.html, /<script>|<b>/)
  assert.match(r.html, /&lt;script&gt;/)
  assert.match(r.html, /\/aurix\/update-id/)
  assert.match(r.html, /12 October 2026, 11:59 pm/)
  assert.match(r.text, /Member 2: <script>alert\(1\)<\/script> fee receipt/, 'plain text keeps the text as typed')
  assert.match(r.subject, /AX26-SOC-ABC123/)
  assert.doesNotMatch(idReuploadRequest({ ...d, reason: '' }).html, /Reason:/, 'no empty reason line')
  const c = registrationCancelledNoId(d)
  assert.match(c.subject, /cancelled/i)
  assert.match(c.html, /12 October 2026/)
  assert.doesNotMatch(c.html, /<b>/)
})

test('rejecting again allows a new request; leaving "Rejected" stops the auto-cancel', async () => {
  const hook = EventRegistrations.hooks!.beforeChange![0] as any
  const run = (before: string, data: any) => hook({ data: { ...data }, originalDoc: { idVerification: before }, operation: 'update' })
  const again = await run('PENDING', { idVerification: 'REJECTED' })
  assert.equal(again.idReuploadRequestedAt, null)
  assert.equal(again.idReuploadDeadline, null)
  const approved = await run('REJECTED', { idVerification: 'APPROVED' })
  assert.equal(approved.idReuploadDeadline, null)
  assert.equal('idReuploadRequestedAt' in approved, false)
  const other = await run('REJECTED', { teamName: 'x' })
  assert.deepEqual(other, { teamName: 'x' }, 'other edits untouched')
})

test('ID files: real type from the first bytes', () => {
  assert.equal(sniffMime(Buffer.from([0xff, 0xd8, 0xff, 0xe0])), 'image/jpeg')
  assert.equal(sniffMime(Buffer.from('%PDF-1.7')), 'application/pdf')
  assert.equal(sniffMime(Buffer.from('not an image')), null)
})
