import { headers } from 'next/headers'
import { getPayload, type Where } from 'payload'
import config from '@payload-config'
import { checkInScope } from '@/payload/access/roles'
import { logger } from '@/lib/logger'
import { isSameOrigin } from '@/lib/auth/same-origin'

export const dynamic = 'force-dynamic'

/**
 * Event-day check-in desk (used by /checkin).
 *   GET  ?q=<code or team name>   -> up to 10 matching teams (names and colleges only; no contacts or ID cards)
 *   GET  ?summary=1               -> arrived / confirmed / registered teams per event
 *   POST { id, arrived }          -> mark a team as arrived (or undo); audit-logged
 * Who may use it and for which events: checkInScope() in access/roles.ts.
 */
const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' } })

async function staff() {
  const payload = await getPayload({ config })
  const { user } = await payload.auth({ headers: await headers() })
  const scope = user ? checkInScope(user) : null
  return { payload, user, scope }
}

const scopeWhere = (scope: 'all' | (number | string)[]): Where | null =>
  scope === 'all' ? null : { event: { in: scope.length ? scope : [-1] } }

const view = (r: any) => ({
  id: r.id,
  code: r.registrationCode,
  team: r.teamName,
  event: typeof r.event === 'object' ? r.event?.title : String(r.event),
  college: r.college,
  members: (r.members || []).map((m: any) => ({ name: m.name, college: m.college })),
  status: r.status,
  paymentStatus: r.paymentStatus,
  idVerification: r.idVerification,
  checkedIn: Boolean(r.checkedIn),
  checkedInAt: r.checkedInAt || null,
  checkedInBy: r.checkedInBy || null,
})

export async function GET(req: Request) {
  const { payload, user, scope } = await staff()
  if (!user || !scope) return json({ error: 'Not allowed' }, 403)
  const url = new URL(req.url)
  const limit = scopeWhere(scope)

  if (url.searchParams.get('summary')) {
    const { docs } = await payload.find({
      collection: 'event-registrations',
      overrideAccess: true,
      depth: 1,
      pagination: false,
      where: limit || undefined,
      select: { event: true, status: true, checkedIn: true },
    })
    const rows = new Map<string, { event: string; registered: number; confirmed: number; arrived: number }>()
    for (const r of docs as any[]) {
      const title = typeof r.event === 'object' ? r.event?.title : String(r.event)
      const row = rows.get(title) || { event: title, registered: 0, confirmed: 0, arrived: 0 }
      if (r.status !== 'CANCELLED' && r.status !== 'REJECTED') row.registered += 1
      if (r.status === 'CONFIRMED') row.confirmed += 1
      if (r.checkedIn) row.arrived += 1
      rows.set(title, row)
    }
    return json({ events: [...rows.values()].sort((a, b) => a.event.localeCompare(b.event)) })
  }

  const q = (url.searchParams.get('q') || '').trim().slice(0, 60)
  if (q.length < 2) return json({ results: [] })
  const match: Where = /^AX\d{2}-/i.test(q)
    ? { registrationCode: { equals: q.toUpperCase() } }
    : { or: [{ teamName: { like: q } }, { registrationCode: { like: q.toUpperCase() } }] }
  const { docs } = await payload.find({
    collection: 'event-registrations',
    overrideAccess: true,
    depth: 1,
    limit: 10,
    where: limit ? { and: [limit, match] } : match,
  })
  return json({ results: docs.map(view) })
}

export async function POST(req: Request) {
  if (!isSameOrigin(req)) return json({ error: 'Bad origin' }, 403)

  const { payload, user, scope } = await staff()
  if (!user || !scope) return json({ error: 'Not allowed' }, 403)
  const body = await req.json().catch(() => null)
  const id = body?.id
  if (!id || typeof body?.arrived !== 'boolean') return json({ error: 'Bad request' }, 400)

  const limit = scopeWhere(scope)
  const where: Where = limit ? { and: [{ id: { equals: id } }, limit] } : { id: { equals: id } }
  const { docs } = await payload.find({ collection: 'event-registrations', overrideAccess: true, depth: 0, limit: 1, where })
  if (!docs.length) return json({ error: 'Team not found or not one of your events' }, 404)

  const who = String((user as any).name || (user as any).email)
  const updated = await payload.update({
    collection: 'event-registrations',
    id,
    overrideAccess: true,
    depth: 1,
    data: body.arrived
      ? { checkedIn: true, checkedInAt: new Date().toISOString(), checkedInBy: who }
      : { checkedIn: false, checkedInAt: null, checkedInBy: null },
  })
  logger.audit(String((user as any).email), body.arrived ? 'TEAM_CHECKED_IN' : 'TEAM_CHECK_IN_UNDONE', 'EventRegistration', String(id), {
    code: (updated as any).registrationCode,
  })
  return json({ team: view(updated) })
}
