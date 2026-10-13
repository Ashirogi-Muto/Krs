import test from 'node:test'
import assert from 'node:assert/strict'
import { hideComingSoonDetails } from '../src/payload/collections/Events'
import { sniffUpload } from '../src/lib/id-files'
import { requireRealFileType } from '../src/payload/hooks/realFileType'
import { deletedLabel } from '../src/payload/hooks/auditDelete'
import { presetRoles } from './helpers/presets'

// Small gaps from the 7 Oct audit, fixed 8 Oct 2026 (L7, CMS upload types, delete audit)

const soon = { id: 9, slug: 'new-cup', title: 'New Cup', comingSoon: true, comingSoonMessage: 'Soon!', registrationFee: 499, minTeamSize: 2, faqs: [{ question: 'q' }], prizePool: 10000, startDate: '2026-11-01' }

test('L7: the public API hides coming-soon details; editors and server code see everything', () => {
  const pub = hideComingSoonDetails({ doc: soon, req: { payloadAPI: 'REST', user: null } })
  assert.equal(pub.registrationFee, null)
  assert.equal(pub.minTeamSize, null)
  assert.deepEqual(pub.faqs, [])
  assert.equal(pub.description, 'Soon!')
  assert.equal(pub.title, 'New Cup')
  assert.equal(pub.startDate, '2026-11-01')
  assert.equal(pub.prizePool, 10000, 'the site shows the prize pool on coming-soon pages too')
  assert.equal(hideComingSoonDetails({ doc: soon, req: { payloadAPI: 'REST', user: { role: 'PARTICIPANT' } } }).registrationFee, null)
  assert.equal(hideComingSoonDetails({ doc: soon, req: { payloadAPI: 'REST', user: { role: 'STAFF', accessRoles: presetRoles('MEDIA') } } }).registrationFee, 499)
  assert.equal(hideComingSoonDetails({ doc: soon, req: { payloadAPI: 'local' } }).registrationFee, 499)
  const live = { ...soon, comingSoon: false }
  assert.equal(hideComingSoonDetails({ doc: live, req: { payloadAPI: 'REST' } }), live)
})

test('CMS uploads: the real type decides (renamed HTML/SVG refused)', async () => {
  assert.equal(sniffUpload(Buffer.from('GIF89a......')), 'image/gif')
  assert.equal(sniffUpload(Buffer.concat([Buffer.from([0, 0, 0, 28]), Buffer.from('ftypavif')])), 'image/avif')
  assert.equal(sniffUpload(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])), 'image/png')
  assert.equal(sniffUpload(Buffer.from('<svg xmlns="http://www.w3.org/2000/svg"><script>')), null)
  assert.equal(sniffUpload(Buffer.from('<!doctype html><script>alert(1)</script>')), null)
  const hook = requireRealFileType(['image/png', 'application/pdf'])
  const run = (data: Buffer, mimetype: string) => {
    const req: any = { file: { data, mimetype, name: 'x' } }
    return Promise.resolve(hook({ req, data: {}, operation: 'create' } as any)).then(() => req.file.mimetype)
  }
  assert.equal(await run(Buffer.from('%PDF-1.7 ...'), 'image/png'), 'application/pdf', 'stored type = detected type')
  await assert.rejects(run(Buffer.from('<html><script>alert(1)</script>'), 'image/png'), /not allowed/)
  await assert.rejects(run(Buffer.from('GIF89a......'), 'image/gif'), /not allowed/, 'a real type outside the list')
  assert.deepEqual(await hook({ req: {}, data: { alt: 'x' }, operation: 'update' } as any), { alt: 'x' }, 'edits without a file pass')
})

test('delete audit: a short non-personal label', () => {
  assert.equal(deletedLabel('event-registrations', { registrationCode: 'AX26-SOC-ABC123', leaderEmail: 'a@b.c' }), 'AX26-SOC-ABC123')
  assert.equal(deletedLabel('pages', { path: '/old', title: 'Old' }), '/old')
  assert.equal(deletedLabel('users', { name: 'Asha', email: 'a@b.c' }), '', 'no names or emails of deleted accounts')
  assert.equal(deletedLabel('media', { filename: 'line1\nline2.png' }), 'line1 line2.png', 'no line breaks in the log')
})
