import { NextResponse } from 'next/server'
import { z } from 'zod'
import { getPayload } from 'payload'
import { generatePayloadCookie } from 'payload/shared'
import config from '@payload-config'
import { clientIp, rateLimit } from '@/lib/rateLimit'
import { linkRegistrations } from '@/lib/auth/participant'
import { logger } from '@/lib/logger'

export const dynamic = 'force-dynamic'
const Body = z.object({ token: z.string().min(20).max(200), password: z.string().min(8).max(128) })

/** Set a new password with the emailed one-time token, then log in. Using the emailed link also proves the address. */
export async function POST(req: Request) {
  if (!rateLimit(`reset-ip:${clientIp(req)}`, 10, 3_600_000))
    return NextResponse.json({ success: false, message: 'Too many attempts. Please try again later.' }, { status: 429 })
  let body: z.infer<typeof Body>
  try {
    body = Body.parse(await req.json())
  } catch {
    return NextResponse.json({ success: false, message: 'Use at least 8 characters for the new password.' }, { status: 400 })
  }
  const payload = await getPayload({ config })
  try {
    const result: any = await payload.resetPassword({ collection: 'users', data: { token: body.token, password: body.password }, overrideAccess: true })
    const user = result?.user
    if (user && !user.emailVerified) {
      await payload.update({ collection: 'users', id: user.id, overrideAccess: true, data: { emailVerified: true, emailVerifiedAt: new Date().toISOString() } as any })
      await linkRegistrations(payload, user)
    }
    logger.audit(String(user?.email || 'unknown'), 'PASSWORD_RESET', 'User', String(user?.id || ''))
    const res = NextResponse.json({ success: true })
    if (result?.token) {
      res.headers.append(
        'Set-Cookie',
        generatePayloadCookie({ collectionAuthConfig: payload.collections['users'].config.auth, cookiePrefix: payload.config.cookiePrefix, token: result.token }),
      )
    }
    return res
  } catch {
    return NextResponse.json({ success: false, message: 'This reset link is invalid or has expired. Please request a new one.' }, { status: 400 })
  }
}
