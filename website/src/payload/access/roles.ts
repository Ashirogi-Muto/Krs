import type { Access, FieldAccess } from 'payload'
import { accessFor, accessForAny, can, canAll, canFor, canUseCms, eventIdOf, isAdminUser, isSuperAdminUser } from './permissions'

/**
 * Account types and the helpers every access rule uses. What a team member may do comes from their access roles
 * (CMS → Accounts → Access roles; see permissions.ts and docs/ACCESS_ROLES_PLAN.md):
 *   SUPER_ADMIN (owner): everything. ADMIN: everything but the Super Admin's permanent deletions (SUPER_GRANTED_ONLY:
 *   retention, deleting registrations/ID files/accounts/events/emails), which only the Super Admin can put in a role.
 *   STAFF ("Team member"): the union of their access roles.
 *   JUDGE / PARTICIPANT: no CMS access (judges keep read + download of round submissions over the API).
 */
export type AccountType = 'SUPER_ADMIN' | 'ADMIN' | 'STAFF' | 'JUDGE' | 'PARTICIPANT'

export const ACCOUNT_TYPE_OPTIONS: { label: string; value: AccountType }[] = [
  { label: 'Super Admin (owner)', value: 'SUPER_ADMIN' },
  { label: 'Admin (full access)', value: 'ADMIN' },
  { label: 'Team member (access from Access roles)', value: 'STAFF' },
  { label: 'Judge', value: 'JUDGE' },
  { label: 'Participant', value: 'PARTICIPANT' },
]

type MaybeUser = { [key: string]: any } | null | undefined

export const isSuperAdmin = (user: MaybeUser) => isSuperAdminUser(user)
export const isAdmin = (user: MaybeUser) => isAdminUser(user)
/** May sign in to /admin: admins, and team members holding at least one permission. */
export const canUseAdmin = (user: MaybeUser) => canUseCms(user)

/** IDs of the events assigned on an account (populated or unpopulated relation). */
export const assignedEventIds = (user: MaybeUser): (number | string)[] => {
  const items = Array.isArray(user?.assignedEvents) ? user!.assignedEvents : []
  return (items as unknown[])
    .map((e) => (e && typeof e === 'object' ? (e as { id?: number | string }).id : e))
    .filter((id): id is number | string => id !== undefined && id !== null)
}

// ---------------------------------------------------------------------------------------------------------------
// Access-rule builders (collections, fields, sidebar)

export const adminsOnly: Access = ({ req: { user } }) => isAdmin(user)
export const superAdminOnly: Access = ({ req: { user } }) => isSuperAdmin(user)

/** Collection access for a key whose limit is measured on `field` ('id' for documents, 'event' for registrations). */
export const keyAccess =
  (key: string, field = 'id'): Access =>
  ({ req: { user } }) =>
    accessFor(user, key, field) as any
/**
 * Create: only an unlimited grant counts. A "limited to chosen documents" filter means nothing for a document that
 * doesn't exist yet, and Payload would treat any filter as "allowed" (the role editor also refuses this combination).
 */
export const createAccess =
  (key: string): Access =>
  ({ req: { user } }) =>
    canAll(user, key)
/** Collection access for any of several keys. */
export const anyKeyAccess =
  (keys: string[], field = 'id'): Access =>
  ({ req: { user } }) =>
    accessForAny(user, keys, field) as any
/** Unlimited keys (globals, tools): holds it at all. */
export const keyAllowed =
  (key: string): Access =>
  ({ req: { user } }) =>
    can(user, key)

/** Field access on registrations/submissions: the key for this document's event (fail closed without a document). */
export const eventFieldKey =
  (key: string): FieldAccess =>
  ({ req: { user }, doc }) =>
    doc ? canFor(user, key, eventIdOf(doc)) : canAll(user, key)
/** Field access on a document-limited collection: the key for this document. */
export const docFieldKey =
  (key: string): FieldAccess =>
  ({ req: { user }, doc }) =>
    doc ? canFor(user, key, (doc as any).id) : canAll(user, key)

/** Sidebar: hide unless the user holds at least one of the keys (for any event/document). */
export const hiddenUnlessAny =
  (keys: string[]) =>
  ({ user }: { user: MaybeUser }) =>
    !keys.some((k) => can(user, k))
