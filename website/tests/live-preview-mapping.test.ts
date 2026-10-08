import test from 'node:test'
import assert from 'node:assert/strict'
import React from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import {
  NO_CMS,
  adminUrlFor,
  cmsFor,
  cmsGlobal,
  cmsRef,
  docFromAdminPath,
  fieldIdToPath,
  parseCmsMessage,
  parsePreviewMessage,
  pathToFieldId,
} from '../src/lib/cms-attrs'
import { CardGridBlock, TextChipsBlock } from '../src/components/blocks/sections'
import { SectionHeader } from '../src/components/blocks/shared'

// Live preview, phase 2 (docs/LIVE_PREVIEW_PLAN.md §5–§6)

test('CMS field id ↔ path (tabs add nothing; arrays and groups do)', () => {
  const cases: [string, string][] = [
    ['field-layout__0__title', 'layout.0.title'],
    ['field-layout__3__cards__1__title', 'layout.3.cards.1.title'],
    ['field-registration__step1', 'registration.step1'],
    ['field-venue', 'venue'],
    ['field-rulesSections__2__rules__0__rule', 'rulesSections.2.rules.0.rule'],
  ]
  for (const [id, path] of cases) {
    assert.equal(fieldIdToPath(id), path)
    assert.equal(pathToFieldId(path), id)
  }
  for (const bad of ['layout__0', 'field-', 'field-a"b', 'field-a b', 'field-x__', `field-${'a'.repeat(250)}`]) assert.equal(fieldIdToPath(bad), null, bad)
})

test('preview attributes: nothing outside preview, document/global/ref attributes inside', () => {
  assert.deepEqual(NO_CMS(), {})
  assert.deepEqual(NO_CMS('title'), {})
  const cms = cmsFor('pages/8', 'layout.2')
  assert.deepEqual(cms(), { 'data-cms-doc': 'pages/8', 'data-cms-path': 'layout.2' })
  assert.deepEqual(cms('cards.1.title'), { 'data-cms-doc': 'pages/8', 'data-cms-path': 'layout.2.cards.1.title' })
  assert.deepEqual(cms('x"onmouseover="alert(1)'), {}, 'an odd field name renders no attribute at all')
  assert.deepEqual(cmsGlobal('event-page-labels')('statFee'), { 'data-cms-global': 'event-page-labels', 'data-cms-path': 'statFee' })
  assert.deepEqual(cmsRef(false, 'people', 3), {})
  assert.deepEqual(cmsRef(true, 'people', 3), { 'data-cms-ref': 'people/3' })
  assert.deepEqual(cmsRef(true, 'people', 'seed-1'), {}, 'bundled fallback items have no CMS id')
})

