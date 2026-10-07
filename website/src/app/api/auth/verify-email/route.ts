import { NextResponse } from 'next/server'
import { z } from 'zod'
import { getPayload } from 'payload'
import { generatePayloadCookie } from 'payload/shared'
import config from '@payload-config'
import { clientIp, rateLimit } from '@/lib/rateLimit'
import { isSameOrigin } from '@/lib/auth/same-origin'
import { confirmEmail } from '@/lib/auth/participant'

export const dynamic = 'force-dynamic'
const Body = z.object({ token: z.string().min(20).max(100), password: z.string().min(1).max(128) })

const MESSAGES = {
  invalid: 'This confirmation link is not valid. It may have been replaced by a newer one.',
  expired: 'This confirmation link has expired. Log in to get a new one.',
  password:
    "That password doesn't match this account. If you didn't create the account, or forgot the password, use \"Forgot password\": it confirms your email and lets you choose your own password.",
}

/** Confirm an email address: the emailed token AND the account password (lib/auth/participant.ts confirmEmail). */
export async function POST(req: Request) {
  if (!isSameOrigin(req)) return NextResponse.json({ success: false, message: 'Bad origin.' }, { status: 403 })
  if (!rateLimit(`verify-ip:${clientIp(req)}`, 20, 3_600_000))
    return NextResponse.json({ success: false, message: 'Too many attempts. Please try again later.' }, { status: 429 })
  const parsed = Body.safeParse(await req.json().catch(() => null))
  if (!parsed.success) return NextResponse.json({ success: false, message: MESSAGES.invalid }, { status: 400 })

  const payload = await getPayload({ config })
  const result = await confirmEmail(payload, parsed.data.token, parsed.data.password)
  if (!result.ok) return NextResponse.json({ success: false, message: MESSAGES[result.reason] }, { status: result.reason === 'password' ? 401 : 400 })

  const res = NextResponse.json({ success: true })
  if (result.sessionToken) {
    res.headers.append(
      'Set-Cookie',
      generatePayloadCookie({ collectionAuthConfig: payload.collections['users'].config.auth, cookiePrefix: payload.config.cookiePrefix, token: result.sessionToken }),
    )
  }
  return res
}
