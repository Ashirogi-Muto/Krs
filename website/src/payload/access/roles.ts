import type { Access, FieldAccess } from 'payload'

/**
 * Staff roles and what each team may do (enforced on the server, field by field).
 * - SUPER_ADMIN / ADMIN / ORGANIZER: everything for AURIX registrations
 * - FINANCE: read all registrations, edit only payment fields
 * - VERIFIER: read all registrations + ID documents, edit only ID verification
 * - COORDINATOR: read-only, only registrations for their assigned events
 */
export type Role = 'SUPER_ADMIN' | 'ADMIN' | 'ORGANIZER' | 'FINANCE' | 'VERIFIER' | 'COORDINATOR' | 'JUDGE' | 'PARTICIPANT'

export const ADMIN_PANEL_ROLES: Role[] = ['SUPER_ADMIN', 'ADMIN', 'ORGANIZER', 'FINANCE', 'VERIFIER', 'COORDINATOR']
export const MANAGER_ROLES: Role[] = ['SUPER_ADMIN', 'ADMIN', 'ORGANIZER']

type MaybeUser = { [key: string]: any } | null | undefined

export const hasRole = (user: MaybeUser, roles: Role[]) => Boolean(user && roles.includes(user.role as Role))
export const isManager = (user: MaybeUser) => hasRole(user, MANAGER_ROLES)

/** IDs of the events a coordinator is assigned to (works for populated and unpopulated relations). */
export const assignedEventIds = (user: MaybeUser): (number | string)[] => {
  const list = Array.isArray(user?.assignedEvents) ? user!.assignedEvents : []
  return (list as unknown[])
    .map((e) => (e && typeof e === 'object' ? (e as { id?: number | string }).id : e))
    .filter((id): id is number | string => id !== undefined && id !== null)
}

/** Collection-level helpers */
export const managersOnly: Access = ({ req: { user } }) => isManager(user)
export const rolesAccess =
  (roles: Role[]): Access =>
  ({ req: { user } }) =>
    hasRole(user, roles)

/** Field-level helpers */
export const fieldRoles =
  (roles: Role[]): FieldAccess =>
  ({ req: { user } }) =>
    hasRole(user, roles)

/** Hide a collection from the admin navigation for roles that don't need it. */
export const hiddenUnlessManager = ({ user }: { user: MaybeUser }) => !isManager(user)
