import React from 'react'
import { hasRole } from '../access/roles'

/**
 * Admin dashboard panel (shown above the collection cards). Each team sees its own metrics:
 * managers everything, finance money, verifiers the ID queue, coordinators only their assigned events.
 * Data is read with the signed-in user's own access rules (overrideAccess: false).
 */
type Reg = {
  event: number | { id: number; title?: string; slug?: string }
  members?: unknown[]
  amountDue?: number | null
  status?: string
  paymentStatus?: string
  idVerification?: string
}
type Row = {
  title: string
  slug: string
  teams: number
  members: number
  confirmed: number
  awaitingPay: number
  paid: number
  payNotFound: number
  idPending: number
  idApproved: number
  idRejected: number
  expected: number
  verified: number
}

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

export default async function RoleDashboard(props: any) {
  const { payload, user } = props
  if (!payload || !user) return null
  const role: string = user.role
  const isMgr = hasRole(user, ['SUPER_ADMIN', 'ADMIN', 'ORGANIZER'])
  const isFinance = role === 'FINANCE'
  const isVerifier = role === 'VERIFIER'
  const isCoordinator = role === 'COORDINATOR'
  if (!isMgr && !isFinance && !isVerifier && !isCoordinator) return null

  const result = await payload.find({
    collection: 'event-registrations',
    user,
    overrideAccess: false,
    depth: 1,
    pagination: false,
    select: { event: true, members: true, amountDue: true, status: true, paymentStatus: true, idVerification: true },
  })
  const regs = result.docs as Reg[]

  const rows = new Map<string, Row>()
  for (const r of regs) {
    const ev = typeof r.event === 'object' ? r.event : { id: r.event, title: `Event ${r.event}`, slug: '' }
    const key = String(ev.id)
    const row =
      rows.get(key) ||
      ({ title: ev.title || key, slug: ev.slug || '', teams: 0, members: 0, confirmed: 0, awaitingPay: 0, paid: 0, payNotFound: 0, idPending: 0, idApproved: 0, idRejected: 0, expected: 0, verified: 0 } as Row)
    const active = r.status !== 'CANCELLED' && r.status !== 'REJECTED'
    row.teams += 1
    row.members += Array.isArray(r.members) ? r.members.length : 0
    if (r.status === 'CONFIRMED') row.confirmed += 1
    if (r.paymentStatus === 'AWAITING_PAYMENT' && active) row.awaitingPay += 1
    if (r.paymentStatus === 'PAID_VERIFIED') {
      row.paid += 1
      row.verified += r.amountDue || 0
    }
    if (r.paymentStatus === 'NOT_FOUND') row.payNotFound += 1
    if (r.idVerification === 'PENDING' && active) row.idPending += 1
    if (r.idVerification === 'APPROVED') row.idApproved += 1
    if (r.idVerification === 'REJECTED') row.idRejected += 1
    if (active) row.expected += r.amountDue || 0
    rows.set(key, row)
  }
  const list = [...rows.values()].sort((a, b) => a.title.localeCompare(b.title))
  const total = list.reduce(
    (t, r) => ({ ...t, teams: t.teams + r.teams, members: t.members + r.members, confirmed: t.confirmed + r.confirmed, awaitingPay: t.awaitingPay + r.awaitingPay, paid: t.paid + r.paid, payNotFound: t.payNotFound + r.payNotFound, idPending: t.idPending + r.idPending, expected: t.expected + r.expected, verified: t.verified + r.verified }),
    { teams: 0, members: 0, confirmed: 0, awaitingPay: 0, paid: 0, payNotFound: 0, idPending: 0, expected: 0, verified: 0 }
  )

  const title = isMgr ? 'AURIX registrations — overview' : isFinance ? 'Finance' : isVerifier ? 'ID verification' : 'Your events'
  const kpis: [string, string, string?][] = isFinance
    ? [
        ['Verified revenue', inr(total.verified)],
        ['Expected (active teams)', inr(total.expected)],
        ['Awaiting payment', String(total.awaitingPay), listUrl('where[paymentStatus][equals]=AWAITING_PAYMENT')],
        ['Payment not found', String(total.payNotFound), listUrl('where[paymentStatus][equals]=NOT_FOUND')],
      ]
    : isVerifier
      ? [
          ['IDs to check', String(total.idPending), listUrl('where[idVerification][equals]=PENDING')],
          ['Teams', String(total.teams)],
          ['Participants', String(total.members)],
        ]
      : [
          ['Teams', String(total.teams)],
          ['Participants', String(total.members)],
          ['Confirmed', String(total.confirmed), listUrl('where[status][equals]=CONFIRMED')],
          ['Awaiting payment', String(total.awaitingPay), listUrl('where[paymentStatus][equals]=AWAITING_PAYMENT')],
          ['IDs to check', String(total.idPending), listUrl('where[idVerification][equals]=PENDING')],
          ...(isMgr ? ([['Verified revenue', inr(total.verified)]] as [string, string][]) : []),
        ]

  const exports: [string, string][] = isMgr
    ? [['Full export (CSV)', '/api/admin/registrations-export?view=full'], ['Finance (CSV)', '/api/admin/registrations-export?view=finance'], ['Check-in list (CSV)', '/api/admin/registrations-export?view=checkin']]
    : isFinance
      ? [['Finance export (CSV)', '/api/admin/registrations-export?view=finance']]
      : isCoordinator
        ? [['Check-in list (CSV)', '/api/admin/registrations-export?view=checkin']]
        : []

  return (
    <div style={{ marginBottom: 32 }}>
      <h2 style={{ marginBottom: 4 }}>{title}</h2>
      <p style={{ color: 'var(--theme-elevation-500)', marginTop: 0 }}>
        {isCoordinator && list.length === 0
          ? 'No events are assigned to your account yet — ask an admin to add them under Users → Assigned events.'
          : 'Live numbers from team registrations. Click a number to open the matching list.'}
      </p>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, margin: '12px 0 20px' }}>
        {kpis.map(([label, value, href]) => (
          <a key={label} href={href || undefined} style={{ ...card, textDecoration: 'none', color: 'inherit', cursor: href ? 'pointer' : 'default' }}>
            <div style={{ fontSize: 12, color: 'var(--theme-elevation-500)' }}>{label}</div>
            <div style={{ fontSize: 26, fontWeight: 700 }}>{value}</div>
          </a>
        ))}
      </div>
      {list.length > 0 && (
        <div style={{ overflowX: 'auto' }}>
          <table style={{ borderCollapse: 'collapse', width: '100%', fontSize: 14 }}>
            <thead>
              <tr>
                <th style={{ ...head, textAlign: 'left' }}>Event</th>
                <th style={head}>Teams</th>
                <th style={head}>Participants</th>
                {!isVerifier && <th style={head}>Confirmed</th>}
                {!isVerifier && <th style={head}>Awaiting payment</th>}
                {!isVerifier && <th style={head}>Paid</th>}
                {!isFinance && <th style={head}>IDs pending</th>}
                {!isFinance && <th style={head}>IDs approved</th>}
                {(isMgr || isFinance) && <th style={head}>Expected</th>}
                {(isMgr || isFinance) && <th style={head}>Verified</th>}
              </tr>
            </thead>
            <tbody>
              {list.map((r) => (
                <tr key={r.title}>
                  <td style={{ ...cell, textAlign: 'left' }}>{r.title}</td>
                  <td style={cell}>{r.teams}</td>
                  <td style={cell}>{r.members}</td>
                  {!isVerifier && <td style={cell}>{r.confirmed}</td>}
                  {!isVerifier && <td style={cell}>{r.awaitingPay}</td>}
                  {!isVerifier && <td style={cell}>{r.paid}</td>}
                  {!isFinance && <td style={cell}>{r.idPending}</td>}
                  {!isFinance && <td style={cell}>{r.idApproved}</td>}
                  {(isMgr || isFinance) && <td style={cell}>{inr(r.expected)}</td>}
                  {(isMgr || isFinance) && <td style={cell}>{inr(r.verified)}</td>}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {exports.length > 0 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, marginTop: 16 }}>
          {exports.map(([label, href]) => (
            <a key={label} href={href} className="btn btn--style-secondary btn--size-small" style={{ margin: 0 }}>
              {label}
            </a>
          ))}
        </div>
      )}
    </div>
  )
}
