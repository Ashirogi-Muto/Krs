import test from 'node:test'
import assert from 'node:assert/strict'
import {
  PREVIEW_COLLECTIONS,
  PREVIEW_GLOBALS,
  canPreviewAnything,
  canPreviewTarget,
  isSafeSitePath,
  parsePreviewTarget,
  previewUrl,
} from '../src/lib/preview-targets'
import { Pages } from '../src/payload/collections/Pages'
import { presetRoles } from './helpers/presets'

// Live preview, Phase 1 (docs/LIVE_PREVIEW_PLAN.md, approved 8 Oct 2026)

const q = (s: string) => new URLSearchParams(s)
const admin = { id: 1, role: 'ADMIN' }
const media = { id: 2, role: 'STAFF', accessRoles: presetRoles('MEDIA') }
const eventHead = { id: 3, role: 'STAFF', accessRoles: presetRoles('EVENT_HEAD') }
const finance = { id: 4, role: 'STAFF', accessRoles: presetRoles('FINANCE') }
const participant = { id: 5, role: 'PARTICIPANT' }
const judge = { id: 6, role: 'JUDGE' }

test('preview target: only known screens and integer ids', () => {
  assert.deepEqual(parsePreviewTarget(q('c=pages&id=18')), { kind: 'collection', slug: 'pages', id: 18 })
  assert.deepEqual(parsePreviewTarget(q('g=form-texts')), { kind: 'global', slug: 'form-texts' })
  for (const bad of ['', 'c=users&id=1', 'c=pages', 'c=pages&id=0', 'c=pages&id=-1', 'c=pages&id=1.5', 'c=pages&id=1e3', 'c=pages&id=18&g=navigation',
    'g=staff-texts', 'g=portal-texts', 'g=form-texts&id=1', 'c=__proto__&id=1', 'g=constructor', 'c=pages&id=99999999999'])
    assert.equal(parsePreviewTarget(q(bad)), null, bad)
})

test('preview access: CMS editors of that screen only (participants, judges and other staff refused)', () => {
  const pages = parsePreviewTarget(q('c=pages&id=1'))!
  const events = parsePreviewTarget(q('c=events&id=1'))!
  const labels = parsePreviewTarget(q('g=event-page-labels'))!
  assert.equal(canPreviewTarget(admin, pages), true)
  assert.equal(canPreviewTarget(media, pages), true)
  assert.equal(canPreviewTarget(eventHead, pages), false, 'Event Head does not edit website pages')
  assert.equal(canPreviewTarget(eventHead, events), true)
  assert.equal(canPreviewTarget(eventHead, labels), true)
  for (const u of [null, undefined, participant, judge, finance]) {
    assert.equal(canPreviewTarget(u, pages), false)
    assert.equal(canPreviewTarget(u, events), false)
    assert.equal(canPreviewAnything(u), false, 'no draft/hidden content for them even with the draft cookie')
  }
  assert.equal(canPreviewAnything(media), true)
})

test('preview redirect target is always a same-site path', () => {
  for (const ok of ['/', '/team', '/aurix/robo-soccer', '/learning/esp32-motor-control', '/a_b/c-1']) assert.equal(isSafeSitePath(ok), true, ok)
  for (const bad of ['', 'team', '//evil.example', '/\\evil.example', 'https://evil.example', '/team?x=1', '/team#x', '/a//b', '/a/', '/../etc', '/a b', null, 42, `/${'a'.repeat(250)}`])
    assert.equal(isSafeSitePath(bad), false, String(bad))
  // Paths come from the document, never the request
  assert.equal(PREVIEW_COLLECTIONS.events.path({ slug: 'robo-soccer' }), '/aurix/robo-soccer')
  assert.equal(PREVIEW_COLLECTIONS.projects.path({ slug: '' }), null)
  assert.equal(PREVIEW_COLLECTIONS.pages.path({ path: '/join' }), '/join')
  for (const g of Object.values(PREVIEW_GLOBALS)) assert.equal(isSafeSitePath(g.path), true)
})

test('CMS preview panel URL: same site, no secret, hidden for unsaved documents', () => {
  const site = (process.env.NEXT_PUBLIC_SITE_URL || 'https://kalamroboticssociety.com').replace(/\/$/, '')
  assert.equal(previewUrl({ collection: 'pages', id: 18 }), `${site}/api/preview?c=pages&id=18`)
  assert.equal(previewUrl({ global: 'navigation' }), `${site}/api/preview?g=navigation`)
  assert.equal(previewUrl({ collection: 'pages', id: undefined }), null)
  assert.equal(previewUrl({ collection: 'users', id: 1 }), null)
  assert.equal(previewUrl({ global: 'staff-texts' }), null)
})

test('Pages: drafts + autosave, and the public never reads drafts or versions', async () => {
  assert.deepEqual((Pages.versions as any).drafts.autosave, { interval: 2000 })
  assert.equal((Pages.versions as any).maxPerDoc, 25)
  const read = Pages.access!.read as any
  const where = read({ req: { user: null } })
  assert.deepEqual(where, { and: [{ published: { equals: true } }, { _status: { equals: 'published' } }] })
  assert.deepEqual(read({ req: { user: participant } }), where)
  assert.equal(read({ req: { user: media } }), true)
  const readVersions = Pages.access!.readVersions as any
  for (const u of [null, participant, judge, finance, eventHead]) assert.equal(readVersions({ req: { user: u } }), false)
  assert.equal(readVersions({ req: { user: media } }), true)
})

test('framing stays limited to our own origin (live preview needs nothing more)', async () => {
  const { default: nextConfig } = await import('../next.config.mjs')
  const rules = await (nextConfig as any).headers()
  const all = rules.find((r: any) => r.source === '/:path*').headers
  const get = (k: string) => all.find((h: any) => h.key === k)?.value as string
  assert.equal(get('X-Frame-Options'), 'SAMEORIGIN')
  const frameAncestors = get('Content-Security-Policy').split(';').map((d) => d.trim()).filter((d) => d.startsWith('frame-ancestors'))
  assert.deepEqual(frameAncestors, ["frame-ancestors 'self'"])
})