test('visitor HTML of a section has no data-cms attributes; preview HTML has them', () => {
  const b = {
    blockType: 'cardGrid', eyebrow: 'Small line', title: 'Pillars', intro: 'Intro text',
    cards: [{ title: '' }, { title: 'Hardware', text: 'Build things' }],
  }
  const visitor = renderToStaticMarkup(React.createElement(CardGridBlock, { b }))
  const visitor2 = renderToStaticMarkup(React.createElement(CardGridBlock, { b, cms: NO_CMS }))
  assert.equal(visitor, visitor2)
  assert.doesNotMatch(visitor, /data-cms/)
  const preview = renderToStaticMarkup(React.createElement(CardGridBlock, { b, cms: cmsFor('pages/1', 'layout.4') }))
  assert.match(preview, /data-cms-path="layout\.4"/)
  assert.match(preview, /data-cms-path="layout\.4\.title"/)
  assert.match(preview, /data-cms-path="layout\.4\.cards\.1\.title"/, 'the CMS row number, although the empty card 0 is skipped')
  // Same visible output apart from the attributes
  assert.equal(preview.replace(/ data-cms-[a-z]+="[^"]*"/g, ''), visitor)
  const chips = { eyebrow: 'About', title: 'KRS', body: 'Text', chips: [{ item: 'ROS' }] }
  assert.doesNotMatch(renderToStaticMarkup(React.createElement(TextChipsBlock, { b: chips })), /data-cms/)
  assert.doesNotMatch(renderToStaticMarkup(React.createElement(SectionHeader, { eyebrow: 'a', title: 'b', intro: 'c' })), /data-cms/)
})

test('messages from the CMS: fixed schema only', () => {
  assert.deepEqual(parseCmsMessage({ type: 'krs-cms:highlight', doc: 'pages/8', path: 'layout.0.title' }), {
    type: 'krs-cms:highlight', doc: 'pages/8', path: 'layout.0.title',
  })
  assert.deepEqual(parseCmsMessage({ type: 'krs-cms:highlight', doc: 'global:form-texts', path: 'general.comingSoon', value: '  Coming Soon ' }), {
    type: 'krs-cms:highlight', doc: 'global:form-texts', path: 'general.comingSoon', value: 'Coming Soon',
  })
  assert.deepEqual(parseCmsMessage({ type: 'krs-cms:clear' }), { type: 'krs-cms:clear' })
  assert.equal((parseCmsMessage({ type: 'krs-cms:highlight', doc: 'pages/8', path: 'a', value: 'x'.repeat(500) }) as any).value.length, 300)
  for (const bad of [null, 'x', 42, {}, { type: 'payload-live-preview' }, { type: 'krs-cms:highlight', doc: 'pages/8' },
    { type: 'krs-cms:highlight', doc: 'pages/8"]', path: 'a' }, { type: 'krs-cms:highlight', doc: 'pages/0', path: 'a' },
    { type: 'krs-cms:highlight', doc: 'pages/8', path: 'a"],[x' }, { type: 'krs-cms:highlight', doc: 'global:Form', path: 'a' }])
    assert.equal(parseCmsMessage(bad), null, JSON.stringify(bad))
})

test('messages from the preview frame: focus a path or open an allowed screen, nothing else', () => {
  const allowed = { collections: ['events', 'gallery-albums'], globals: ['event-page-labels'] }
  assert.deepEqual(parsePreviewMessage({ type: 'krs-cms:focus', doc: 'events/2', path: 'venue' }, allowed), { type: 'krs-cms:focus', doc: 'events/2', path: 'venue' })
  const open = parsePreviewMessage({ type: 'krs-cms:open', target: 'doc', slug: 'gallery-albums', id: 7 }, allowed)!
  assert.equal(adminUrlFor(open as any), '/admin/collections/gallery-albums/7')
  const g = parsePreviewMessage({ type: 'krs-cms:open', target: 'global', slug: 'event-page-labels', path: 'statFee' }, allowed)!
  assert.equal(adminUrlFor(g as any), '/admin/globals/event-page-labels#focus=statFee')
  for (const bad of [{ type: 'krs-cms:open', target: 'doc', slug: 'users', id: 1 }, { type: 'krs-cms:open', target: 'doc', slug: 'events', id: '2' },
    { type: 'krs-cms:open', target: 'global', slug: 'staff-texts' }, { type: 'krs-cms:open', target: 'global', slug: 'event-page-labels', path: '../x' },
    { type: 'krs-cms:open', target: 'url', slug: 'events', id: 1 }, { type: 'krs-cms:save' }, { type: 'krs-cms:focus', doc: 'events/2', path: 'a b' }])
    assert.equal(parsePreviewMessage(bad, allowed), null, JSON.stringify(bad))
})

test('which document a CMS screen edits', () => {
  assert.equal(docFromAdminPath('/admin/collections/pages/8'), 'pages/8')
  assert.equal(docFromAdminPath('/admin/collections/events/2/'), 'events/2')
  assert.equal(docFromAdminPath('/admin/globals/form-texts'), 'global:form-texts')
  for (const p of ['/admin', '/admin/collections/pages', '/admin/collections/pages/create', '/admin/collections/pages/8/versions', '/team'])
    assert.equal(docFromAdminPath(p), null, p)
})

test('phase 3: clicked text without an attribute is sent as plain text (trimmed, max 300)', () => {
  const allowed = { collections: [], globals: [] }
  assert.deepEqual(parsePreviewMessage({ type: 'krs-cms:text', text: '  Entry   Fee ' }, allowed), { type: 'krs-cms:text', text: 'Entry Fee' })
  assert.equal((parsePreviewMessage({ type: 'krs-cms:text', text: 'x'.repeat(900) }, allowed) as any).text.length, 300)
  for (const bad of [{ type: 'krs-cms:text', text: ' ' }, { type: 'krs-cms:text', text: 7 }, { type: 'krs-cms:text' }])
    assert.equal(parsePreviewMessage(bad, allowed), null)
})
