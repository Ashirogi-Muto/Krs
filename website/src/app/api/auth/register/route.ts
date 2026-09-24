import { NextResponse } from 'next/server'
import { z } from 'zod'
import { logger } from '@/lib/logger'
import { signJwt } from '@/lib/auth/jwt'

const RegisterSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(8),
  institution: z.string().min(2),
  phone: z.string().min(8),
})

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const validated = RegisterSchema.parse(body)

    const userId = `usr-${Date.now()}`
    const tokenPayload = {
      id: userId,
      email: validated.email,
      name: validated.name,
      role: 'PARTICIPANT' as const,
      institution: validated.institution,
      phone: validated.phone,
    }

    // Cryptographically sign the JWT using HMAC SHA-256
    const signedToken = signJwt(tokenPayload)

    const response = NextResponse.json({
      success: true,
      user: tokenPayload,
    })

    response.cookies.set('payload-token', signedToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 7 * 24 * 60 * 60,
    })

    logger.audit(validated.email, 'USER_REGISTERED', 'User', userId, {
      institution: validated.institution,
    })

    return response
  } catch (err: any) {
    logger.warn(`Registration failed: ${err.message}`)
    return NextResponse.json(
      { success: false, message: 'Invalid registration parameters' },
      { status: 400 }
    )
  }
}
