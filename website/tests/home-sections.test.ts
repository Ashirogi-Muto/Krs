import test from 'node:test'
import assert from 'node:assert/strict'
import React from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { NO_CMS, cmsFor } from '../src/lib/cms-attrs'
import { HeroOrbitBlock } from '../src/components/blocks/HeroOrbit'
import { IntroductionBlock } from '../src/components/blocks/Introduction'
import { DisciplinesBlock } from '../src/components/blocks/Disciplines'
import { DEFAULT_PAGES } from '../src/lib/pages/defaults'
import { PAGE_BLOCKS } from '../src/payload/blocks'

// 12 Oct 2026: the redesigned KRS home sections (ui-updates). Every visible text comes from the block, the sections
// carry live-preview attributes only in preview, and an empty optional field hides its element instead of showing
// built-in wording.

const home = DEFAULT_PAGES['/'].layout
const block = (type: string) => home.find((b) => b.blockType === type)!
const render = (C: any, b: any, cms = NO_CMS) => renderToStaticMarkup(React.createElement(C, { b, cms }))

test('the built-in home page uses the new sections, each registered in the CMS', () => {
  const slugs = new Set(PAGE_BLOCKS.map((b) => b.slug))
  for (const t of ['heroOrbit', 'introduction', 'flagshipEvent', 'disciplines', 'competitionsHub']) {
    assert.ok(block(t), `home has ${t}`)
    assert.ok(slugs.has(t), `${t} is a CMS section`)
  }
  for (const b of home) assert.ok(slugs.has(b.blockType), `${b.blockType} is a CMS section`)
})

for (const [name, C, type] of [
  ['hero', HeroOrbitBlock, 'heroOrbit'],
  ['introduction', IntroductionBlock, 'introduction'],
  ['flip cards', DisciplinesBlock, 'disciplines'],
] as const) {
  test(`${name}: texts from the block; preview attributes only in preview`, () => {
    const b = block(type)
    const visitor = render(C, b)
    assert.doesNotMatch(visitor, /data-cms/)
    for (const v of [b.title, b.titleAccent, b.intro].filter(Boolean)) assert.ok(visitor.includes(String(v).replace(/'/g, '&#x27;')), v)
    const preview = render(C, b, cmsFor('pages/1', 'layout.0'))
    assert.match(preview, /data-cms-path="layout\.0\.title"/)
  })
}

test('optional hero texts are hidden when empty (no built-in claims)', () => {
  const html = render(HeroOrbitBlock, { title: 'T', orbitCards: [], noteTop: '', noteBottom: '' })
  assert.doesNotMatch(html, /Members|EST\.|Less wires/)
  const withStat = render(HeroOrbitBlock, { title: 'T', statValue: '120 members', statLabel: 'Active' })
  assert.match(withStat, /120 members/)
})

test('introduction: no photo badge or caption unless typed in', () => {
  const html = render(IntroductionBlock, { title: 'About', pillars: [] })
  assert.doesNotMatch(html, /RESEARCH LAB|IILM UNIVERSITY • GREATER NOIDA/)
  assert.match(html, /alt=""/, 'built-in photo is decorative')
})

test('flip cards: the back link stays out of the Tab order until the card shows its back (CSS hook present)', () => {
  const html = render(DisciplinesBlock, block('disciplines'))
  assert.match(html, /flip-card-back/)
  assert.match(html, /role="button"/)
})

test('event facts: placeholders filled from Events, a line with a missing fact is hidden', async () => {
  const { fillFacts } = await import('../src/components/blocks/aurix')
  const facts = { dates: '27 Oct 2026', prizePool: '₹2,00,000', venue: 'IILM University, Greater Noida', minFee: '₹399' }
  assert.equal(fillFacts('{dates} · {prizePool} prize pool', facts), '27 Oct 2026 · ₹2,00,000 prize pool')
  assert.equal(fillFacts('From {minFee}', facts), 'From ₹399')
  assert.equal(fillFacts('From {minFee}', { ...facts, minFee: '' }), '')
  assert.equal(fillFacts('Plain text', facts), 'Plain text')
  assert.equal(fillFacts(undefined, facts), '')
})
