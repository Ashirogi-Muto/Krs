import React from 'react'
import { redirect } from 'next/navigation'
import type { AdminViewServerProps, Where } from 'payload'
import { DefaultTemplate } from '@payloadcms/next/templates'
import { Gutter } from '@payloadcms/ui'
import { ACCOUNT_TYPE_OPTIONS, STAFF_ROLE_OPTIONS, isAdmin, isSuperAdmin } from '../access/roles'
import { deletionDateText } from '../../lib/auth/participant'
import { AccountActions } from './AccountActions'

/**
 * CMS screen "Accounts" (/admin/accounts, admins only): every account with its confirmation and lock state, team
 * registrations, and one-click help (confirm, resend, password reset, unlock, delete). Full editing stays in Users.
 */
const PER_PAGE = 50
const TYPE_LABEL = Object.fromEntries(ACCOUNT_TYPE_OPTIONS.map((o) => [o.value, o.label]))
const ROLE_LABEL = Object.fromEntries(STAFF_ROLE_OPTIONS.map((o) => [o.value, o.label]))
const fmt = (d?: string | null) =>
  d ? new Date(d).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit', timeZone: 'Asia/Kolkata' }) : ''
const str = (v: unknown) => (typeof v === 'string' ? v : Array.isArray(v) && typeof v[0] === 'string' ? v[0] : '')

const th: React.CSSProperties = { textAlign: 'left', padding: '8px 10px', fontSize: 12, fontWeight: 600, color: 'var(--theme-elevation-600)', borderBottom: '1px solid var(--theme-elevation-150)' }
const td: React.CSSProperties = { padding: '10px', borderBottom: '1px solid var(--theme-elevation-100)', verticalAlign: 'top', fontSize: 13 }
const chip = (bg: string, fg: string): React.CSSProperties => ({ display: 'inline-block', padding: '2px 8px', borderRadius: 999, fontSize: 12, fontWeight: 600, background: bg, color: fg })
const input: React.CSSProperties = { padding: '8px 10px', borderRadius: 4, border: '1px solid var(--theme-elevation-150)', background: 'var(--theme-input-bg)', color: 'var(--theme-text)', fontSize: 14 }

