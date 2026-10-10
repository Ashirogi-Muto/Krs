import { NextResponse } from 'next/server'
import { getPayload } from 'payload'
import config from '@payload-config'
import { getSessionUser } from '@/lib/auth/session'
import { isSameOrigin } from '@/lib/auth/same-origin'
import { isRouteVisibleOnServer } from '@/lib/visibility-guard'
import { rateLimit } from '@/lib/rateLimit'
import { getFormTexts } from '@/lib/form-texts'
import { getPortalTexts } from '@/lib/portal-texts'

export const json = (body: unknown, status = 200) => NextResponse.json(body, { status, headers: { 'Cache-Control': 'no-store' } })

/**
 * Common checks for the submission APIs (participant portal): portal shown, same-origin, a confirmed account,
 * per-user rate limit. Returns the user, Payload and the portal's submission texts, or the response to send.
 */
export async function guard(req: Request, limitKey: string, perHour: number) {
  const M = (await getFormTexts()).messages
  if (!(await isRouteVisibleOnServer('/aurix/portal'))) return { res: json({ success: false, message: M.notFound }, 404) }
  if (!isSameOrigin(req)) return { res: json({ success: false, message: M.badOrigin }, 403) }
  const user = await getSessionUser()
  if (!user) return { res: json({ success: false, message: M.authRequired }, 401) }
  if (!user.emailVerified) return { res: json({ success: false, message: M.regConfirm }, 403) }
  const T = (await getPortalTexts()).submissions
  if (!rateLimit(`${limitKey}:${user.id}`, perHour, 3_600_000)) return { res: json({ success: false, message: T.errTooMany }, 429) }
  return { user: { id: Number(user.id), email: user.email }, payload: await getPayload({ config }), T }
}
