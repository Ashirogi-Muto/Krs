import { headers } from 'next/headers'
import { getPayload } from 'payload'
import config from '@payload-config'
import { can, canFor, eventIdOf, eventScope } from '@/payload/access/permissions'
import { logger } from '@/lib/logger'
// Per-user limits only: organisers often share one campus IP, and these routes already require a staff login
import { rateLimitUser } from '@/lib/rateLimit'
import { getStaffTexts } from '@/lib/staff-texts'
import { fill } from '@/lib/form-texts-defaults'
import { YEAR_ADMIN_LABELS } from '@/lib/member-details'
import { csvCell } from '@/lib/csv'

export const dynamic = 'force-dynamic'

/**
 * CSV exports for organiser teams: each view is an access-role permission ("CSV export: …"), possibly limited to some events.
 * Views: full (everything except ID files), finance (money + contacts), checkin (one row per participant,
 * leader phone only), roster (names, teams, colleges, events; no contacts). Technical-event members only
 * get their assigned events. Optional ?event=<slug> filter.
 */
type View = 'full' | 'finance' | 'checkin' | 'roster'

// Quote for CSV and neutralise spreadsheet formulas in user-entered text (lib/csv.ts, shared with the participants export)
const csv = csvCell

export async function GET(req: Request) {
  const A = (await getStaffTexts()).adminApi // wording: CMS → Admin tools → Staff & admin texts
  const payload = await getPayload({ config })
  const { user } = await payload.auth({ headers: await headers() })
  const url = new URL(req.url)
  const view = (url.searchParams.get('view') || 'checkin') as View
  const views: View[] = ['full', 'finance', 'checkin', 'roster']
  if (!user || !views.includes(view) || !can(user as any, `exports.${view}`)) {
    return new Response(A.notAllowed, { status: 403 })
  }

  if (!rateLimitUser(user.id, 'registrations-export', 15, 60 * 1000)) {
    return new Response(A.exportTooMany, { status: 429 })
  }

  const eventSlug = url.searchParams.get('event')
  // Each export is an access-role permission that may be limited to some events: only those rows
  const scope = eventScope(user as any, `exports.${view}`)
  if (Array.isArray(scope) && scope.length === 0) return new Response(A.exportNoEvents, { status: 403 })
  const result = await payload.find({
    collection: 'event-registrations',
    overrideAccess: true,
    depth: 1,
    pagination: false,
    sort: 'createdAt',
    ...(scope === 'all' ? {} : { where: { event: { in: scope } } }),
  })
  let regs = result.docs as any[]
  if (eventSlug) regs = regs.filter((r) => typeof r.event === 'object' && r.event?.slug === eventSlug)

  const C = (await getStaffTexts(payload)).csv // column names: CMS → Staff & admin texts → CSV exports
  const lines: string[] = []
  const ev = (r: any) => (typeof r.event === 'object' ? r.event?.title : r.event)
  const when = (d?: string) => (d ? new Date(d).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' }) : '')
  const yearText = (v?: string) => (v && v in YEAR_ADMIN_LABELS ? YEAR_ADMIN_LABELS[v as keyof typeof YEAR_ADMIN_LABELS] : '')

  // Columns follow the same field rules as the CMS (audit L6), per row: the permission must cover that row's event
  const may = (key: string) => (r: any) => canFor(user as any, key, eventIdOf(r))
  const phoneFor = (r: any) => may('registrations.leaderPhone')(r) || may('registrations.contacts')(r)

  if (view === 'roster') {
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
    // A column is shown when the permission covers any event; its cells are blank for rows outside it
    const has = (key: string) => can(user as any, key)
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

  logger.audit(String((user as any).email), 'REGISTRATIONS_EXPORTED', 'EventRegistration', view, { rows: regs.length, event: eventSlug || 'all' })
  const stamp = new Date().toISOString().slice(0, 10)
  return new Response('﻿' + lines.join('\r\n') + '\r\n', {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="aurix-${view}${eventSlug ? `-${eventSlug}` : ''}-${stamp}.csv"`,
      'Cache-Control': 'no-store',
    },
  })
}
