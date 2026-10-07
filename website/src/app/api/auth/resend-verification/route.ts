import { NextResponse } from 'next/server'
import { headers } from 'next/headers'
import { getPayload } from 'payload'
import config from '@payload-config'
import { clientIp, rateLimit } from '@/lib/rateLimit'
import { TURNSTILE_FAILED, turnstileOk } from '@/lib/turnstile'
import { isSameOrigin } from '@/lib/auth/same-origin'
import { confirmationQueued, recentConfirmationTimes, sendVerification } from '@/lib/auth/participant'
import { checkResend, resendRefusal } from '@/lib/auth/resend-policy'

export const dynamic = 'force-dynamic'
const json = (body: unknown, status = 200) => NextResponse.json(body, { status })

/** Send a new confirmation link to the logged-in account (old links stop working). */
export async function POST(req: Request) {
  if (!isSameOrigin(req)) return json({ success: false, message: 'Bad origin.' }, 403)
  const payload = await getPayload({ config })
  const { user } = await payload.auth({ headers: await headers() })
  if (!user) return json({ success: false, message: 'Please log in first.' }, 401)
  if ((user as any).emailVerified) return json({ success: true, alreadyConfirmed: true })
  if (await confirmationQueued(payload, user.id)) return json({ success: true, queued: true })
  // Each email costs part of the shared daily mail budget: 2 per account per 24 h (counted in the outbox, so a
  // restart doesn't reset it), 2 minutes apart, and 10 per hour per IP
  if (!rateLimit(`resend-ip:${clientIp(req)}`, 10, 3_600_000))
    return json({ success: false, message: 'Too many emails requested from this network. Please try again in an hour.' }, 429)
  if (!(await turnstileOk(req, clientIp(req)))) return json({ success: false, message: TURNSTILE_FAILED }, 403)
  const decision = checkResend(await recentConfirmationTimes(payload, user.id))
  if (!decision.ok) return json({ success: false, message: resendRefusal(decision) }, 429)
  // Two clicks at the same moment would both pass the outbox check before either is recorded
  if (!rateLimit(`resend-user:${user.id}`, 1, 120_000))
    return json({ success: false, message: 'A link was sent moments ago. Please check your inbox and spam folder.' }, 429)
  const status = await sendVerification(payload, user as any)
  if (status === 'sent') return json({ success: true })
  if (status === 'queued') return json({ success: true, queued: true })
  return json({ success: false, message: 'The email could not be sent. Please try again later.' }, 503)
}
