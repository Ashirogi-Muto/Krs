import { cookies } from 'next/headers'
import { verifyJwt, type JwtClaims } from './jwt'

export interface AuthUser {
  id: string
  email: string
  name: string
  role: 'SUPER_ADMIN' | 'ADMIN' | 'ORGANIZER' | 'JUDGE' | 'PARTICIPANT'
  institution?: string
  phone?: string
}

/**
 * In Next.js App Router, retrieves authenticated user context from secure cookies
 * Strictly verifies the cryptographic HMAC SHA-256 signature using PAYLOAD_SECRET.
 * If signature verification fails or token is expired/missing, returns null.
 */
export async function getSessionUser(): Promise<AuthUser | null> {
  const cookieStore = await cookies()
  const token = cookieStore.get('payload-token')?.value

  if (!token) {
    return null
  }

  const verified = verifyJwt<JwtClaims>(token)
  if (!verified) {
    return null
  }

  return {
    id: verified.id,
    email: verified.email,
    name: verified.name,
    role: verified.role,
    institution: verified.institution,
    phone: verified.phone,
  }
}

/**
 * Server-side RBAC authorization guard
 */
export async function requireAuthUser(requiredRole?: string): Promise<AuthUser> {
  const user = await getSessionUser()
  if (!user) {
    throw new Error('UNAUTHORIZED: Authentication required')
  }

  if (
    requiredRole &&
    user.role !== requiredRole &&
    user.role !== 'SUPER_ADMIN' &&
    user.role !== 'ADMIN'
  ) {
    throw new Error('FORBIDDEN: Insufficient privileges')
  }

  return user
}
