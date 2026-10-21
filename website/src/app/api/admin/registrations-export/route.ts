import { headers } from 'next/headers'
import { getPayload, type Where } from 'payload'
import config from '@payload-config'
import { can, canFor, eventIdOf, eventScope } from '@/payload/access/permissions'
import { logger } from '@/lib/logger'
// Per-user limits only: organisers often share one campus IP, and these routes already require a staff login
import { rateLimitUser } from '@/lib/rateLimit'
import { getStaffTexts } from '@/lib/staff-texts'
import { getExportTexts } from '@/lib/export-texts'
import { YEAR_ADMIN_LABELS } from '@/lib/member-details'
import { csvCell } from '@/lib/csv'
import { ListQueryError, parseListQuery, searchWhere } from '@/lib/list-query'

export const dynamic = 'force-dynamic'

/**
 * CSV exports for organiser teams: each view is an access-role permission ("CSV export: …"), possibly limited to some events.
 * Views: full (everything except ID files), finance (money + contacts), checkin (one row per participant,
 * leader phone only), roster (names, teams, colleges, events; no contacts), members (owner, 21 Oct 2026: one row per
 * team member with their details; contacts only where allowed). Technical-event members only get their assigned events.
 *
 * Two ways in:
 *   - the dashboard: every team the view's permission covers (optional ?event=<slug>);
 *   - CMS → Event registrations (?filtered=1 + the list's own query): exactly the teams the list shows with its filters,
 *     search and sort (owner, 21 Oct 2026). That query runs through Payload as the signed-in person, so the list's read
 *     rules apply and a filter on a field they may not read is refused; it is also limited to the view's events.
 */
type View = 'full' | 'finance' | 'checkin' | 'roster' | 'members'
const EXPORT_VIEWS: View[] = ['full', 'finance', 'checkin', 'roster', 'members']
// Search box of the list: the collection's listSearchableFields (Registrations.ts)
const SEARCH_FIELDS = ['registrationCode', 'teamName', 'leaderName', 'college']

// Quote for CSV and neutralise spreadsheet formulas in user-entered text (lib/csv.ts, shared with the participants export)
const csv = csvCell

