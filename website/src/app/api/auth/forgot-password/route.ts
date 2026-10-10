import { NextResponse } from 'next/server'
import { z } from 'zod'
import { getPayload } from 'payload'
import config from '@payload-config'
import { clientIp, rateLimit } from '@/lib/rateLimit'
import { turnstileOk } from '@/lib/turnstile'
import { dailyLimitReached } from '@/lib/email/outbox'
import { sendPasswordReset } from '@/lib/auth/password-reset'
import { logger } from '@/lib/logger'
import { getFormTexts } from '@/lib/form-texts'

export const dynamic = 'force-dynamic'
// Same answer whether or not the address has an account (no account enumeration)
const Body = z.object({ email: z.string().trim().toLowerCase().email().max(254) })

/** Email a one-time link to choose a new password (participant accounts and staff alike). */
export async function POST(req: Request) {
  const M = (await getFormTexts()).messages // wording: CMS → Labels & messages → Messages
  // Same answer whether or not the address has an account (no account enumeration)
  const SAME = { success: true, message: M.forgotSent }
  const ip = clientIp(req)
  if (!rateLimit(`forgot-ip:${ip}`, 5, 3_600_000))
    return NextResponse.json({ success: false, message: M.tooManyRequests }, { status: 429 })
  if (!(await turnstileOk(req, ip))) return NextResponse.json({ success: false, message: M.botCheck }, { status: 403 })
  let email: string
  try {
    email = Body.parse(await req.json()).email
  } catch {
    return NextResponse.json({ success: false, message: M.forgotInvalidEmail }, { status: 400 })
  }
  if (!rateLimit(`forgot-email:${email}`, 3, 3_600_000)) return NextResponse.json(SAME)

  const payload = await getPayload({ config })
  // Reset links expire in an hour, so they are not queued: same answer for every address (no enumeration)
  if (await dailyLimitReached(payload))
    return NextResponse.json({ success: false, limit: true, message: M.forgotLimit }, { status: 503 })
  const found = await payload.find({ collection: 'users', where: { email: { equals: email } }, limit: 1, depth: 0, overrideAccess: true })
  const user: any = found.docs[0]
  if (!user) return NextResponse.json(SAME)
  if ((await sendPasswordReset(payload, user)) === 'sent') logger.audit(email, 'PASSWORD_RESET_REQUESTED', 'User', String(user.id))
  return NextResponse.json(SAME)
}
