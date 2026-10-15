import { headers } from 'next/headers'
import { getPayload } from 'payload'
import config from '@payload-config'
import { can } from '@/payload/access/permissions'
import { logger } from '@/lib/logger'
// Per-user limits only: organisers often share one campus IP, and this route already requires a staff login
import { rateLimitUser } from '@/lib/rateLimit'
import { getStaffTexts } from '@/lib/staff-texts'
import { csvBody } from '@/lib/csv'
import { PARTICIPANT_SORTS, parseParticipantFilters, participantWhere, registrationLinks, teamsOf } from '@/lib/participant-accounts'

export const dynamic = 'force-dynamic'

const ist = (d?: string | null) => (d ? new Date(d).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short', timeZone: 'Asia/Kolkata' }) : '')

/**
 * GET /api/admin/participants-export?q=&status=&team=&sort= → CSV of the participant accounts matching exactly the
 * filters of Admin tools → Participants (owner, 15 Oct 2026: same people as the screen: admins and access roles with
 * "Participants"). Shares the screen's query (lib/participant-accounts.ts). Never cached; every export is audit-logged
 * with its filters and row count. Column names: CMS → Staff & admin texts → Accounts screens.
 */
export async function GET(req: Request) {
  const S = await getStaffTexts()
  const A = S.adminApi
  const payload = await getPayload({ config })
  const { user } = await payload.auth({ headers: await headers() })
  if (!user || !can(user as any, 'admin.participants')) return new Response(A.notAllowed, { status: 403, headers: { 'Cache-Control': 'no-store' } })
  if (!rateLimitUser(user.id, 'participants-export', 10, 60 * 1000)) return new Response(A.exportTooMany, { status: 429, headers: { 'Cache-Control': 'no-store' } })

  const f = parseParticipantFilters(new URL(req.url).searchParams)
  const links = await registrationLinks(payload)
  const { docs } = await payload.find({
    collection: 'users',
    where: participantWhere(f, links),
    sort: PARTICIPANT_SORTS[f.sort],
    pagination: false,
    depth: 0,
    overrideAccess: true,
    select: { name: true, email: true, phone: true, institution: true, emailVerified: true, emailVerifiedAt: true, createdAt: true, lockUntil: true },
  })
  const T = S.accounts
  const now = Date.now()
  const rows: unknown[][] = [[T.csvName, T.csvEmail, T.csvPhone, T.csvCollege, T.csvConfirmed, T.csvConfirmedAt, T.csvSignedUp, T.csvLocked, T.csvTeams, T.csvTeamCodes, T.csvEvents]]
  for (const u of docs as any[]) {
    const teams = teamsOf(links, u)
    const locked = u.lockUntil && new Date(u.lockUntil).getTime() > now ? ist(u.lockUntil) : ''
    rows.push([
      u.name,
      u.email,
      u.phone,
      u.institution,
      u.emailVerified ? T.csvYes : T.csvNo,
      ist(u.emailVerifiedAt),
      ist(u.createdAt),
      locked,
      teams.length,
      teams.map((t) => t.code).join('; '),
      [...new Set(teams.map((t) => t.event))].join('; '),
    ])
  }
  logger.audit(String((user as any).email), 'PARTICIPANTS_EXPORTED', 'User', 'participants', { filters: f, rows: docs.length })
  const stamp = new Date().toISOString().slice(0, 10)
  return new Response(csvBody(rows), {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="${(T.csvFile || 'participants').replace(/[^\w.-]+/g, '-')}-${stamp}.csv"`,
      'Cache-Control': 'private, no-store',
      'X-Content-Type-Options': 'nosniff',
    },
  })
}
