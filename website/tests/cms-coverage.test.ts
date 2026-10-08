import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { formatDateRange, formatFee, formatTeamSize } from '../src/lib/format'
import { DEFAULT_FORM_TEXTS } from '../src/lib/form-texts-defaults'
import { DEFAULT_STAFF_TEXTS, visibilityGroupLabels, visibilityPageKey } from '../src/lib/staff-texts-defaults'
import { BUILT_IN_PAGES } from '../src/lib/visibility'
import { builtInTextField } from '../src/payload/fields/textGroups'
import { text, withDefault } from '../src/payload/fields/common'

// 8 Oct 2026: page-by-page check that the wording people see comes from the CMS. The scans below fail when new
// visible text is written straight into a page or component; put it in a texts group (lib/*-defaults.ts) instead.

const SRC = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'src')
const files = (dir: string, ext: RegExp): string[] =>
  fs.readdirSync(dir, { withFileTypes: true }).flatMap((e) => {
    const p = path.join(dir, e.name)
    return e.isDirectory() ? files(p, ext) : ext.test(e.name) ? [p] : []
  })
const rel = (p: string) => path.relative(SRC, p).split(path.sep).join('/')
const stripComments = (s: string) => s.replace(/\{\/\*[\s\S]*?\*\/\}/g, '').replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '')

