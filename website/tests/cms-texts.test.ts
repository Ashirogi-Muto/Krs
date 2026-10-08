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

test('emails: wording from the CMS, defaults equal the old text, CMS text is escaped', async () => {
  const { registrationConfirmation, accountVerification, passwordReset } = await import('../src/lib/email/templates')
  const data = {
    registrationCode: 'AX26-HAC-ABC123', teamName: 'Bots', leaderName: 'Ravi', leaderEmail: 'r@example.com', leaderPhone: '9999999999',
    college: 'IILM', members: [{ name: 'Ravi', college: 'IILM' }], event: { title: 'Hackathon', slug: 'hackathon' }, amountDue: 749, paymentUrl: 'https://pay.example',
  }
  const d = registrationConfirmation(data)
  assert.equal(d.subject, 'Registration received: Hackathon — AX26-HAC-ABC123')
  assert.ok(d.html.includes('Keep your registration code — you will need it to check your status and at the event.'))
  assert.ok(d.html.includes('<strong style="color:#fff">Bots</strong>'))
  assert.ok(d.html.includes('Pay ₹749'))
  const edited = registrationConfirmation(data, { ...DEFAULT_FORM_TEXTS.emails, regIntro: 'Hello {name} <b>x</b> of {team}' })
  assert.ok(edited.html.includes('Hello Ravi &lt;b&gt;x&lt;/b&gt; of <strong style="color:#fff">Bots</strong>'), 'CMS wording is escaped, values filled')
  const v = accountVerification({ name: 'Ravi', url: 'https://x/verify?token=t', expiresHours: 24, deleteOn: '14 October 2026' })
  assert.equal(v.subject, 'Confirm your email for your AURIX account')
  assert.ok(v.html.includes('<strong style="color:#fff">14 October 2026</strong>'))
  assert.ok(v.text.includes('This link works for 24 hours.'))
  const r = passwordReset({ name: 'Ravi', url: 'https://x/reset', expiresMinutes: 60 })
  assert.ok(r.text.includes('This link works for 60 minutes and only once.'))
})

test('search & tabs, judging placeholder, portal: defaults present', async () => {
  const { DEFAULT_PORTAL_TEXTS } = await import('../src/lib/portal-texts-defaults')
  assert.equal(DEFAULT_FORM_TEXTS.seo.siteName, 'Kalam Robotics Society')
  assert.equal(fill(DEFAULT_FORM_TEXTS.seo.tabBlog, { title: 'Post' }), 'Post | KRS Blog')
  assert.equal(DEFAULT_PORTAL_TEXTS.dashboard.tabTitle, 'Dashboard | AURIX Participant Portal')
  assert.equal(DEFAULT_PORTAL_TEXTS.judge.submit, 'Submit Verified Scorecard')
  assert.equal(DEFAULT_PORTAL_TEXTS.profile.errPassword, 'Failed to change password.')
  for (const [k, v] of Object.entries(DEFAULT_PORTAL_TEXTS.judge)) assert.ok(v, `judge.${k} has a default`)
})

test('server messages: defaults equal the old wording', async () => {
  const M = DEFAULT_FORM_TEXTS.messages
  assert.equal(M.loginInvalid, 'Invalid email or password.')
  assert.equal(fill(M.regTeamSize, { event: 'Hackathon', count: '1–5' }), 'Hackathon teams must have 1–5 members.')
  assert.equal(fill(M.formRequired, { label: 'Name' }), 'Please fill in "Name".')
  assert.equal(M.statusNotFound, 'No registration found with that code and email. Check both and try again.')
  const { resendRefusal } = await import('../src/lib/auth/resend-policy')
  const now = new Date('2026-10-04T06:00:00Z')
  assert.equal(
    resendRefusal({ ok: false, reason: 'cooldown', retryAt: new Date(now.getTime() + 30_000) }, now, M),
    'A link was sent moments ago. Please check your inbox and spam folder; you can ask for another one in 30 seconds.',
  )
})
