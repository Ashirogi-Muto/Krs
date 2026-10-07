import test from 'node:test'
import assert from 'node:assert/strict'
import { DEFAULT_EVENT_LABELS, countdownWords, statusWord } from '../src/lib/event-labels-defaults'
import { DEFAULT_FORM_TEXTS, fill } from '../src/lib/form-texts-defaults'
import { GalleryAlbums, Media } from '../src/payload/collections/Content'
import { Events } from '../src/payload/collections/Events'

// 7 Oct 2026: text that used to be written into the components is now editable; the defaults must equal the old text
// so the site looks the same until someone edits it in the CMS.

test('event page: status words match the old display (first underscore → space)', () => {
  for (const s of ['DRAFT', 'ANNOUNCED', 'REGISTRATION_OPEN', 'REGISTRATION_CLOSED', 'IN_PROGRESS', 'JUDGING', 'RESULTS_PENDING', 'RESULTS_PUBLISHED', 'ARCHIVED'])
    assert.equal(statusWord(DEFAULT_EVENT_LABELS, s), s.replace('_', ' '))
  assert.equal(statusWord(DEFAULT_EVENT_LABELS, 'SOMETHING_NEW'), 'SOMETHING NEW')
  assert.equal(statusWord({ ...DEFAULT_EVENT_LABELS, statusOpen: 'Open now' }, 'REGISTRATION_OPEN'), 'Open now')
})

test('event page: team line and countdown words keep the old text', () => {
  assert.equal(fill(DEFAULT_EVENT_LABELS.teamExact, { count: 5 }), 'Exactly 5 Members')
  assert.equal(fill(DEFAULT_EVENT_LABELS.teamRange, { min: 1, max: 5 }), '1–5 Members')
  assert.equal(fill(DEFAULT_EVENT_LABELS.teamOperator, { count: 1 }), '1 Operator')
  assert.equal(DEFAULT_EVENT_LABELS.teamUnknown, 'Team')
  assert.deepEqual(countdownWords(DEFAULT_EVENT_LABELS), { days: 'Days', hours: 'Hours', mins: 'Mins', secs: 'Secs', over: 'Event is Live or Concluded' })
})

test('labels & messages: new defaults equal the text that was hard-coded', () => {
  const g = DEFAULT_FORM_TEXTS.general
  assert.equal(g.skipLink, 'Skip to main content')
  assert.equal(g.legalEyebrow, 'Compliance & Protection // Legal')
  assert.equal(g.comingSoon, 'Coming Soon')
  assert.equal(g.registrationOpen, 'Registration Open')
  assert.equal(g.datesTba, 'Dates to be announced')
  assert.equal(g.datesTbaInText, 'dates to be announced')
  assert.equal(g.selectPlaceholder, 'Select')
  assert.equal(DEFAULT_FORM_TEXTS.status.codePlaceholder, 'AX26-SOC-XXXXXX')
  assert.equal(
    fill(DEFAULT_FORM_TEXTS.status.registeredNote, { date: '7 Oct 2026, 9:00 pm' }),
    'Registered on 7 Oct 2026, 9:00 pm IST. Payments are verified once a day, so a new payment can take up to 24–48 hours to show here.',
  )
  assert.equal(DEFAULT_FORM_TEXTS.account.resetIncomplete, 'This reset link is incomplete. Please request a new one.')
})

test('gallery: only the photos are needed (owner, 7 Oct 2026)', () => {
  const fields = GalleryAlbums.fields as any[]
  const flat = fields.flatMap((f) => (f.type === 'row' ? f.fields : [f]))
  for (const name of ['title', 'category', 'caption']) assert.notEqual(flat.find((f) => f.name === name)?.required, true, `${name} optional`)
  const photos = flat.find((f) => f.name === 'photos')
  assert.equal(photos.hasMany, true)
  assert.equal(photos.relationTo, 'media')
  assert.equal(photos.validate([], { siblingData: {} }), 'Add at least one photo.')
  assert.equal(photos.validate([1, 2], { siblingData: {} }), true)
  assert.equal(photos.validate([], { siblingData: { coverImage: 3 } }), true)
  const alt = (Media.fields as any[]).find((f) => f.name === 'alt')
  assert.notEqual(alt.required, true, 'image description optional')
})

test('events: each competition can title its notice box', () => {
  const f = (Events.fields as any[]).find((x) => x.name === 'noticeTitle')
  assert.ok(f, 'noticeTitle field')
  assert.equal(f.type, 'text')
})
