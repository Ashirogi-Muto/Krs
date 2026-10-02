import { NextResponse } from 'next/server'
import { z } from 'zod'
import { getPayload } from 'payload'
import { generatePayloadCookie } from 'payload/shared'
import config from '@payload-config'
import { logger } from '@/lib/logger'
import { isRouteVisibleOnServer as isRouteVisible } from '@/lib/visibility-guard'

const LoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
})

export async function POST(req: Request) {
  // Participant sign-up/sign-in is closed while the portal pages are hidden
  if (!(await isRouteVisible('/login'))) {
    return NextResponse.json({ success: false, message: 'Not found.' }, { status: 404 })
  }
  let email = 'unknown'
  try {
    const body = await req.json()
    const parsed = LoginSchema.parse(body)
    email = parsed.email.toLowerCase()

    logger.audit(email, 'LOGIN_ATTEMPT', 'User', email)

    // Payload verifies the password hash and enforces maxLoginAttempts / lockTime
    const payload = await getPayload({ config })
    const result = await payload.login({
      collection: 'users',
      data: { email, password: parsed.password },
    })

    if (!result.token || !result.user) {
      throw new Error('Login did not return a session')
    }

    const response = NextResponse.json({
      success: true,
      user: {
        id: result.user.id,
        email: result.user.email,
        name: result.user.name,
        role: result.user.role,
      },
    })

    const usersCollection = payload.collections['users'].config
    response.headers.append(
      'Set-Cookie',
      generatePayloadCookie({
        collectionAuthConfig: usersCollection.auth,
        cookiePrefix: payload.config.cookiePrefix,
        token: result.token,
      })
    )

    logger.audit(email, 'LOGIN_SUCCESS', 'User', String(result.user.id))
    return response
  } catch (err: any) {
    logger.warn(`Login failed for ${email}: ${err.message}`)
    return NextResponse.json(
      { success: false, message: 'Invalid email or password.' },
      { status: 401 }
    )
  }
}