test('no visible text written straight into JSX', () => {
  const found: string[] = []
  for (const f of files(SRC, /\.tsx$/)) {
    const s = stripComments(fs.readFileSync(f, 'utf8'))
    // Text between tags: words only (code between ">" and "<" such as "=> (" or "a < b" is not text)
    for (const m of s.matchAll(/>\s*([A-Za-z][A-Za-z0-9 ,.'’!?:&—–\-/]*?)\s*</g)) {
      const t = m[1].trim()
      // skip keywords and TypeScript types such as `Promise<{ searchParams: Promise<…> }>`
      if (/^(return|const|let|if|else|null|true|false)$/.test(t) || /^\w+\??: \w+$/.test(t) || !/[A-Za-z]{2,}/.test(t)) continue
      found.push(`${rel(f)}: ${t}`)
    }
    for (const m of s.matchAll(/\b(placeholder|aria-label|title|alt|label)="([^"]*[A-Za-z][^"]*)"/g)) found.push(`${rel(f)}: ${m[1]}="${m[2]}"`)
  }
  assert.deepEqual(found, [])
})

// Sentence-like string literals that are not on any screen. Every entry says why it may stay in code.
const NOT_SHOWN: Record<string, string> = {
  'app/api/auth/login/route.ts: Login did not return a session': 'internal error, caught; the visitor sees messages.loginFailed',
  'app/api/aurix/portal/profile/route.ts: New password must be at least 8 characters long.': 'zod message never sent; the route answers M.passwordMin',
  'app/api/aurix/portal/claim/route.ts: Invalid registration code format.': 'zod message never sent; the route answers its own CMS message',
  'app/api/aurix/register/route.ts: Invalid phone number': 'zod message never sent; the route answers M.regCheckFields',
  'lib/auth/participant.ts: Use letters, spaces and . \' - only in the name (2–80 characters).': 'zod message never sent; routes answer M.nameRule',
  'components/auth/Turnstile.tsx: Turnstile script failed to load': 'internal error; the form shows the CMS bot-check message',
  'lib/retention.ts: This event is not due for deletion yet': 'guard behind the admin route, which answers A.retentionNothing first',
  'lib/data/events.ts: Hackathon event record not found': 'internal error (log only)',
  'lib/data/types.ts: Arena configuration revealed during the event': 'code comment example',
}
// Built-in wording kept as a fallback when the caller passes no CMS text (every page passes it; tests above check
// the defaults match), or internal names that the CMS maps to editable labels.
const FALLBACK_FILES = [
  /^lib\/[\w-]+-defaults\.ts$/,
  /^lib\/format\.ts$/,
  /^lib\/auth\/resend-policy\.ts$/,
  /^lib\/payments\/match\.ts$/, // DEFAULT_REASONS; the payment-matching page passes the CMS wording
  /^lib\/payments\/index\.ts$/, // server configuration errors (log only, fail closed)
  /^lib\/email\/index\.ts$/, // server configuration error (log only)
  /^lib\/visibility\.ts$/, // built-in page names; the Page visibility screen shows the CMS names
  /^lib\/data\/seed-/, // seeds: copied into the CMS once, then edited there
  /^lib\/pages\//, // built-in pages: copied into Website → Pages once (initPages), then edited there
  /^payload\/components\/PageVisibility(View|Editor)\.tsx$/, // internal group ids, shown through visibilityGroupLabels
  /^components\/aurix\/Countdown\.tsx$/, // DEFAULT_WORDS; both callers pass countdownWords(CMS labels)
  /^components\/site\/SiteNavbar\.tsx$/, // default prop; both layouts pass general.menuButton
  /^components\/auth\/AccountButtons\.tsx$/, // default prop; both callers pass the CMS text
  /^components\/blocks\/(aurix|data|pages2|CmsForm)\.tsx$/, // `b.field || '…'`: block fields start with the same text
]

test('no visible sentences hidden in code (outside the CMS text defaults)', () => {
  const found: string[] = []
  const skip = /(payload-types|migrations\/|payload\/(collections|globals|fields|access|blocks)\/|\.test\.)/
  for (const dir of ['app', 'components', 'lib', 'payload/components']) {
    for (const f of files(path.join(SRC, dir), /\.tsx?$/)) {
      const r = rel(f)
      if (skip.test(r) || FALLBACK_FILES.some((x) => x.test(r))) continue
      for (const line of fs.readFileSync(f, 'utf8').split('\n')) {
        const l = line.trim()
        if (/^(\/\/|\*|\/\*|import )/.test(l) || /logger\.|console\./.test(l)) continue
        for (const m of l.matchAll(/(['"`])((?:(?!\1).){0,200}?)\1/g)) {
          const t = m[2]
          if (!/[A-Z][a-z]+ [a-z]+/.test(t) || /className|var\(--|https?:\/\/|^[\w-]+:\s/.test(t)) continue
          const key = `${r}: ${t}`
          if (!(key in NOT_SHOWN)) found.push(key)
        }
      }
    }
  }
  assert.deepEqual(found, [])
})

test('competition tables and link previews: CMS wording defaults equal the old text', () => {
  const g = DEFAULT_FORM_TEXTS.general
  assert.equal(formatFee(499, false, g), '₹499 / team')
  assert.equal(formatFee(null, false, g), 'Fee to be announced')
  assert.equal(formatFee(499, true, g), 'Coming Soon')
  assert.equal(formatTeamSize(2, 4, g), '2–4 members')
  assert.equal(formatTeamSize(5, 5, g), '5 members')
  assert.equal(formatTeamSize(null, 3, g), 'Up to 3 members')
  assert.equal(formatTeamSize(null, null, g), 'Team entry')
  assert.equal(formatDateRange('', undefined, 'short', g), 'To be announced')
  assert.equal(formatFee(100, false, { ...g, fmtFee: '{amount} per team' }), '₹100 per team')
  assert.equal(g.shareDomain, 'kalamroboticssociety.com')
  assert.equal(g.spamTrap, 'Website')
  assert.equal(DEFAULT_FORM_TEXTS.registration.doneStatusLink, 'kalamroboticssociety.com/aurix/status')
})

test('CMS text fields show the built-in wording before anyone saves', async (t) => {
  const run = (f: any, value: unknown) => f.hooks.afterRead[0]({ value })
  await t.test('wording screens (Labels & messages, Portal, Event pages, Staff & admin texts)', () => {
    const f: any = builtInTextField('save', 'Save button', 'Save')
    assert.equal(f.defaultValue, 'Save')
    assert.equal(run(f, undefined), 'Save', 'screen never saved')
    assert.equal(run(f, null), 'Save', 'field left empty')
    assert.equal(run(f, '  '), 'Save', 'field cleared')
    assert.equal(run(f, 'Store'), 'Store', 'edited text wins')
  })
  await t.test('block fields with built-in wording', () => {
    const f: any = withDefault(text('emptyText', 'Text when a category has no photos'), 'No photos in this category yet.')
    assert.equal(f.name, 'emptyText')
    assert.equal(f.admin.placeholder, 'No photos in this category yet.')
    assert.equal(run(f, ''), 'No photos in this category yet.')
    assert.equal(run(f, 'Nothing here'), 'Nothing here')
  })
})

test('Page visibility screen: every built-in page and section has CMS wording', () => {
  const V = DEFAULT_STAFF_TEXTS.visibility as Record<string, string>
  for (const p of BUILT_IN_PAGES) {
    const key = visibilityPageKey(p.route)
    assert.equal(V[key], p.label, `${p.route} name`)
    if (p.note) assert.equal(V[`n${key.slice(1)}`], p.note, `${p.route} note`)
    assert.ok(visibilityGroupLabels(DEFAULT_STAFF_TEXTS.visibility)[p.group], `${p.group} section name`)
  }
})

test('every CMS wording screen has unique field names (a duplicate breaks the whole CMS config)', async () => {
  const { EVENT_LABEL_GROUPS } = await import('../src/lib/event-labels-defaults')
  const { FORM_TEXT_GROUPS } = await import('../src/lib/form-texts-defaults')
  const { PORTAL_TEXT_GROUPS } = await import('../src/lib/portal-texts-defaults')
  const { STAFF_TEXT_GROUPS } = await import('../src/lib/staff-texts-defaults')
  // Event pages: one flat list across tabs; the others: unique within each group
  const names = EVENT_LABEL_GROUPS.flatMap((g: any) => g.fields.map((f: any) => f[0]))
  assert.deepEqual(names.filter((n: string, i: number) => names.indexOf(n) !== i), [], 'Event pages')
  for (const groups of [FORM_TEXT_GROUPS, PORTAL_TEXT_GROUPS, STAFF_TEXT_GROUPS] as any[]) {
    const keys = groups.map((g: any) => g.key)
    assert.deepEqual(keys.filter((k: string, i: number) => keys.indexOf(k) !== i), [])
    for (const g of groups) {
      const n = g.fields.map((f: any) => f[0])
      assert.deepEqual(n.filter((x: string, i: number) => n.indexOf(x) !== i), [], g.key)
    }
  }
})

test('"Where to edit" guide: every page links to the screens that change it', async () => {
  const { buildEditGuide } = await import('../src/lib/edit-guide')
  const T = DEFAULT_STAFF_TEXTS.guide
  const sections = buildEditGuide(
    {
      pages: [
        { id: 5, path: '/gallery', title: 'Gallery', system: true, layout: [{ blockType: 'pageHeader' }, { blockType: 'galleryGrid' }] },
        { id: 8, path: '/team', title: 'Team', system: true, layout: [{ blockType: 'teamGrid' }] },
        { id: 17, path: '/aurix/status', title: 'Registration status', system: true, layout: [{ blockType: 'statusLookup' }] },
        { id: 30, path: '/sponsors', title: 'Sponsors', system: false, published: false, layout: [{ blockType: 'form' }] },
      ],
      events: [{ id: 1, slug: 'hackathon', title: 'Hackathon' }],
      hidden: ['/team'],
    },
    T,
  )
  const row = (path: string) => sections.flatMap((s) => s.rows).find((r) => r.path === path)!
  const hrefs = (path: string) => row(path).links.map((l) => l.href)
  assert.deepEqual(hrefs('/gallery'), ['/admin/collections/pages/5', '/admin/collections/gallery-albums'])
  assert.deepEqual(hrefs('/team'), ['/admin/collections/pages/8', '/admin/collections/people'])
  assert.equal(row('/team').note, T.noteHidden)
  assert.ok(hrefs('/aurix/status').includes('/admin/globals/form-texts'))
  assert.equal(row('/sponsors').note, T.noteUnpublished)
  assert.ok(hrefs('/sponsors').includes('/admin/collections/form-submissions'))
  assert.equal(sections.find((s) => s.rows.some((r) => r.path === '/sponsors'))!.title, T.secYour)
  assert.deepEqual(hrefs('/aurix/hackathon'), ['/admin/collections/events/1', '/admin/globals/event-page-labels'])
  assert.equal(sections.find((s) => s.rows.some((r) => r.path === '/aurix/status'))!.title, T.secAurix)
})
