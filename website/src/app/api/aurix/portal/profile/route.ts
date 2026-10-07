import { NextResponse } from 'next/server'
import { z } from 'zod'
import { getPayload } from 'payload'
import { generatePayloadCookie } from 'payload/shared'
import config from '@payload-config'
import { getSessionUser } from '@/lib/auth/session'
import { isRouteVisibleOnServer as isRouteVisible } from '@/lib/visibility-guard'
import { clientIp, rateLimit } from '@/lib/rateLimit'
import { logger } from '@/lib/logger'
import { isSameOrigin } from '@/lib/auth/same-origin'
import { PERSON_NAME, PERSON_NAME_MESSAGE } from '@/lib/auth/participant'

export const dynamic = 'force-dynamic'

const UpdateProfileSchema = z.object({
  action: z.literal('update_profile'),
  name: z.string().trim().regex(PERSON_NAME, PERSON_NAME_MESSAGE),
  phone: z.string().trim().min(8).max(20),
  institution: z.string().trim().min(2).max(200),
})

const ChangePasswordSchema = z.object({
  action: z.literal('change_password'),
  currentPassword: z.string().min(1),
  newPassword: z.string().min(8, 'New password must be at least 8 characters long.').max(128),
})

export async function POST(req: Request) {
  // Gate check: Portal APIs return 404 when portal is hidden
  if (!(await isRouteVisible('/aurix/portal'))) {
    return NextResponse.json({ success: false, message: 'Not found.' }, { status: 404 })
  }

  // Only from this site (blocks cross-site form posts riding on the session cookie)
  if (!isSameOrigin(req)) {
    return NextResponse.json({ success: false, message: 'Bad origin.' }, { status: 403 })
  }

  const user = await getSessionUser()
  if (!user) {
    return NextResponse.json({ success: false, message: 'Authentication required.' }, { status: 401 })
  }
  // The portal shows only the "confirm your email" screen until then; the API must not be usable either
  if (user.role === 'PARTICIPANT' && !user.emailVerified) {
    return NextResponse.json({ success: false, message: 'Please confirm your email address first.' }, { status: 403 })
  }

  // Rate limiting (10 attempts per hour per user, 20 per IP)
  const ip = clientIp(req)
  if (!rateLimit(`profile-ip:${ip}`, 20, 60 * 60 * 1000) || !rateLimit(`profile:${user.id}`, 10, 60 * 60 * 1000)) {
    return NextResponse.json(
      { success: false, message: 'Too many profile update attempts. Please try again later.' },
      { status: 429 }
    )
  }


  let body: any
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ success: false, message: 'Invalid request body.' }, { status: 400 })
  }

  const payload = await getPayload({ config })

  // Action 1: Update Profile
  if (body?.action === 'update_profile') {
    const parsed = UpdateProfileSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, message: parsed.error.issues.some((i) => i.path[0] === 'name') ? PERSON_NAME_MESSAGE : 'Please provide valid profile details.' },
        { status: 400 }
      )
    }

    try {
      // Role and email are strictly omitted from update payload (prevent privilege escalation)
      const updated = await payload.update({
        collection: 'users',
        id: user.id,
        data: {
          name: parsed.data.name,
          phone: parsed.data.phone,
          institution: parsed.data.institution,
        },
      })

      logger.audit(user.email, 'PROFILE_UPDATED', 'User', String(user.id))

      return NextResponse.json({
        success: true,
        message: 'Profile updated successfully.',
        user: {
          name: updated.name,
          phone: updated.phone,
          institution: updated.institution,
        },
      })
    } catch (err: any) {
      logger.error(`[profile] Error updating profile for ${user.email}: ${err.message}`)
      return NextResponse.json(
        { success: false, message: 'Unable to update profile. Please try again.' },
        { status: 500 }
      )
    }
  }

  // Action 2: Change Password
  if (body?.action === 'change_password') {
    const parsed = ChangePasswordSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, message: parsed.error.issues[0]?.message || 'Invalid password payload.' },
        { status: 400 }
      )
    }

    try {
      // Verify current password by attempting authentication
      await payload.login({
        collection: 'users',
        data: {
          email: user.email,
          password: parsed.data.currentPassword,
        },
      })
    } catch {
      return NextResponse.json(
        { success: false, message: 'Current password is incorrect.' },
        { status: 400 }
      )
    }

    try {
      // Update password hash natively through Payload; every existing session ends (a stolen cookie stops working)
      await payload.update({
        collection: 'users',
        id: user.id,
        data: {
          password: parsed.data.newPassword,
          sessions: [],
        } as any,
        overrideAccess: true, // verified via login call above
      })
      // ...and this device gets a fresh session
      const fresh = await payload.login({ collection: 'users', data: { email: user.email, password: parsed.data.newPassword } })

      logger.audit(user.email, 'PASSWORD_CHANGED', 'User', String(user.id), { otherSessionsEnded: true })

      const res = NextResponse.json({
        success: true,
        message: 'Password changed successfully. You were signed out on your other devices.',
      })
      if (fresh.token) {
        res.headers.append(
          'Set-Cookie',
          generatePayloadCookie({ collectionAuthConfig: payload.collections['users'].config.auth, cookiePrefix: payload.config.cookiePrefix, token: fresh.token }),
        )
      }
      return res
    } catch (err: any) {
      logger.error(`[profile] Error changing password for ${user.email}: ${err.message}`)
      return NextResponse.json(
        { success: false, message: 'Failed to update password. Please try again.' },
        { status: 500 }
      )
    }
  }

  return NextResponse.json({ success: false, message: 'Invalid action.' }, { status: 400 })
}
