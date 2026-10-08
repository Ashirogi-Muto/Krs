import React from 'react'
import {
  OVERVIEW,
  assignedEventIds,
  checkInScope,
  PAYMENT_MATCHERS,
  exportViews,
  hasRole,
  holds,
  limitedToAssignedEvents,
  type ExportView,
  type StaffRole,
  isSuperAdmin,
} from '../access/roles'
import { findDue } from '@/lib/retention'
import { getStaffTexts } from '@/lib/staff-texts'
import { fill } from '@/lib/form-texts-defaults'
import type { StaffTexts } from '@/lib/staff-texts-defaults'

/**
 * Admin dashboard panels (shown above the collection cards), one per role the signed-in account holds:
 * overview (admins, president, event head, core members, supervisors), finance (finance, treasurer),
 * registration team, technical events (assigned events only), counts per event (logistics, decoration,
 * discipline, tech support) and totals (sponsors, media). Numbers are aggregated on the server; no
 * personal data is rendered here, so it reads with overrideAccess and filters tech-event rows itself.
 */
type Reg = {
  event: number | { id: number; title?: string; slug?: string }
  college?: string | null
  members?: { college?: string | null }[]
  amountDue?: number | null
  status?: string
  paymentStatus?: string
  idVerification?: string
}
type Row = {
  id: string
  title: string
  teams: number
  members: number
  confirmed: number
  awaitingPay: number
  paid: number
  idPending: number
  idApproved: number
  expected: number
  verified: number
}
type Col = [string, (r: Row) => string | number]
type Panel = { title: string; note: string; kpis: [string, string, string?][]; cols: Col[]; rows: Row[] }

const inr = (n: number) => `₹${n.toLocaleString('en-IN')}`
const listUrl = (where: string) => `/admin/collections/event-registrations?${where}`
const cell: React.CSSProperties = { padding: '8px 10px', borderBottom: '1px solid var(--theme-elevation-100)', textAlign: 'right' }
const head: React.CSSProperties = { ...cell, fontWeight: 600, color: 'var(--theme-elevation-600)', fontSize: 12 }
const card: React.CSSProperties = {
  border: '1px solid var(--theme-elevation-100)',
  borderRadius: 8,
  padding: '14px 16px',
  background: 'var(--theme-elevation-50)',
  minWidth: 150,
}
const exportLabels = (D: StaffTexts['dashboard']): Record<ExportView, string> => ({
  full: D.exportFull,
  finance: D.exportFinance,
  checkin: D.exportCheckin,
  roster: D.exportRoster,
})
const COUNT_ROLES: StaffRole[] = ['LOGISTICS', 'DECORATION', 'DISCIPLINE', 'TECH_SUPPORT']

const sum = (rows: Row[]) =>
  rows.reduce(
    (t, r) => {
      for (const k of Object.keys(t) as (keyof typeof t)[]) t[k] += r[k]
      return t
    },
    { teams: 0, members: 0, confirmed: 0, awaitingPay: 0, paid: 0, idPending: 0, idApproved: 0, expected: 0, verified: 0 }
  )

