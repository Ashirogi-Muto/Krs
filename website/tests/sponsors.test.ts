import test from 'node:test'
import assert from 'node:assert/strict'
import { sponsorsForEvent, toSponsors } from '../src/lib/sponsors'

/** Sponsors (owner, 10 Oct 2026): one list in Site settings for the AURIX home section and competition pages. */
test('rows → sponsors: a logo is required, unsafe links dropped, label optional', () => {
  const s = toSponsors([
    { name: 'realme', label: 'Brand Partner', logo: { url: '/api/media/file/realme-logo.png' }, url: 'https://www.realme.com/in/', onCompetitions: true, events: [{ id: 1 }] },
    { name: 'No logo', logo: null },
    { name: 'Bad link', logo: { url: '/x.png' }, url: 'javascript:alert(1)' },
    { name: 'Home only', logo: { url: '/y.png' }, onCompetitions: false },
  ])
  assert.deepEqual(s.map((x) => x.name), ['realme', 'Bad link', 'Home only'])
  assert.equal(s[0].events[0], '1')
  assert.equal(s[1].url, '', 'unsafe link removed, logo kept')
  assert.deepEqual(toSponsors(undefined), [])
})

test('competition pages: "show on competition pages" and either all competitions or the chosen ones', () => {
  const s = toSponsors([
    { name: 'realme', logo: { url: '/a.png' }, onCompetitions: true, events: [1] },
    { name: 'Everywhere', logo: { url: '/b.png' }, onCompetitions: true, events: [] },
    { name: 'Home only', logo: { url: '/c.png' }, onCompetitions: false },
  ])
  assert.deepEqual(sponsorsForEvent(s, 1).map((x) => x.name), ['realme', 'Everywhere'])
  assert.deepEqual(sponsorsForEvent(s, 2).map((x) => x.name), ['Everywhere'])
})

test('hero logos: only sponsors ticked "Show a small logo in the hero"; CMS row numbers kept', () => {
  const s = toSponsors([
    { name: 'No logo', logo: null },
    { name: 'realme', logo: { url: '/a.png' }, inHero: true, events: [1] },
    { name: 'Other', logo: { url: '/b.png' } },
  ])
  assert.deepEqual(s.filter((x) => x.inHero).map((x) => x.name), ['realme'])
  assert.equal(s[0].index, 1, 'row number in the CMS list, even after skipping a row')
  assert.deepEqual(sponsorsForEvent(s, 1).filter((x) => x.inHero).map((x) => x.name), ['realme'])
  assert.deepEqual(sponsorsForEvent(s, 2).filter((x) => x.inHero).map((x) => x.name), [])
})
