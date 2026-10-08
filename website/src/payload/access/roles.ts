import type { Access, FieldAccess } from 'payload'
import { accessFor, accessForAny, can, canAll, canFor, canUseCms, eventIdOf, isAdminUser, isSuperAdminUser } from './permissions'

/**
 * Account types and the helpers every access rule uses. What a team member may do comes from their access roles
 * (CMS → Accounts → Access roles; see permissions.ts and docs/ACCESS_ROLES_PLAN.md):
 *   SUPER_ADMIN (owner) and ADMIN: everything (owner-only: retention, deleting registrations/accounts/events, …).
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

/**
 * The fixed staff roles used until 8 Oct 2026. Kept (hidden, read-only) on accounts during the transition: each value
 * still grants its preset (permissions.ts legacyPresets). Removed once the owner confirms.
 */
export type StaffRole =
  | 'REGISTRATION' | 'TECH_EVENT' | 'LOGISTICS' | 'DISCIPLINE' | 'TECH_SUPPORT' | 'MEDIA' | 'SPONSORS' | 'DECORATION'
  | 'FINANCE' | 'TEAM_HEAD' | 'CORE_MEMBER' | 'SUPERVISOR' | 'PRESIDENT' | 'EVENT_HEAD' | 'TREASURER'
export const STAFF_ROLE_OPTIONS: { label: string; value: StaffRole }[] = [
  { label: 'Registration team', value: 'REGISTRATION' },
  { label: 'Technical event team (assigned events)', value: 'TECH_EVENT' },
  { label: 'Logistics', value: 'LOGISTICS' },
  { label: 'Discipline committee', value: 'DISCIPLINE' },
  { label: 'Technical support', value: 'TECH_SUPPORT' },
  { label: 'Media & outreach', value: 'MEDIA' },
  { label: 'Sponsors', value: 'SPONSORS' },
  { label: 'Decoration', value: 'DECORATION' },
  { label: 'Finance', value: 'FINANCE' },
  { label: 'Core: Team Head', value: 'TEAM_HEAD' },
  { label: 'Core: Core Member', value: 'CORE_MEMBER' },
  { label: 'Core: Supervisor', value: 'SUPERVISOR' },
  { label: 'Core: President', value: 'PRESIDENT' },
  { label: 'Core: Event Head', value: 'EVENT_HEAD' },
  { label: 'Core: Treasurer', value: 'TREASURER' },
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
