import React from 'react'
import { redirect } from 'next/navigation'
import type { AdminViewServerProps, Payload, Where } from 'payload'
import { DefaultTemplate } from '@payloadcms/next/templates'
import { Gutter } from '@payloadcms/ui'
import { ACCOUNT_TYPE_OPTIONS, STAFF_ROLE_OPTIONS, isAdmin, isSuperAdmin } from '../access/roles'
import { deletionDateText } from '../../lib/auth/participant'
import { AccountActions } from './AccountActions'

/**
 * CMS screens "Participants" (/admin/participants) and "Team accounts" (/admin/team-accounts), admins only:
 * search, filters, confirmation and lock state, teams, and one-click help (confirm, resend, password reset,
 * unlock, delete). Participants and the team are kept apart (owner, 4 Oct 2026). Full editing stays in Users.
 */
export type AccountsKind = 'participants' | 'team'
const PER_PAGE = 50
const TYPE_LABEL = Object.fromEntries(ACCOUNT_TYPE_OPTIONS.map((o) => [o.value, o.label]))
const ROLE_LABEL = Object.fromEntries(STAFF_ROLE_OPTIONS.map((o) => [o.value, o.label]))
const TEAM_TYPES = ACCOUNT_TYPE_OPTIONS.filter((o) => o.value !== 'PARTICIPANT')
const SORTS: Record<string, [string, string]> = {
  newest: ['-createdAt', 'Newest first'],
  oldest: ['createdAt', 'Oldest first'],
  name: ['name', 'Name A–Z'],
  email: ['email', 'Email A–Z'],
}
const fmt = (d?: string | null) =>
  d ? new Date(d).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit', timeZone: 'Asia/Kolkata' }) : ''
const str = (v: unknown) => (typeof v === 'string' ? v : Array.isArray(v) && typeof v[0] === 'string' ? v[0] : '')
const pick = (v: string, allowed: string[], def: string) => (allowed.includes(v) ? v : def)
const plural = (n: number, one: string, many: string) => `${n} ${n === 1 ? one : many}`

const th: React.CSSProperties = { textAlign: 'left', padding: '8px 10px', fontSize: 12, fontWeight: 600, color: 'var(--theme-elevation-600)', borderBottom: '1px solid var(--theme-elevation-150)' }
const td: React.CSSProperties = { padding: '10px', borderBottom: '1px solid var(--theme-elevation-100)', verticalAlign: 'top', fontSize: 13 }
const chip = (bg: string, fg: string): React.CSSProperties => ({ display: 'inline-block', padding: '2px 8px', borderRadius: 999, fontSize: 12, fontWeight: 600, background: bg, color: fg })
const input: React.CSSProperties = { padding: '8px 10px', borderRadius: 4, border: '1px solid var(--theme-elevation-150)', background: 'var(--theme-input-bg)', color: 'var(--theme-text)', fontSize: 14 }
const unconfirmed: Where = { or: [{ emailVerified: { equals: false } }, { emailVerified: { exists: false } }] }

/** User IDs and leader emails that belong to at least one registration (for the "has a team" filter and counts). */
async function registrationLinks(payload: Payload) {
  const res = await payload.find({
    collection: 'event-registrations',
    limit: 5000,
    depth: 0,
    overrideAccess: true,
    select: { participants: true, leaderEmail: true },
  })
  const ids = new Map<string, number>()
  const emails = new Map<string, number>()
  for (const r of res.docs as any[]) {
    for (const p of r.participants || []) {
      const id = String(typeof p === 'object' ? p?.id : p)
      ids.set(id, (ids.get(id) || 0) + 1)
    }
    if (r.leaderEmail) emails.set(String(r.leaderEmail).toLowerCase(), (emails.get(String(r.leaderEmail).toLowerCase()) || 0) + 1)
  }
  return { ids, emails }
}

