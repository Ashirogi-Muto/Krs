import type { Access, FieldAccess } from 'payload'

/**
 * Who may see and change what in the CMS (enforced on the server, collection by collection and field by field).
 *
 * Every account has one account type (`role`):
 *   SUPER_ADMIN (owner) and ADMIN: everything.
 *   STAFF: a team member; their access comes only from the roles ticked in `roles` (several allowed).
 *   JUDGE / PARTICIPANT: no CMS access.
 *
 * Staff roles (agreed with the owner, 2 Oct 2026):
 *   Teams    REGISTRATION   all registrations, ID cards, contacts; sets ID verification and confirms/rejects teams
 *            TECH_EVENT     rosters of their assigned events (names, colleges, leader phone), check-in CSV
 *            LOGISTICS      counts per event, participant list without emails or ID cards
 *            DISCIPLINE     names, teams, colleges, events (no contacts, no ID cards)
 *            TECH_SUPPORT   status look-ups (code, team, statuses), no contacts or ID cards
 *            MEDIA          website content (event texts, posts, gallery, people, short links) + registration totals
 *            SPONSORS       totals only (registrations, participants, colleges, events, prize pools)
 *            DECORATION     totals per event
 *            FINANCE        money dashboard; edits payment fields
 *   Core     TEAM_HEAD      with a team role: that team's CSV export (tech-event heads see all events)
 *            CORE_MEMBER, SUPERVISOR   all dashboards, registrations read-only (no contacts, no ID cards)
 *            PRESIDENT, EVENT_HEAD     manage registrations (all fields, all exports); event heads also edit events
 *            TREASURER      finance view (read-only) and finance CSV
 */
export type AccountType = 'SUPER_ADMIN' | 'ADMIN' | 'STAFF' | 'JUDGE' | 'PARTICIPANT'
export type StaffRole =
  | 'REGISTRATION'
  | 'TECH_EVENT'
  | 'LOGISTICS'
  | 'DISCIPLINE'
  | 'TECH_SUPPORT'
  | 'MEDIA'
  | 'SPONSORS'
  | 'DECORATION'
  | 'FINANCE'
  | 'TEAM_HEAD'
  | 'CORE_MEMBER'
  | 'SUPERVISOR'
  | 'PRESIDENT'
  | 'EVENT_HEAD'
  | 'TREASURER'

export const ACCOUNT_TYPE_OPTIONS: { label: string; value: AccountType }[] = [
  { label: 'Super Admin (owner)', value: 'SUPER_ADMIN' },
  { label: 'Admin (full access)', value: 'ADMIN' },
  { label: 'Team member (access from Roles)', value: 'STAFF' },
  { label: 'Judge', value: 'JUDGE' },
  { label: 'Participant', value: 'PARTICIPANT' },
]

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

export const isSuperAdmin = (user: MaybeUser) => Boolean(user && user.role === 'SUPER_ADMIN')
export const isAdmin = (user: MaybeUser) => Boolean(user && (user.role === 'SUPER_ADMIN' || user.role === 'ADMIN'))

/** Staff roles of a team member (empty for every other account type). */
export const staffRoles = (user: MaybeUser): StaffRole[] =>
  user && user.role === 'STAFF' && Array.isArray(user.roles) ? (user.roles as StaffRole[]) : []

/** True for admins, or for a team member holding any of `roles`. */
export const hasRole = (user: MaybeUser, roles: StaffRole[]) => {
  if (isAdmin(user)) return true
  const mine = staffRoles(user)
  return roles.some((r) => mine.includes(r))
}
/** True only when the team member holds the role themselves (admins excluded). */
export const holds = (user: MaybeUser, role: StaffRole) => staffRoles(user).includes(role)

