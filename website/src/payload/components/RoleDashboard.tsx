import React from 'react'
import { getExportTexts } from '../../lib/export-texts'
import type { ExportTexts } from '../../lib/export-texts-defaults'
import { can, checkInScope, eventScope, holdsKey } from '../access/permissions'
import { findDue } from '@/lib/retention'
import { getStaffTexts } from '@/lib/staff-texts'
import { fill } from '@/lib/form-texts-defaults'
import type { StaffTexts } from '@/lib/staff-texts-defaults'
import { withAccessRoles } from '../access/withAccessRoles'

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
const exportLabels = (D: StaffTexts['dashboard'], E: ExportTexts): Record<'full' | 'finance' | 'checkin' | 'roster' | 'members', string> => ({
  full: D.exportFull,
  finance: D.exportFinance,
  checkin: D.exportCheckin,
  roster: D.exportRoster,
  // Team members (owner, 21 Oct 2026): CMS → Website → Export texts
  members: E.bar.dashboardMembers,
})

const sum = (rows: Row[]) =>
  rows.reduce(
    (t, r) => {
      for (const k of Object.keys(t) as (keyof typeof t)[]) t[k] += r[k]
      return t
    },
    { teams: 0, members: 0, confirmed: 0, awaitingPay: 0, paid: 0, idPending: 0, idApproved: 0, expected: 0, verified: 0 }
  )

export default async function RoleDashboard(props: any) {
  const { payload } = props
  if (!payload || !props.user) return null
  const user = await withAccessRoles(payload, props.user)
  const texts = await getStaffTexts(payload)
  const D = texts.dashboard // wording: CMS → Admin tools → Staff & admin texts
  const G = texts.guide

  // One panel per "Dashboard" permission of the access roles; the overview includes the others, so it replaces them
  const showOverview = can(user, 'dashboard.overview')
  const showFinance = !showOverview && can(user, 'dashboard.finance')
  const showRegistration = !showOverview && can(user, 'dashboard.desk')
  const showTechEvents = !showOverview && holdsKey(user, 'dashboard.events')
  const showCounts = !showOverview && can(user, 'dashboard.counts')
  const showTotals = !showOverview && can(user, 'dashboard.totals')
  // Every CMS user gets the link to the "Where to edit" guide
  const guideLink = (
    <a href="/admin/where-to-edit" style={{ ...card, display: 'block', marginBottom: 20, textDecoration: 'none', color: 'inherit' }}>
      {G.dashboardLink}
    </a>
  )
  if (!showOverview && !showFinance && !showRegistration && !showTechEvents && !showCounts && !showTotals) return guideLink

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
  const everything = [...byEvent.values()].sort((a, b) => a.title.localeCompare(b.title))
  // Each panel counts only the events its permission covers (access roles can be limited to some events)
  const scoped = (key: string) => {
    const scope = eventScope(user, key)
    const keep = scope === 'all' ? null : new Set(scope.map(String))
    const rows = keep ? everything.filter((r) => keep.has(r.id)) : everything
    const pending = regs.filter((r) => (!keep || keep.has(String(typeof r.event === 'object' ? r.event?.id : r.event))) && (r.status || 'PENDING') === 'PENDING').length
    return { rows, total: sum(rows), pending }
  }
  const prizePools = (eventResult.docs as { prizePool?: number | null }[]).reduce((t, e) => t + (e.prizePool || 0), 0)

  const panels: Panel[] = []
  if (showOverview) {
    const { rows: all, total } = scoped('dashboard.overview')
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
    const { rows: all, total } = scoped('dashboard.finance')
    panels.push({
      title: D.financeTitle,
      note: can(user, 'registrations.editPayment') ? D.financeNote : D.financeReadOnly,
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
    const { rows: all, total, pending } = scoped('dashboard.desk')
    panels.push({
      title: D.deskTitle,
      note: D.deskNote,
      kpis: [
        [D.idsToCheck, String(total.idPending), listUrl('where[idVerification][equals]=PENDING')],
        [D.awaitingConfirmation, String(pending), listUrl('where[status][equals]=PENDING')],
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
    const { rows: mine, total: t } = scoped('dashboard.events')
    panels.push({
      title: D.yourEventsTitle,
      note: can(user, 'dashboard.events') ? D.yourEventsNote : D.yourEventsNone,
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
    const { rows: all, total } = scoped('dashboard.counts')
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
    const { total } = scoped('dashboard.totals')
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

  const exports = (['full', 'finance', 'checkin', 'roster', 'members'] as const).filter((v) => can(user, `exports.${v}`))
  const E = await getExportTexts()
  const canCheckIn = checkInScope(user) !== null

  const dueForDeletion = can(user as any, 'admin.retention') ? await findDue(payload).catch(() => []) : []

  return (
    <div style={{ marginBottom: 32 }}>
      {guideLink}
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
      {(exports.length > 0 || canCheckIn || can(user, 'tools.paymentMatching')) && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
          {canCheckIn && (
            <a href="/checkin" className="btn btn--style-primary btn--size-small" style={{ margin: 0 }}>
              {D.checkinButton}
            </a>
          )}
          {can(user, 'tools.paymentMatching') && (
            <a href="/admin/payment-matching" className="btn btn--style-primary btn--size-small" style={{ margin: 0 }}>
              {D.paymentsButton}
            </a>
          )}
          {exports.map((v) => (
            <a key={v} href={`/api/admin/registrations-export?view=${v}`} className="btn btn--style-secondary btn--size-small" style={{ margin: 0 }}>
              {exportLabels(D, E)[v]}
            </a>
          ))}
        </div>
      )}
    </div>
  )
}