export async function AccountsScreen({ kind, initPageResult, params, searchParams }: AdminViewServerProps & { kind: AccountsKind }) {
  const { req, permissions, locale, visibleEntities } = initPageResult
  const actor = req.user
  const self = kind === 'participants' ? '/admin/participants' : '/admin/team-accounts'
  if (!actor) redirect(`/admin/login?redirect=${encodeURIComponent(self)}`)
  const payload = req.payload
  const title = kind === 'participants' ? 'Participants' : 'Team accounts'

  const sp = (searchParams || {}) as Record<string, unknown>
  const q = str(sp.q).trim().slice(0, 100)
  const status = pick(str(sp.status), ['all', 'unconfirmed', 'confirmed', 'locked'], 'all')
  const team = pick(str(sp.team), ['all', 'yes', 'no'], 'all')
  const type = pick(str(sp.type), ['all', ...TEAM_TYPES.map((t) => t.value)], 'all')
  const role = pick(str(sp.role), ['all', ...STAFF_ROLE_OPTIONS.map((r) => r.value)], 'all')
  const sort = pick(str(sp.sort), Object.keys(SORTS), 'newest')
  const page = Math.max(1, Math.min(1000, Number(str(sp.page)) || 1))

  let body: React.ReactNode = <p>Only admins can manage accounts.</p>
  if (isAdmin(actor)) {
    const links = await registrationLinks(payload)
    const teamsOf = (u: any) => (links.ids.get(String(u.id)) || 0) + (links.emails.get(String(u.email).toLowerCase()) || 0)

    const and: Where[] = [kind === 'participants' ? { role: { equals: 'PARTICIPANT' } } : { role: { not_equals: 'PARTICIPANT' } }]
    if (q) {
      const fields = kind === 'participants' ? ['name', 'email', 'institution', 'phone'] : ['name', 'email', 'institution']
      and.push({ or: fields.map((f) => ({ [f]: { like: q } })) })
    }
    if (status === 'unconfirmed') and.push(unconfirmed)
    if (status === 'confirmed') and.push({ emailVerified: { equals: true } })
    if (status === 'locked') and.push({ lockUntil: { greater_than: new Date().toISOString() } })
    if (kind === 'participants' && team !== 'all') {
      const linked: Where = {
        or: [{ id: { in: [...links.ids.keys()].map(Number).concat([-1]) } }, { email: { in: [...links.emails.keys()].concat(['-']) } }],
      }
      and.push(team === 'yes' ? linked : { and: [{ id: { not_in: [...links.ids.keys()].map(Number).concat([-1]) } }, { email: { not_in: [...links.emails.keys()].concat(['-']) } }] })
    }
    if (kind === 'team' && type !== 'all') and.push({ role: { equals: type } })
    if (kind === 'team' && role !== 'all') and.push({ roles: { in: [role] } })

    const count = (where: Where) => payload.count({ collection: 'users', where, overrideAccess: true }).then((r) => r.totalDocs)
    const base: Where = kind === 'participants' ? { role: { equals: 'PARTICIPANT' } } : { role: { not_equals: 'PARTICIPANT' } }
    const [res, total, notConfirmed] = await Promise.all([
      payload.find({ collection: 'users', where: { and }, sort: SORTS[sort][0], limit: PER_PAGE, page, depth: 0, overrideAccess: true }),
      count(base),
      kind === 'participants' ? count({ and: [base, unconfirmed] }) : Promise.resolve(0),
    ])
    const users = res.docs as any[]
    const mails =
      kind === 'participants' && users.length
        ? await payload.find({
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
        : { docs: [] as any[] }
    const mailsFor = (id: number) => (mails.docs as any[]).filter((m) => m.reference === `user ${id}`).length
    const filters = { q, status, team, type, role, sort }
    const link = (p: number) => {
      const qs = new URLSearchParams(Object.entries({ ...filters, page: String(p) }).filter(([, v]) => v && v !== 'all') as [string, string][])
      return `${self}?${qs}`
    }
    const filtered = q || status !== 'all' || team !== 'all' || type !== 'all' || role !== 'all'

    body = (
      <>
        <p style={{ color: 'var(--theme-elevation-600)', marginBottom: 16, maxWidth: 780 }}>
          {kind === 'participants' ? (
            <>
              {plural(total, 'participant account', 'participant accounts')}, {notConfirmed} not confirmed yet. Participants get at most 2
              confirmation emails a day on their own; a resend from here is not limited but still counts toward today&apos;s email limit.
              Unconfirmed accounts are deleted 7 days after sign-up unless they are linked to a team. Team and admin accounts are under{' '}
              <a href="/admin/team-accounts">Team accounts</a>.
            </>
          ) : (
            <>
              {plural(total, 'team or admin account', 'team and admin accounts')}. To add someone or change their account type, roles or
              assigned events, use <a href="/admin/collections/users">Team &amp; admin accounts</a>. Participants are under{' '}
              <a href="/admin/participants">Participants</a>.
            </>
          )}
        </p>
        <form method="get" action={self} style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 16, alignItems: 'center' }}>
          <input
            name="q"
            defaultValue={q}
            placeholder={kind === 'participants' ? 'Search name, email, college or phone' : 'Search name or email'}
            style={{ ...input, minWidth: 280 }}
            aria-label="Search"
          />
          <select name="status" defaultValue={status} style={input} aria-label="Status">
            <option value="all">{kind === 'participants' ? 'Any status' : 'Locked or not'}</option>
            {kind === 'participants' && <option value="unconfirmed">Email not confirmed</option>}
            {kind === 'participants' && <option value="confirmed">Email confirmed</option>}
            <option value="locked">Locked (failed sign-ins)</option>
          </select>
          {kind === 'participants' ? (
            <select name="team" defaultValue={team} style={input} aria-label="Team">
              <option value="all">With or without a team</option>
              <option value="yes">Has registered a team</option>
              <option value="no">No team yet</option>
            </select>
          ) : (
            <>
              <select name="type" defaultValue={type} style={input} aria-label="Account type">
                <option value="all">Any account type</option>
                {TEAM_TYPES.map((t) => (
                  <option key={t.value} value={t.value}>
                    {t.label}
                  </option>
                ))}
              </select>
              <select name="role" defaultValue={role} style={input} aria-label="Role">
                <option value="all">Any role</option>
                {STAFF_ROLE_OPTIONS.map((r) => (
                  <option key={r.value} value={r.value}>
                    {r.label}
                  </option>
                ))}
              </select>
            </>
          )}
          <select name="sort" defaultValue={sort} style={input} aria-label="Sort">
            {Object.entries(SORTS).map(([k, [, label]]) => (
              <option key={k} value={k}>
                {label}
              </option>
            ))}
          </select>
          <button type="submit" className="btn btn--style-primary btn--size-medium" style={{ margin: 0 }}>
            Apply
          </button>
          {filtered && <a href={self}>Clear</a>}
        </form>
        <p style={{ fontSize: 13, color: 'var(--theme-elevation-600)', marginBottom: 8 }}>
          {filtered ? `${plural(res.totalDocs, 'match', 'matches')}` : `${plural(res.totalDocs, 'account', 'accounts')}`}
        </p>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 900 }}>
            <thead>
              <tr>
                <th style={th}>Account</th>
                <th style={th}>{kind === 'participants' ? 'College' : 'Type & roles'}</th>
                {kind === 'participants' && <th style={th}>Email confirmed</th>}
                <th style={th}>{kind === 'participants' ? 'Signed up' : 'Created'}</th>
                {kind === 'participants' && <th style={th}>Teams</th>}
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
              {users.map((u) => {
                const locked = Boolean(u.lockUntil && new Date(u.lockUntil).getTime() > Date.now())
                const roles: string[] = Array.isArray(u.roles) ? u.roles : []
                const teams = teamsOf(u)
                const canManage = u.role !== 'SUPER_ADMIN' || isSuperAdmin(actor) || String(u.id) === String(actor.id)
                const lockChip = locked && <div style={{ ...chip('var(--theme-error-100)', 'var(--theme-error-800)'), marginTop: 4 }}>Locked until {fmt(u.lockUntil)}</div>
                return (
                  <tr key={u.id}>
                    <td style={td}>
                      <a href={`/admin/collections/users/${u.id}`} style={{ fontWeight: 600 }}>
                        {u.name || '(no name)'}
                      </a>
                      <div style={{ color: 'var(--theme-elevation-600)', wordBreak: 'break-all' }}>{u.email}</div>
                      {kind === 'participants' && u.phone && <div style={{ color: 'var(--theme-elevation-500)', fontSize: 12 }}>{u.phone}</div>}
                      {kind === 'participants' && lockChip}
                    </td>
                    {kind === 'participants' ? (
                      <td style={td}>{u.institution || ''}</td>
                    ) : (
                      <td style={td}>
                        {TYPE_LABEL[u.role] || u.role}
                        {roles.length > 0 && <div style={{ color: 'var(--theme-elevation-500)', fontSize: 12 }}>{roles.map((r) => ROLE_LABEL[r] || r).join(', ')}</div>}
                        {lockChip}
                      </td>
                    )}
                    {kind === 'participants' && (
                      <td style={td}>
                        {u.emailVerified ? (
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
                    )}
                    <td style={td}>{fmt(u.createdAt)}</td>
                    {kind === 'participants' && <td style={td}>{teams}</td>}
                    <td style={td}>
                      {canManage ? (
                        <AccountActions
                          userId={u.id}
                          label={u.email}
                          canConfirm={kind === 'participants' && !u.emailVerified}
                          canUnlock={locked}
                          canDelete={isSuperAdmin(actor) && String(u.id) !== String(actor.id) && u.role !== 'SUPER_ADMIN' && teams === 0}
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
            {res.hasPrevPage && <a href={link(page - 1)}>← Previous</a>}
            <span>
              Page {res.page} of {res.totalPages}
            </span>
            {res.hasNextPage && <a href={link(page + 1)}>Next →</a>}
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
          <h1 style={{ marginBottom: 8 }}>{title}</h1>
          {body}
        </div>
      </Gutter>
    </DefaultTemplate>
  )
}

/** /admin/accounts (first version of this screen) now opens Participants. */
export default function AccountsRedirect() {
  redirect('/admin/participants')
}
