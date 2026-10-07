import { NextResponse } from 'next/server'
import { z } from 'zod'
import { getPayload } from 'payload'
import config from '@payload-config'
import { clientIp, rateLimit } from '@/lib/rateLimit'
import { TURNSTILE_FAILED, turnstileOk } from '@/lib/turnstile'
import { dailyLimitReached } from '@/lib/email/outbox'
import { sendPasswordReset } from '@/lib/auth/password-reset'
import { logger } from '@/lib/logger'

export const dynamic = 'force-dynamic'
// Same answer whether or not the address has an account (no account enumeration)
const SAME = { success: true, message: 'If an account exists for this email, a reset link has been sent. Check your inbox and spam folder.' }
const Body = z.object({ email: z.string().trim().toLowerCase().email().max(254) })

/** Email a one-time link to choose a new password (participant accounts and staff alike). */
export async function POST(req: Request) {
  const ip = clientIp(req)
  if (!rateLimit(`forgot-ip:${ip}`, 5, 3_600_000))
    return NextResponse.json({ success: false, message: 'Too many requests. Please try again later.' }, { status: 429 })
  if (!(await turnstileOk(req, ip))) return NextResponse.json({ success: false, message: TURNSTILE_FAILED }, { status: 403 })
  let email: string
  try {
    email = Body.parse(await req.json()).email
  } catch {
    return NextResponse.json({ success: false, message: 'Please enter a valid email address.' }, { status: 400 })
  }
  if (!rateLimit(`forgot-email:${email}`, 3, 3_600_000)) return NextResponse.json(SAME)

  const payload = await getPayload({ config })
  // Reset links expire in an hour, so they are not queued: same answer for every address (no enumeration)
  if (await dailyLimitReached(payload))
    return NextResponse.json({ success: false, limit: true, message: "Today's email limit is reached, so no reset email can be sent. Please try again tomorrow." }, { status: 503 })
  const found = await payload.find({ collection: 'users', where: { email: { equals: email } }, limit: 1, depth: 0, overrideAccess: true })
  const user: any = found.docs[0]
  if (!user) return NextResponse.json(SAME)
  if ((await sendPasswordReset(payload, user)) === 'sent') logger.audit(email, 'PASSWORD_RESET_REQUESTED', 'User', String(user.id))
  return NextResponse.json(SAME)
}
