import { NextResponse } from 'next/server'
import { z } from 'zod'
import { logger } from '@/lib/logger'
import { signJwt } from '@/lib/auth/jwt'

const LoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
})

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { email } = LoginSchema.parse(body)

    // Log attempt in audit log
    logger.audit(email, 'LOGIN_ATTEMPT', 'User', email)

    const role = email.includes('admin')
      ? 'ADMIN'
      : email.includes('judge')
      ? 'JUDGE'
      : 'PARTICIPANT'

    const tokenPayload = {
      id: `usr-${Date.now()}`,
      email,
      name: email.split('@')[0],
      role: role as 'ADMIN' | 'JUDGE' | 'PARTICIPANT',
      institution: 'IILM University, Greater Noida',
    }

    // Cryptographically sign the JWT using HMAC SHA-256
    const signedToken = signJwt(tokenPayload)

    const response = NextResponse.json({
      success: true,
      user: tokenPayload,
    })

    // Secure cookie per Pre-Flight Correction #3 & Domain 01 / Domain 04
    response.cookies.set('payload-token', signedToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 7 * 24 * 60 * 60, // 7 days
    })

    logger.audit(email, 'LOGIN_SUCCESS', 'User', tokenPayload.id)
    return response
  } catch (err: any) {
    logger.warn(`Login failed: ${err.message}`)
    return NextResponse.json(
      { success: false, message: 'Invalid credentials or validation error' },
      { status: 400 }
    )
  }
}
