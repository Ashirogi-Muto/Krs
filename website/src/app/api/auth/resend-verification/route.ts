import { NextResponse } from 'next/server'
import { headers } from 'next/headers'
import { getPayload } from 'payload'
import config from '@payload-config'
import { clientIp, rateLimit } from '@/lib/rateLimit'
import { isSameOrigin } from '@/lib/auth/same-origin'
import { sendVerification } from '@/lib/auth/participant'

export const dynamic = 'force-dynamic'
const json = (body: unknown, status = 200) => NextResponse.json(body, { status })

/** Send a new confirmation link to the logged-in account (old links stop working). */
export async function POST(req: Request) {
  if (!isSameOrigin(req)) return json({ success: false, message: 'Bad origin.' }, 403)
  const payload = await getPayload({ config })
  const { user } = await payload.auth({ headers: await headers() })
  if (!user) return json({ success: false, message: 'Please log in first.' }, 401)
  if ((user as any).emailVerified) return json({ success: true, alreadyConfirmed: true })
  // Each email costs part of the shared daily mail budget: 3 per hour and 6 per day per account, 10 per hour per IP
  if (
    !rateLimit(`resend-user:${user.id}`, 3, 3_600_000) ||
    !rateLimit(`resend-user-day:${user.id}`, 6, 86_400_000) ||
    !rateLimit(`resend-ip:${clientIp(req)}`, 10, 3_600_000)
  )
    return json({ success: false, message: 'Too many emails requested. Please wait an hour and check your spam folder.' }, 429)
  const status = await sendVerification(payload, user as any)
  if (status === 'sent') return json({ success: true })
  if (status === 'limit') return json({ success: false, message: "Today's email limit is reached. Please try again tomorrow." }, 503)
  return json({ success: false, message: 'The email could not be sent. Please try again later.' }, 503)
}
