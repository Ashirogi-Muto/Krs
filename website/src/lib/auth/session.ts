import { headers } from 'next/headers'
import { getPayload } from 'payload'
import config from '@payload-config'

export type UserRole = 'SUPER_ADMIN' | 'ADMIN' | 'ORGANIZER' | 'FINANCE' | 'VERIFIER' | 'COORDINATOR' | 'JUDGE' | 'PARTICIPANT'

export interface AuthUser {
  id: string
  email: string
  name: string
  role: UserRole
  institution?: string
  phone?: string
}

/**
 * Resolves the signed-in user from the request cookies using Payload's native auth,
 * which verifies the token signature, expiry and that the user still exists.
 * Returns null when there is no valid session.
 */
export async function getSessionUser(): Promise<AuthUser | null> {
  // Read request headers first: this marks callers as dynamic so Next never prerenders them at build time
  const requestHeaders = await headers()
  const payload = await getPayload({ config })
  const { user } = await payload.auth({ headers: requestHeaders })

  if (!user || user.collection !== 'users') {
    return null
  }

  return {
    id: String(user.id),
    email: user.email,
    name: user.name,
    role: user.role,
    institution: user.institution ?? undefined,
    phone: user.phone ?? undefined,
  }
}

/**
 * Server-side RBAC authorization guard
 */
export async function requireAuthUser(requiredRole?: UserRole): Promise<AuthUser> {
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