export async function GET(req: Request) {
  const A = (await getStaffTexts()).adminApi // wording: CMS → Admin tools → Staff & admin texts
  const E = await getExportTexts() // CMS → Website → Export texts
  const payload = await getPayload({ config })
  const { user } = await payload.auth({ headers: await headers() })
  const url = new URL(req.url)
  const view = (url.searchParams.get('view') || 'checkin') as View
  if (!user || !EXPORT_VIEWS.includes(view) || !can(user as any, `exports.${view}`)) {
    return new Response(A.notAllowed, { status: 403 })
  }

  if (!rateLimitUser(user.id, 'registrations-export', 15, 60 * 1000)) {
    return new Response(A.exportTooMany, { status: 429 })
  }

  const eventSlug = url.searchParams.get('event')
  const filtered = url.searchParams.get('filtered') === '1'
  // Each export is an access-role permission that may be limited to some events: only those rows
  const scope = eventScope(user as any, `exports.${view}`)
  if (Array.isArray(scope) && scope.length === 0) return new Response(A.exportNoEvents, { status: 403 })
  const scopeWhere: Where | null = scope === 'all' ? null : { event: { in: scope } }

  let regs: any[]
  let filters: unknown = 'all'
  if (filtered) {
    let q
    try {
      q = parseListQuery(url.searchParams)
    } catch (err) {
      if (err instanceof ListQueryError) return new Response(E.bar.badFilter, { status: 400, headers: { 'Cache-Control': 'no-store' } })
      throw err
    }
    const parts = [q.where as Where | null, searchWhere(q.search, SEARCH_FIELDS) as Where | null, scopeWhere].filter(Boolean) as Where[]
    try {
      const result = await payload.find({
        collection: 'event-registrations',
        user,
        overrideAccess: false,
        depth: 1,
        pagination: false,
        sort: q.sort || '-createdAt',
        where: parts.length ? { and: parts } : undefined,
      })
      regs = result.docs as any[]
    } catch (err: any) {
      // Unknown field, operator or value, or a field this person may not read
      logger.warn(`Filtered registration export refused for ${(user as any).email}: ${err?.message || err}`)
      return new Response(E.bar.badFilter, { status: 400, headers: { 'Cache-Control': 'no-store' } })
    }
    filters = { where: q.where, search: q.search, sort: q.sort }
  } else {
    const result = await payload.find({
      collection: 'event-registrations',
      overrideAccess: true,
      depth: 1,
      pagination: false,
      sort: 'createdAt',
      ...(scopeWhere ? { where: scopeWhere } : {}),
    })
    regs = result.docs as any[]
    if (eventSlug) regs = regs.filter((r) => typeof r.event === 'object' && r.event?.slug === eventSlug)
    filters = eventSlug || 'all'
  }

  const C = (await getStaffTexts(payload)).csv // column names: CMS → Staff & admin texts → CSV exports
  const lines: string[] = []
  const ev = (r: any) => (typeof r.event === 'object' ? r.event?.title : r.event)
  const when = (d?: string) => (d ? new Date(d).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' }) : '')
  const yearText = (v?: string) => (v && v in YEAR_ADMIN_LABELS ? YEAR_ADMIN_LABELS[v as keyof typeof YEAR_ADMIN_LABELS] : '')

  // Columns follow the same field rules as the CMS (audit L6), per row: the permission must cover that row's event
  const may = (key: string) => (r: any) => canFor(user as any, key, eventIdOf(r))
  const phoneFor = (r: any) => may('registrations.leaderPhone')(r) || may('registrations.contacts')(r)
  // A column is shown when the permission covers any event; its cells are blank for rows outside it
  const has = (key: string) => can(user as any, key)

  if (view === 'members') {
    // One row per team member (owner, 21 Oct 2026). Member 1 is the team leader. Contacts, student-ID status and the
    // leader's phone follow the same permissions as the CMS, per competition.
    const X = E.csv
    const cols: [string, (r: any, m: any, i: number) => unknown, boolean][] = [
      [C.code, (r) => r.registrationCode, true],
      [C.event, (r) => ev(r), true],
      [C.team, (r) => r.teamName, true],
      [X.teamStatus, (r) => r.status, true],
      [C.paymentStatus, (r) => r.paymentStatus, true],
      [C.idCheck, (r) => r.idVerification, true],
      [C.entryOption, (r) => r.entryOption || '', true],
      [C.memberNo, (_r, _m, i) => i + 1, true],
      [X.role, (_r, _m, i) => (i === 0 ? X.leader : X.member), true],
      [C.name, (_r, m) => m.name, true],
      [X.email, (r, m, i) => (may('registrations.contacts')(r) ? m.email || (i === 0 ? r.leaderEmail : '') : ''), has('registrations.contacts')],
      [
        X.phone,
        (r, m, i) => (may('registrations.contacts')(r) ? m.phone || (i === 0 ? r.leaderPhone : '') : i === 0 && phoneFor(r) ? r.leaderPhone : ''),
        has('registrations.contacts') || has('registrations.leaderPhone'),
      ],
      [C.college, (_r, m) => m.college, true],
      [C.branch, (_r, m) => m.branch || '', true],
      [C.year, (_r, m) => yearText(m.year), true],
      [X.answers, (_r, m) => (m.answers || []).map((a: any) => `${a.question}: ${a.answer}`).join(', '), true],
      [X.idUploaded, (r, m) => (may('registrations.ids')(r) ? (m.idDocument ? X.yes : X.no) : ''), has('registrations.ids')],
      [C.arrived, (r) => (r.checkedIn ? when(r.checkedInAt) || C.arrivedYes : ''), true],
      [C.registeredAt, (r) => when(r.createdAt), true],
    ]
    const shown = cols.filter(([, , ok]) => ok)
    lines.push(shown.map(([h]) => csv(h)).join(','))
    for (const r of regs) (r.members || []).forEach((m: any, i: number) => lines.push(shown.map(([, get]) => csv(get(r, m || {}, i))).join(',')))
  } else if (view === 'roster') {
    lines.push([C.code, C.event, C.team, C.memberNo, C.name, C.college, C.branch, C.year, C.status].map(csv).join(','))
    for (const r of regs) {
      ;(r.members || []).forEach((m: any, i: number) => {
        lines.push([r.registrationCode, ev(r), r.teamName, i + 1, m.name, m.college, m.branch || '', yearText(m.year), r.status].map(csv).join(','))
      })
    }
  } else if (view === 'checkin') {
    lines.push([C.code, C.event, C.team, C.memberNo, C.name, C.college, C.leaderPhone, C.status, C.payment, C.idCheck, C.arrived].map(csv).join(','))
    for (const r of regs) {
      ;(r.members || []).forEach((m: any, i: number) => {
        lines.push([r.registrationCode, ev(r), r.teamName, i + 1, m.name, m.college, i === 0 ? r.leaderPhone : '', r.status, r.paymentStatus, r.idVerification, r.checkedIn ? when(r.checkedInAt) || C.arrivedYes : ''].map((v, k) => (k === 6 && !phoneFor(r) ? '' : v)).map(csv).join(','))
      })
    }
  } else {
    const cols: [string, (r: any) => unknown, boolean][] = [
      [C.code, (r) => r.registrationCode, true],
      [C.event, (r) => ev(r), true],
      [C.team, (r) => r.teamName, true],
      [C.leader, (r) => r.leaderName, true],
      [C.leaderEmail, (r) => (may('registrations.contacts')(r) ? r.leaderEmail : ''), has('registrations.contacts')],
      [C.leaderPhone, (r) => (phoneFor(r) ? r.leaderPhone : ''), has('registrations.contacts') || has('registrations.leaderPhone')],
      [C.leaderCollege, (r) => r.college, true],
      [C.members, (r) => (r.members || []).length, true],
      [C.amount, (r) => (may('registrations.money')(r) ? r.amountDue : ''), has('registrations.money')],
      [C.paymentStatus, (r) => r.paymentStatus, true],
      [C.schoolEntry, (r) => (r.schoolEntry ? C.arrivedYes : ''), true],
      [C.entryOption, (r) => r.entryOption || '', true],
      [C.paymentRef, (r) => (may('registrations.money')(r) ? r.paymentReference : ''), has('registrations.money')],
      [C.verifiedAt, (r) => when(r.verifiedAt), true],
      [C.status, (r) => r.status, true],
      [C.registeredAt, (r) => when(r.createdAt), true],
      ...((view === 'full'
        ? [
            [C.memberNames, (r: any) => (r.members || []).map((m: any) => m.name).join('; '), true],
            [C.memberColleges, (r: any) => (r.members || []).map((m: any) => m.college).join('; '), true],
            [C.memberBranches, (r: any) => (r.members || []).map((m: any) => m.branch || '—').join('; '), true],
            [C.memberYears, (r: any) => (r.members || []).map((m: any) => yearText(m.year) || '—').join('; '), true],
            // The competition's extra questions (e.g. BGMI: in-game name, player ID), per member
            [C.memberAnswers, (r: any) => (r.members || []).map((m: any) => (m.answers || []).map((a: any) => `${a.question}: ${a.answer}`).join(', ') || '—').join('; '), true],
            [C.idCheck, (r: any) => r.idVerification, true],
            [C.adminNotes, (r: any) => (may('registrations.notes')(r) ? r.adminNotes : ''), has('registrations.notes')],
          ]
        : []) as [string, (r: any) => unknown, boolean][]),
    ]
    const shown = cols.filter(([, , ok]) => ok)
    lines.push(shown.map(([h]) => csv(h)).join(','))
    for (const r of regs) lines.push(shown.map(([, get]) => csv(get(r))).join(','))
  }

  logger.audit(String((user as any).email), 'REGISTRATIONS_EXPORTED', 'EventRegistration', view, { rows: regs.length, filtered, filters })
  const stamp = new Date().toISOString().slice(0, 10)
  const base = view === 'members' ? E.csv.file.replace(/[^\w-]+/g, '-') || 'aurix-team-members' : `aurix-${view}`
  return new Response('﻿' + lines.join('\r\n') + '\r\n', {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="${base}${filtered ? '-filtered' : eventSlug ? `-${eventSlug}` : ''}-${stamp}.csv"`,
      'Cache-Control': 'no-store',
      'X-Content-Type-Options': 'nosniff',
    },
  })
}
