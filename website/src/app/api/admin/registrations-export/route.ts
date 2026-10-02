import { headers } from 'next/headers'
import { getPayload } from 'payload'
import config from '@payload-config'
import { assignedEventIds, exportViews, limitedToAssignedEvents, type ExportView } from '@/payload/access/roles'
import { logger } from '@/lib/logger'

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
  const payload = await getPayload({ config })
  const { user } = await payload.auth({ headers: await headers() })
  const url = new URL(req.url)
  const view = (url.searchParams.get('view') || 'checkin') as View
  if (!user || !exportViews(user).includes(view)) {
    return new Response('Not allowed', { status: 403 })
  }

  const eventSlug = url.searchParams.get('event')
  // Permission was checked above and the columns are fixed per view; tech-event members get their events only
  const limited = limitedToAssignedEvents(user)
  const ids = assignedEventIds(user)
  if (limited && ids.length === 0) return new Response('No events are assigned to your account', { status: 403 })
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

  const lines: string[] = []
  const ev = (r: any) => (typeof r.event === 'object' ? r.event?.title : r.event)
  const when = (d?: string) => (d ? new Date(d).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' }) : '')

  if (view === 'roster') {
    lines.push(['Registration code', 'Event', 'Team', 'Member #', 'Name', 'College', 'Status'].map(csv).join(','))
    for (const r of regs) {
      ;(r.members || []).forEach((m: any, i: number) => {
        lines.push([r.registrationCode, ev(r), r.teamName, i + 1, m.name, m.college, r.status].map(csv).join(','))
      })
    }
  } else if (view === 'checkin') {
    lines.push(['Registration code', 'Event', 'Team', 'Member #', 'Name', 'College', 'Leader phone', 'Status', 'Payment', 'ID check'].map(csv).join(','))
    for (const r of regs) {
      ;(r.members || []).forEach((m: any, i: number) => {
        lines.push([r.registrationCode, ev(r), r.teamName, i + 1, m.name, m.college, i === 0 ? r.leaderPhone : '', r.status, r.paymentStatus, r.idVerification].map(csv).join(','))
      })
    }
  } else {
    const base = ['Registration code', 'Event', 'Team', 'Leader', 'Leader email', 'Leader phone', 'Leader college', 'Members', 'Amount (INR)', 'Payment status', 'Payment reference', 'Verified at', 'Status', 'Registered at']
    const extra = view === 'full' ? ['Member names', 'Member colleges', 'ID check', 'Admin notes'] : []
    lines.push([...base, ...extra].map(csv).join(','))
    for (const r of regs) {
      const members = r.members || []
      const row = [r.registrationCode, ev(r), r.teamName, r.leaderName, r.leaderEmail, r.leaderPhone, r.college, members.length, r.amountDue, r.paymentStatus, r.paymentReference, when(r.verifiedAt), r.status, when(r.createdAt)]
      if (view === 'full') row.push(members.map((m: any) => m.name).join('; '), members.map((m: any) => m.college).join('; '), r.idVerification, r.adminNotes)
      lines.push(row.map(csv).join(','))
    }
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
