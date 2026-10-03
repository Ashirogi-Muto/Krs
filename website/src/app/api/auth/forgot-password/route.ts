import { NextResponse } from 'next/server'
import { z } from 'zod'
import { getPayload } from 'payload'
import config from '@payload-config'
import { clientIp, rateLimit } from '@/lib/rateLimit'
import { sendAuthEmail } from '@/lib/email/outbox'
import { passwordReset } from '@/lib/email/templates'
import { logger } from '@/lib/logger'

export const dynamic = 'force-dynamic'
const RESET_MINUTES = 60
// Same answer whether or not the address has an account (no account enumeration)
const SAME = { success: true, message: 'If an account exists for this email, a reset link has been sent. Check your inbox and spam folder.' }
const Body = z.object({ email: z.string().trim().toLowerCase().email().max(254) })

/** Email a one-time link to choose a new password (participant accounts and staff alike). */
export async function POST(req: Request) {
  const ip = clientIp(req)
  if (!rateLimit(`forgot-ip:${ip}`, 5, 3_600_000))
    return NextResponse.json({ success: false, message: 'Too many requests. Please try again later.' }, { status: 429 })
  let email: string
  try {
    email = Body.parse(await req.json()).email
  } catch {
    return NextResponse.json({ success: false, message: 'Please enter a valid email address.' }, { status: 400 })
  }
  if (!rateLimit(`forgot-email:${email}`, 3, 3_600_000)) return NextResponse.json(SAME)

  const payload = await getPayload({ config })
  const found = await payload.find({ collection: 'users', where: { email: { equals: email } }, limit: 1, depth: 0, overrideAccess: true })
  const user: any = found.docs[0]
  if (!user) return NextResponse.json(SAME)
  try {
    // Payload creates and stores the reset token (expiry set below); we send the email ourselves
    const token = await payload.forgotPassword({
      collection: 'users',
      data: { email },
      disableEmail: true,
      expiration: RESET_MINUTES * 60 * 1000,
    } as any)
    if (token) {
      const site = process.env.NEXT_PUBLIC_SITE_URL || 'https://kalamroboticssociety.com'
      const mail = passwordReset({ name: user.name || 'there', url: `${site}/reset-password?token=${token}`, expiresMinutes: RESET_MINUTES })
      await sendAuthEmail(payload, { ...mail, to: email, kind: 'PASSWORD_RESET', reference: `user ${user.id}` })
      logger.audit(email, 'PASSWORD_RESET_REQUESTED', 'User', String(user.id))
    }
  } catch (err: any) {
    logger.error(`Password reset request failed for user ${user.id}: ${err?.message || err}`)
  }
  return NextResponse.json(SAME)
}
