import type { Payload } from 'payload'

/**
 * Payload hands the admin's nav and dashboard components a user whose `accessRoles` join holds only role IDs, so
 * `can()` sees no rights there and team members got no role panels or sidebar links (found 9 Oct 2026). Collection
 * access rules receive the populated user and were never affected. This reloads the account with its roles
 * (auth.depth = 1 populates the join) when they are not loaded yet; everyone else is returned unchanged.
 */
export async function withAccessRoles<U extends Record<string, any> | null | undefined>(payload: Payload, user: U): Promise<U> {
  if (!user || user.role !== 'STAFF') return user
  const joined = user.accessRoles
  const docs: unknown[] = Array.isArray(joined) ? joined : Array.isArray(joined?.docs) ? joined.docs : []
  if (docs.every((d) => d && typeof d === 'object')) return user
  const full = await payload.findByID({ collection: 'users', id: user.id, depth: 1, overrideAccess: true }).catch(() => null)
  return (full ? { ...user, accessRoles: (full as any).accessRoles } : user) as U
}
