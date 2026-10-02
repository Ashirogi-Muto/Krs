import { headers } from 'next/headers'
import { getPayload } from 'payload'
import config from '@payload-config'
import { isSuperAdmin } from '@/payload/access/roles'
import { findDue, purgeEvent } from '@/lib/retention'
import { isSameOrigin } from '@/lib/auth/same-origin'
import { logger } from '@/lib/logger'

export const dynamic = 'force-dynamic'

/**
 * Participant data retention (Super Admin only; used by /retention).
 *   GET                              -> events past their retention date that still hold data
 *   POST { eventId, confirm: title } -> permanently delete that event's registrations, ID files and emails
 */
const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' } })

async function owner() {
  const payload = await getPayload({ config })
  const { user } = await payload.auth({ headers: await headers() })
  return { payload, user: user && isSuperAdmin(user) ? user : null }
}

export async function GET() {
  const { payload, user } = await owner()
  if (!user) return json({ error: 'Not allowed' }, 403)
  return json({ due: await findDue(payload) })
}

export async function POST(req: Request) {
  if (!isSameOrigin(req)) return json({ error: 'Bad origin' }, 403)
  const { payload, user } = await owner()
  if (!user) return json({ error: 'Not allowed' }, 403)
  const body = await req.json().catch(() => null)
  const eventId = Number(body?.eventId)
  const due = (await findDue(payload)).find((e) => e.id === eventId)
  if (!due) return json({ error: 'Nothing to delete for this event (not due yet, or already deleted)' }, 400)
  if (String(body?.confirm || '').trim() !== due.title) return json({ error: 'Type the event name exactly to confirm' }, 400)
  const result = await purgeEvent(payload, eventId)
  logger.audit(String((user as any).email), 'RETENTION_PURGE', 'Event', String(eventId), result)
  return json({ deleted: result })
}