export default async function RoleDashboard(props: any) {
  const { payload, user } = props
  if (!payload || !user) return null
  const D = (await getStaffTexts(payload)).dashboard // wording: CMS → Admin tools → Staff & admin texts

  const showOverview = hasRole(user, OVERVIEW)
  const showFinance = !showOverview && hasRole(user, ['FINANCE', 'TREASURER'])
  const showRegistration = !showOverview && holds(user, 'REGISTRATION')
  const showTechEvents = !showOverview && holds(user, 'TECH_EVENT')
  const showCounts = !showOverview && COUNT_ROLES.some((r) => holds(user, r))
  const showTotals = !showOverview && (holds(user, 'SPONSORS') || holds(user, 'MEDIA'))
  if (!showOverview && !showFinance && !showRegistration && !showTechEvents && !showCounts && !showTotals) return null

  const [regResult, eventResult] = await Promise.all([
    payload.find({
      collection: 'event-registrations',
      overrideAccess: true,
      depth: 1,
      pagination: false,
      select: { event: true, college: true, members: { college: true }, amountDue: true, status: true, paymentStatus: true, idVerification: true },
    }),
    payload.find({
      collection: 'events',
      overrideAccess: true,
      depth: 0,
      pagination: false,
      where: { status: { not_equals: 'DRAFT' } },
      select: { prizePool: true },
    }),
  ])
  const regs = regResult.docs as Reg[]

  const byEvent = new Map<string, Row>()
  const colleges = new Set<string>()
  for (const r of regs) {
    const ev = typeof r.event === 'object' ? r.event : { id: r.event, title: fill(D.eventFallback, { id: r.event }) }
    const key = String(ev.id)
    const row =
      byEvent.get(key) ||
      ({ id: key, title: ev.title || key, teams: 0, members: 0, confirmed: 0, awaitingPay: 0, paid: 0, idPending: 0, idApproved: 0, expected: 0, verified: 0 } as Row)
    const active = r.status !== 'CANCELLED' && r.status !== 'REJECTED'
    row.teams += 1
    row.members += Array.isArray(r.members) ? r.members.length : 0
    if (r.status === 'CONFIRMED') row.confirmed += 1
    if (r.paymentStatus === 'AWAITING_PAYMENT' && active) row.awaitingPay += 1
    if (r.paymentStatus === 'PAID_VERIFIED') {
      row.paid += 1
      row.verified += r.amountDue || 0
    }
    if (r.idVerification === 'PENDING' && active) row.idPending += 1
    if (r.idVerification === 'APPROVED') row.idApproved += 1
    if (active) row.expected += r.amountDue || 0
    byEvent.set(key, row)
    if (active) {
      for (const c of [r.college, ...(r.members || []).map((m) => m.college)]) {
        const name = (c || '').trim().toLowerCase()
        if (name) colleges.add(name)
      }
    }
  }
  const all = [...byEvent.values()].sort((a, b) => a.title.localeCompare(b.title))
  const total = sum(all)
  const prizePools = (eventResult.docs as { prizePool?: number | null }[]).reduce((t, e) => t + (e.prizePool || 0), 0)

  const panels: Panel[] = []
  if (showOverview) {
    panels.push({
      title: D.overviewTitle,
      note: D.overviewNote,
      kpis: [
        [D.teams, String(total.teams)],
        [D.participants, String(total.members)],
        [D.confirmed, String(total.confirmed), listUrl('where[status][equals]=CONFIRMED')],
        [D.awaitingPayment, String(total.awaitingPay), listUrl('where[paymentStatus][equals]=AWAITING_PAYMENT')],
        [D.idsToCheck, String(total.idPending), listUrl('where[idVerification][equals]=PENDING')],
        [D.verifiedRevenue, inr(total.verified)],
      ],
      cols: [
        [D.teams, (r) => r.teams],
        [D.participants, (r) => r.members],
        [D.confirmed, (r) => r.confirmed],
        [D.awaitingPayment, (r) => r.awaitingPay],
        [D.paid, (r) => r.paid],
        [D.idsPending, (r) => r.idPending],
        [D.idsApproved, (r) => r.idApproved],
        [D.expected, (r) => inr(r.expected)],
        [D.verified, (r) => inr(r.verified)],
      ],
      rows: all,
    })
  }
  if (showFinance) {
    panels.push({
      title: D.financeTitle,
      note: holds(user, 'FINANCE') ? D.financeNote : D.financeReadOnly,
      kpis: [
        [D.verifiedRevenue, inr(total.verified)],
        [D.expectedActive, inr(total.expected)],
        [D.awaitingPayment, String(total.awaitingPay), listUrl('where[paymentStatus][equals]=AWAITING_PAYMENT')],
      ],
      cols: [
        [D.teams, (r) => r.teams],
        [D.awaitingPayment, (r) => r.awaitingPay],
        [D.paid, (r) => r.paid],
        [D.expected, (r) => inr(r.expected)],
        [D.verified, (r) => inr(r.verified)],
      ],
      rows: all,
    })
  }
  if (showRegistration) {
    panels.push({
      title: D.deskTitle,
      note: D.deskNote,
      kpis: [
        [D.idsToCheck, String(total.idPending), listUrl('where[idVerification][equals]=PENDING')],
        [D.awaitingConfirmation, String(regs.filter((r) => (r.status || 'PENDING') === 'PENDING').length), listUrl('where[status][equals]=PENDING')],
        [D.teams, String(total.teams)],
        [D.participants, String(total.members)],
      ],
      cols: [
        [D.teams, (r) => r.teams],
        [D.participants, (r) => r.members],
        [D.confirmed, (r) => r.confirmed],
        [D.idsPending, (r) => r.idPending],
        [D.idsApproved, (r) => r.idApproved],
      ],
      rows: all,
    })
  }
  if (showTechEvents) {
    const ids = assignedEventIds(user).map(String)
    const mine = limitedToAssignedEvents(user) ? all.filter((r) => ids.includes(r.id)) : all
    const t = sum(mine)
    panels.push({
      title: D.yourEventsTitle,
      note:
        limitedToAssignedEvents(user) && ids.length === 0
          ? D.yourEventsNone
          : D.yourEventsNote,
      kpis: [
        [D.teams, String(t.teams)],
        [D.participants, String(t.members)],
        [D.confirmed, String(t.confirmed)],
      ],
      cols: [
        [D.teams, (r) => r.teams],
        [D.participants, (r) => r.members],
        [D.confirmed, (r) => r.confirmed],
        [D.paid, (r) => r.paid],
      ],
      rows: mine,
    })
  }
  if (showCounts) {
    panels.push({
      title: D.perEventTitle,
      note: D.perEventNote,
      kpis: [
        [D.teams, String(total.teams)],
        [D.participants, String(total.members)],
        [D.confirmed, String(total.confirmed)],
      ],
      cols: [
        [D.teams, (r) => r.teams],
        [D.participants, (r) => r.members],
        [D.confirmed, (r) => r.confirmed],
      ],
      rows: all,
    })
  }
  if (showTotals) {
    panels.push({
      title: D.numbersTitle,
      note: D.numbersNote,
      kpis: [
        [D.registrationsTeams, String(total.teams)],
        [D.participants, String(total.members)],
        [D.colleges, String(colleges.size)],
        [D.events, String(eventResult.docs.length)],
        [D.prizePools, inr(prizePools)],
      ],
      cols: [],
      rows: [],
    })
  }

  const exports = exportViews(user)
  const canCheckIn = checkInScope(user) !== null

  const dueForDeletion = isSuperAdmin(user) ? await findDue(payload).catch(() => []) : []

  return (
    <div style={{ marginBottom: 32 }}>
      {dueForDeletion.length > 0 && (
        <a href="/retention" style={{ ...card, display: 'block', marginBottom: 20, borderColor: '#ef4444', textDecoration: 'none', color: 'inherit' }}>
          <strong>{D.dueTitle}</strong> {fill(D.dueText, { events: dueForDeletion.map((e) => e.title).join(', ') })}
        </a>
      )}
      {panels.map((p) => (
        <section key={p.title} style={{ marginBottom: 28 }}>
          <h2 style={{ marginBottom: 4 }}>{p.title}</h2>
          <p style={{ color: 'var(--theme-elevation-500)', marginTop: 0 }}>{p.note}</p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, margin: '12px 0 20px' }}>
            {p.kpis.map(([label, value, href]) => (
              <a key={label} href={href || undefined} style={{ ...card, textDecoration: 'none', color: 'inherit', cursor: href ? 'pointer' : 'default' }}>
                <div style={{ fontSize: 12, color: 'var(--theme-elevation-500)' }}>{label}</div>
                <div style={{ fontSize: 26, fontWeight: 700 }}>{value}</div>
              </a>
            ))}
          </div>
          {p.cols.length > 0 && p.rows.length > 0 && (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ borderCollapse: 'collapse', width: '100%', fontSize: 14 }}>
                <thead>
                  <tr>
                    <th style={{ ...head, textAlign: 'left' }}>{D.eventColumn}</th>
                    {p.cols.map(([label]) => (
                      <th key={label} style={head}>
                        {label}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {p.rows.map((r) => (
                    <tr key={r.id}>
                      <td style={{ ...cell, textAlign: 'left' }}>{r.title}</td>
                      {p.cols.map(([label, value]) => (
                        <td key={label} style={cell}>
                          {value(r)}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      ))}
      {(exports.length > 0 || canCheckIn || hasRole(user, PAYMENT_MATCHERS)) && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
          {canCheckIn && (
            <a href="/checkin" className="btn btn--style-primary btn--size-small" style={{ margin: 0 }}>
              {D.checkinButton}
            </a>
          )}
          {hasRole(user, PAYMENT_MATCHERS) && (
            <a href="/payment-matching" className="btn btn--style-primary btn--size-small" style={{ margin: 0 }}>
              {D.paymentsButton}
            </a>
          )}
          {exports.map((v) => (
            <a key={v} href={`/api/admin/registrations-export?view=${v}`} className="btn btn--style-secondary btn--size-small" style={{ margin: 0 }}>
              {exportLabels(D)[v]}
            </a>
          ))}
        </div>
      )}
    </div>
  )
}