// Groups used across the CMS
export const REG_MANAGERS: StaffRole[] = ['PRESIDENT', 'EVENT_HEAD']
export const OVERVIEW: StaffRole[] = [...REG_MANAGERS, 'CORE_MEMBER', 'SUPERVISOR']
/** Read every registration (field rules below still apply). */
export const REG_READ_ALL: StaffRole[] = [...OVERVIEW, 'REGISTRATION', 'FINANCE', 'TREASURER', 'LOGISTICS', 'DISCIPLINE', 'TECH_SUPPORT']
export const SEE_CONTACTS: StaffRole[] = [...REG_MANAGERS, 'REGISTRATION', 'FINANCE']
export const SEE_LEADER_PHONE: StaffRole[] = [...SEE_CONTACTS, 'TECH_EVENT', 'LOGISTICS']
export const SEE_IDS: StaffRole[] = [...REG_MANAGERS, 'REGISTRATION']
export const SEE_MONEY: StaffRole[] = [...OVERVIEW, 'FINANCE', 'TREASURER']
export const SEE_NOTES: StaffRole[] = [...REG_MANAGERS, 'REGISTRATION', 'FINANCE']
export const CONTENT_EDITORS: StaffRole[] = ['MEDIA']
export const EVENT_EDITORS: StaffRole[] = ['EVENT_HEAD', 'MEDIA']

/** Anyone with at least one staff role (or an admin) may sign in to /admin. */
export const canUseAdmin = (user: MaybeUser) => isAdmin(user) || staffRoles(user).length > 0

/** Registration manager: admins, President, Event Head (also used for the hidden portal/judging collections). */
export const isManager = (user: MaybeUser) => hasRole(user, REG_MANAGERS)

/** Tech-event members without another all-events role only see their assigned events. */
export const limitedToAssignedEvents = (user: MaybeUser) =>
  !hasRole(user, REG_READ_ALL) && holds(user, 'TECH_EVENT') && !holds(user, 'TEAM_HEAD')

/** IDs of the events a technical-event member is assigned to (populated or unpopulated relation). */
export const assignedEventIds = (user: MaybeUser): (number | string)[] => {
  const list = Array.isArray(user?.assignedEvents) ? user!.assignedEvents : []
  return (list as unknown[])
    .map((e) => (e && typeof e === 'object' ? (e as { id?: number | string }).id : e))
    .filter((id): id is number | string => id !== undefined && id !== null)
}

/**
 * Event-day check-in (/checkin): registration managers, Registration and Logistics for every event;
 * technical-event members for their assigned events (all events when Team Head).
 * Returns null when the account may not check teams in, 'all', or the allowed event IDs.
 */
export const CHECKIN_ALL: StaffRole[] = [...REG_MANAGERS, 'REGISTRATION', 'LOGISTICS']
export const checkInScope = (user: MaybeUser): 'all' | (number | string)[] | null => {
  if (hasRole(user, CHECKIN_ALL)) return 'all'
  if (holds(user, 'TECH_EVENT')) return holds(user, 'TEAM_HEAD') ? 'all' : assignedEventIds(user)
  return null
}

/** Upload the Razorpay report and record matched payments (/payment-matching). */
export const PAYMENT_MATCHERS: StaffRole[] = [...REG_MANAGERS, 'FINANCE']

/** CSV exports each account may download (see /api/admin/registrations-export). */
export type ExportView = 'full' | 'finance' | 'checkin' | 'roster'
export const exportViews = (user: MaybeUser): ExportView[] => {
  const head = holds(user, 'TEAM_HEAD')
  const views: ExportView[] = []
  if (isManager(user) || (head && holds(user, 'REGISTRATION'))) views.push('full')
  if (hasRole(user, [...REG_MANAGERS, 'FINANCE', 'TREASURER'])) views.push('finance')
  if (isManager(user) || holds(user, 'TECH_EVENT') || (head && holds(user, 'LOGISTICS'))) views.push('checkin')
  if (views.includes('checkin') || (head && holds(user, 'DISCIPLINE'))) views.push('roster')
  return views
}

/** Collection-level helpers */
export const adminsOnly: Access = ({ req: { user } }) => isAdmin(user)
export const superAdminOnly: Access = ({ req: { user } }) => isSuperAdmin(user)
export const managersOnly: Access = ({ req: { user } }) => isManager(user)
export const rolesAccess =
  (roles: StaffRole[]): Access =>
  ({ req: { user } }) =>
    hasRole(user, roles)

/** Field-level helpers */
export const fieldRoles =
  (roles: StaffRole[]): FieldAccess =>
  ({ req: { user } }) =>
    hasRole(user, roles)

/** Admin navigation: hide a collection from everyone outside `roles`. */
export const hiddenUnless =
  (roles: StaffRole[]) =>
  ({ user }: { user: MaybeUser }) =>
    !hasRole(user, roles)
export const hiddenUnlessManager = hiddenUnless(REG_MANAGERS)
