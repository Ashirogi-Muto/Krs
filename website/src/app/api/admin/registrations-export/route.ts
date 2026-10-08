import { headers } from 'next/headers'
import { getPayload } from 'payload'
import config from '@payload-config'
import { SEE_CONTACTS, SEE_LEADER_PHONE, SEE_MONEY, SEE_NOTES, assignedEventIds, exportViews, hasRole, limitedToAssignedEvents, type ExportView, type StaffRole } from '@/payload/access/roles'
import { logger } from '@/lib/logger'
// Per-user limits only: organisers often share one campus IP, and these routes already require a staff login
import { rateLimitUser } from '@/lib/rateLimit'
import { getStaffTexts } from '@/lib/staff-texts'
import { fill } from '@/lib/form-texts-defaults'

export const dynamic = 'force-dynamic'

/**
 * CSV exports for organiser teams; who gets which view is decided by exportViews() in access/roles.ts.
 * Views: full (everything except ID files), finance (money + contacts), checkin (one row per participant,
 * leader phone only), roster (names, teams, colleges, events; no contacts). Technical-event members only
 * get their assigned events. Optional ?event=<slug> filter.
 */
type View = ExportView

// Quote for CSV and neutralise spreadsheet formulas in user-entered text
function csv(value: unknown): string {
  let s = value === null || value === undefined ? '' : String(value)
  if (/^[=+\-@\t\r]/.test(s)) s = `'${s}`
  return `"${s.replace(/"/g, '""')}"`
}

export async function GET(req: Request) {
  const A = (await getStaffTexts()).adminApi // wording: CMS → Admin tools → Staff & admin texts
  const payload = await getPayload({ config })
  const { user } = await payload.auth({ headers: await headers() })
  const url = new URL(req.url)
  const view = (url.searchParams.get('view') || 'checkin') as View
  if (!user || !exportViews(user).includes(view)) {
    return new Response(A.notAllowed, { status: 403 })
  }

  if (!rateLimitUser(user.id, 'registrations-export', 15, 60 * 1000)) {
    return new Response(A.exportTooMany, { status: 429 })
  }

  const eventSlug = url.searchParams.get('event')
  // Permission was checked above and the columns are fixed per view; tech-event members get their events only
  const limited = limitedToAssignedEvents(user)
  const ids = assignedEventIds(user)
  if (limited && ids.length === 0) return new Response(A.exportNoEvents, { status: 403 })
  const result = await payload.find({
    collection: 'event-registrations',
    overrideAccess: true,
    depth: 1,
    pagination: false,
    sort: 'createdAt',
    ...(limited ? { where: { event: { in: ids } } } : {}),
  })
  let regs = result.docs as any[]
  if (eventSlug) regs = regs.filter((r) => typeof r.event === 'object' && r.event?.slug === eventSlug)

  const C = (await getStaffTexts(payload)).csv // column names: CMS → Staff & admin texts → CSV exports
  const lines: string[] = []
  const ev = (r: any) => (typeof r.event === 'object' ? r.event?.title : r.event)
  const when = (d?: string) => (d ? new Date(d).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' }) : '')

  if (view === 'roster') {
    lines.push([C.code, C.event, C.team, C.memberNo, C.name, C.college, C.status].map(csv).join(','))
    for (const r of regs) {
      ;(r.members || []).forEach((m: any, i: number) => {
        lines.push([r.registrationCode, ev(r), r.teamName, i + 1, m.name, m.college, r.status].map(csv).join(','))
      })
    }
  } else if (view === 'checkin') {
    lines.push([C.code, C.event, C.team, C.memberNo, C.name, C.college, C.leaderPhone, C.status, C.payment, C.idCheck, C.arrived].map(csv).join(','))
    for (const r of regs) {
      ;(r.members || []).forEach((m: any, i: number) => {
        lines.push([r.registrationCode, ev(r), r.teamName, i + 1, m.name, m.college, i === 0 ? r.leaderPhone : '', r.status, r.paymentStatus, r.idVerification, r.checkedIn ? when(r.checkedInAt) || C.arrivedYes : ''].map((v, k) => (k === 6 && !hasRole(user as any, SEE_LEADER_PHONE) ? '' : v)).map(csv).join(','))
      })
    }
  } else {
    // Each column follows the same field rules as the CMS (audit L6): e.g. a treasurer gets amounts but no contacts
    const may = (roles: StaffRole[]) => hasRole(user as any, roles)
    const cols: [string, (r: any) => unknown, boolean][] = [
      [C.code, (r) => r.registrationCode, true],
      [C.event, (r) => ev(r), true],
      [C.team, (r) => r.teamName, true],
      [C.leader, (r) => r.leaderName, true],
      [C.leaderEmail, (r) => r.leaderEmail, may(SEE_CONTACTS)],
      [C.leaderPhone, (r) => r.leaderPhone, may(SEE_LEADER_PHONE)],
      [C.leaderCollege, (r) => r.college, true],
      [C.members, (r) => (r.members || []).length, true],
      [C.amount, (r) => r.amountDue, may(SEE_MONEY)],
      [C.paymentStatus, (r) => r.paymentStatus, true],
      [C.paymentRef, (r) => r.paymentReference, may(SEE_MONEY)],
      [C.verifiedAt, (r) => when(r.verifiedAt), true],
      [C.status, (r) => r.status, true],
      [C.registeredAt, (r) => when(r.createdAt), true],
      ...((view === 'full'
        ? [
            [C.memberNames, (r: any) => (r.members || []).map((m: any) => m.name).join('; '), true],
            [C.memberColleges, (r: any) => (r.members || []).map((m: any) => m.college).join('; '), true],
            [C.idCheck, (r: any) => r.idVerification, true],
            [C.adminNotes, (r: any) => r.adminNotes, may(SEE_NOTES)],
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
