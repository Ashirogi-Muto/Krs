import { NextResponse } from 'next/server'
import { z } from 'zod'
import { getPayload } from 'payload'
import { generatePayloadCookie } from 'payload/shared'
import config from '@payload-config'
import { logger } from '@/lib/logger'
import { isRouteVisibleOnServer as isRouteVisible } from '@/lib/visibility-guard'
import { clientIp, rateLimit } from '@/lib/rateLimit'
import { deletionDateText, sendVerification } from '@/lib/auth/participant'

const RegisterSchema = z.object({
  name: z.string().trim().min(2).max(120),
  email: z.string().trim().email().max(254),
  password: z.string().min(8).max(128),
  institution: z.string().trim().min(2).max(200),
  phone: z.string().trim().min(8).max(20),
})

export async function POST(req: Request) {
  // Participant sign-up/sign-in is closed while the portal pages are hidden
  if (!(await isRouteVisible('/register'))) {
    return NextResponse.json({ success: false, message: 'Not found.' }, { status: 404 })
  }

  const ip = clientIp(req)
  if (!rateLimit(`register-ip:${ip}`, 5, 60 * 60 * 1000)) {
    return NextResponse.json(
      { success: false, message: 'Too many registration attempts. Please try again later.' },
      { status: 429 }
    )
  }
  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ success: false, message: 'Invalid request.' }, { status: 400 })
  }

  const parsed = RegisterSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { success: false, message: 'Please check all fields and try again.' },
      { status: 400 }
    )
  }

  const { name, password, institution, phone } = parsed.data
  const email = parsed.data.email.toLowerCase()
  const payload = await getPayload({ config })

  try {
    const existing = await payload.find({
      collection: 'users',
      where: { email: { equals: email } },
      limit: 1,
      depth: 0,
    })
    if (existing.totalDocs > 0) {
      return NextResponse.json(
        { success: false, message: 'An account with this email already exists. Please sign in.' },
        { status: 409 }
      )
    }

    // Public self-registration always creates a PARTICIPANT; role is never taken from the client
    const user = await payload.create({
      collection: 'users',
      overrideAccess: true,
      context: { publicRegistration: true },
      data: { name, email, password, institution, phone, role: 'PARTICIPANT' },
    })

    const result = await payload.login({
      collection: 'users',
      data: { email, password },
    })

    // Email confirmation is mandatory before the portal / team registration can be used
    const emailStatus = await sendVerification(payload, user as any)
    const response = NextResponse.json({
      success: true,
      user: { id: user.id, email: user.email, name: user.name, role: user.role },
      verification: emailStatus, // 'sent' | 'queued' (daily limit: sent automatically later) | 'not-configured'
      deleteOn: deletionDateText((user as any).createdAt || new Date()),
    })

    if (result.token) {
      response.headers.append(
        'Set-Cookie',
        generatePayloadCookie({
          collectionAuthConfig: payload.collections['users'].config.auth,
          cookiePrefix: payload.config.cookiePrefix,
          token: result.token,
        })
      )
    }

    logger.audit(email, 'USER_REGISTERED', 'User', String(user.id), { institution })
    return response
  } catch (err: any) {
    logger.warn(`Registration failed for ${email}: ${err.message}`)
    return NextResponse.json(
      { success: false, message: 'Registration failed. Please try again.' },
      { status: 400 }
    )
  }
}
