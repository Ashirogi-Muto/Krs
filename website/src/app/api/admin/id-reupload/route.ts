import { headers } from 'next/headers'
import { getPayload } from 'payload'
import config from '@payload-config'
import { SEE_IDS, hasRole } from '@/payload/access/roles'
import { isSameOrigin } from '@/lib/auth/same-origin'
import { rateLimitUser } from '@/lib/rateLimit'
import { getStaffTexts } from '@/lib/staff-texts'
import { fill } from '@/lib/form-texts-defaults'
import { parseDeadline, requestReuploads } from '@/lib/id-reupload'

export const dynamic = 'force-dynamic'

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' } })

/**
 * POST { deadline: "YYYY-MM-DD" } → email every team whose student ID is "Rejected" and was not emailed yet for that
 * rejection (CMS: Registrations → ID re-upload). Registration team (SEE_IDS) and admins only.
 */
export async function POST(req: Request) {
  const T = (await getStaffTexts()).idReupload
  const A = (await getStaffTexts()).adminApi
  if (!isSameOrigin(req)) return json({ error: A.badOrigin }, 403)
  const payload = await getPayload({ config })
  const { user } = await payload.auth({ headers: await headers() })
  if (!user || !hasRole(user as any, SEE_IDS)) return json({ error: T.notAllowed }, 403)
  if (!rateLimitUser(user.id, 'id-reupload-send', 5, 60_000)) return json({ error: A.slowDown }, 429)
  const body = await req.json().catch(() => null)
  const deadline = parseDeadline(body?.deadline)
  if (!deadline) return json({ error: T.badDeadline }, 400)
  const n = await requestReuploads(payload, deadline, String((user as any).email || user.id))
  return json({ queued: n, message: n ? fill(T.sent, { n }) : T.nothingToSend })
}