export default async function AccountsView({ initPageResult, params, searchParams }: AdminViewServerProps) {
  const { req, permissions, locale, visibleEntities } = initPageResult
  const actor = req.user
  if (!actor) redirect('/admin/login?redirect=%2Fadmin%2Faccounts')
  const payload = req.payload
  const sp = (searchParams || {}) as Record<string, unknown>
  const q = str(sp.q).trim().slice(0, 100)
  const type = ['participants', 'team'].includes(str(sp.type)) ? str(sp.type) : 'all'
  const status = ['unconfirmed', 'confirmed', 'locked'].includes(str(sp.status)) ? str(sp.status) : 'all'
  const page = Math.max(1, Math.min(1000, Number(str(sp.page)) || 1))

  let body: React.ReactNode = <p>Only admins can manage accounts.</p>
  if (isAdmin(actor)) {
    const now = new Date().toISOString()
    const and: Where[] = []
    if (q) and.push({ or: [{ email: { like: q } }, { name: { like: q } }] })
    if (type === 'participants') and.push({ role: { equals: 'PARTICIPANT' } })
    if (type === 'team') and.push({ role: { not_equals: 'PARTICIPANT' } })
    if (status === 'unconfirmed') and.push({ role: { equals: 'PARTICIPANT' } }, { or: [{ emailVerified: { equals: false } }, { emailVerified: { exists: false } }] })
    if (status === 'confirmed') and.push({ role: { equals: 'PARTICIPANT' } }, { emailVerified: { equals: true } })
    if (status === 'locked') and.push({ lockUntil: { greater_than: now } })

    const count = (where: Where) => payload.count({ collection: 'users', where, overrideAccess: true }).then((r) => r.totalDocs)
    const [res, total, participants, unconfirmed] = await Promise.all([
      payload.find({ collection: 'users', where: and.length ? { and } : {}, sort: '-createdAt', limit: PER_PAGE, page, depth: 0, overrideAccess: true }),
      count({}),
      count({ role: { equals: 'PARTICIPANT' } }),
      count({ and: [{ role: { equals: 'PARTICIPANT' } }, { or: [{ emailVerified: { equals: false } }, { emailVerified: { exists: false } }] }] }),
    ])
    const users = res.docs as any[]
    // Registrations per account (linked as participant or registered as team leader), and confirmation emails in 24 h
    const [regCounts, mails] = await Promise.all([
      Promise.all(
        users.map((u) =>
          payload
            .count({
              collection: 'event-registrations',
              where: { or: [{ participants: { contains: u.id } }, { leaderEmail: { equals: String(u.email).toLowerCase() } }] },
              overrideAccess: true,
            })
            .then((r) => r.totalDocs),
        ),
      ),
      users.length
        ? payload.find({
            collection: 'email-outbox',
            where: {
              and: [
                { kind: { equals: 'ACCOUNT_VERIFICATION' } },
                { reference: { in: users.map((u) => `user ${u.id}`) } },
                { status: { not_equals: 'FAILED' } },
                { createdAt: { greater_than: new Date(Date.now() - 86_400_000).toISOString() } },
              ],
            },
            limit: 500,
            depth: 0,
            overrideAccess: true,
            select: { reference: true },
          })
        : Promise.resolve({ docs: [] as any[] }),
    ])
    const mailsFor = (id: number) => (mails.docs as any[]).filter((m) => m.reference === `user ${id}`).length
    const link = (patch: Record<string, string | number>) => {
      const p = new URLSearchParams({ ...(q ? { q } : {}), type, status, page: String(page), ...Object.fromEntries(Object.entries(patch).map(([k, v]) => [k, String(v)])) })
      return `/admin/accounts?${p}`
    }

    body = (
      <>
        <p style={{ color: 'var(--theme-elevation-600)', marginBottom: 16, maxWidth: 760 }}>
          {total} accounts: {participants} participants ({unconfirmed} not confirmed yet) and {total - participants} team accounts. Participants get
          at most 2 confirmation emails a day on their own; a resend from here is not limited but still counts toward today&apos;s email limit.
          Unconfirmed participant accounts are deleted 7 days after sign-up unless they are linked to a team. To change names, account types or
          roles, use <a href="/admin/collections/users">Users</a>.
        </p>
        <form method="get" action="/admin/accounts" style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 16 }}>
          <input name="q" defaultValue={q} placeholder="Search name or email" style={{ ...input, minWidth: 240 }} aria-label="Search name or email" />
          <select name="type" defaultValue={type} style={input} aria-label="Account type">
            <option value="all">All accounts</option>
            <option value="participants">Participants</option>
            <option value="team">Team & admins</option>
          </select>
          <select name="status" defaultValue={status} style={input} aria-label="Status">
            <option value="all">Any status</option>
            <option value="unconfirmed">Email not confirmed</option>
            <option value="confirmed">Email confirmed</option>
            <option value="locked">Locked (failed sign-ins)</option>
          </select>
          <button type="submit" className="btn btn--style-secondary btn--size-medium" style={{ margin: 0 }}>
            Filter
          </button>
        </form>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 900 }}>
            <thead>
              <tr>
                <th style={th}>Account</th>
                <th style={th}>Type</th>
                <th style={th}>Email confirmed</th>
                <th style={th}>Signed up</th>
                <th style={th}>Teams</th>
                <th style={th}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.length === 0 && (
                <tr>
                  <td style={td} colSpan={6}>
                    No accounts match.
                  </td>
                </tr>
              )}
              {users.map((u, i) => {
                const participant = u.role === 'PARTICIPANT'
                const locked = Boolean(u.lockUntil && new Date(u.lockUntil).getTime() > Date.now())
                const roles: string[] = Array.isArray(u.roles) ? u.roles : []
                const canManage = u.role !== 'SUPER_ADMIN' || isSuperAdmin(actor) || String(u.id) === String(actor.id)
                return (
                  <tr key={u.id}>
                    <td style={td}>
                      <a href={`/admin/collections/users/${u.id}`} style={{ fontWeight: 600 }}>
                        {u.name || '(no name)'}
                      </a>
                      <div style={{ color: 'var(--theme-elevation-600)', wordBreak: 'break-all' }}>{u.email}</div>
                      {u.institution && <div style={{ color: 'var(--theme-elevation-500)', fontSize: 12 }}>{u.institution}</div>}
                    </td>
                    <td style={td}>
                      {TYPE_LABEL[u.role] || u.role}
                      {roles.length > 0 && <div style={{ color: 'var(--theme-elevation-500)', fontSize: 12 }}>{roles.map((r) => ROLE_LABEL[r] || r).join(', ')}</div>}
                      {locked && <div style={{ ...chip('var(--theme-error-100)', 'var(--theme-error-800)'), marginTop: 4 }}>Locked until {fmt(u.lockUntil)}</div>}
                    </td>
                    <td style={td}>
                      {!participant ? (
                        <span style={{ color: 'var(--theme-elevation-500)' }}>Not needed</span>
                      ) : u.emailVerified ? (
                        <span style={chip('var(--theme-success-100)', 'var(--theme-success-800)')}>Confirmed {fmt(u.emailVerifiedAt)}</span>
                      ) : (
                        <>
                          <span style={chip('var(--theme-warning-100)', 'var(--theme-warning-800)')}>Not confirmed</span>
                          <div style={{ color: 'var(--theme-elevation-500)', fontSize: 12, marginTop: 4 }}>
                            {mailsFor(u.id)} email(s) in 24 h · deleted on {deletionDateText(u.createdAt)} if not confirmed
                          </div>
                        </>
                      )}
                    </td>
                    <td style={td}>{fmt(u.createdAt)}</td>
                    <td style={td}>{regCounts[i] || 0}</td>
                    <td style={td}>
                      {canManage ? (
                        <AccountActions
                          userId={u.id}
                          label={u.email}
                          canConfirm={participant && !u.emailVerified}
                          canUnlock={locked}
                          canDelete={isSuperAdmin(actor) && String(u.id) !== String(actor.id) && u.role !== 'SUPER_ADMIN' && !(regCounts[i] > 0)}
                        />
                      ) : (
                        <span style={{ color: 'var(--theme-elevation-500)', fontSize: 12 }}>Super Admin only</span>
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
        {res.totalPages > 1 && (
          <div style={{ display: 'flex', gap: 16, alignItems: 'center', marginTop: 16, fontSize: 13 }}>
            {res.hasPrevPage && <a href={link({ page: page - 1 })}>← Previous</a>}
            <span>
              Page {res.page} of {res.totalPages} ({res.totalDocs} accounts)
            </span>
            {res.hasNextPage && <a href={link({ page: page + 1 })}>Next →</a>}
          </div>
        )}
      </>
    )
  }

  return (
    <DefaultTemplate
      i18n={req.i18n}
      locale={locale}
      params={params}
      payload={payload}
      permissions={permissions}
      searchParams={searchParams}
      user={actor}
      visibleEntities={visibleEntities}
    >
      <Gutter>
        <div style={{ padding: '24px 0 64px' }}>
          <h1 style={{ marginBottom: 8 }}>Accounts</h1>
          {body}
        </div>
      </Gutter>
    </DefaultTemplate>
  )
}
