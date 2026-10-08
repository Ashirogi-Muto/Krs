import type { CollectionConfig } from 'payload'
import { APIError, type Where } from 'payload'
import { ACCOUNT_TYPE_OPTIONS, STAFF_ROLE_OPTIONS, canUseAdmin, isAdmin, isSuperAdmin } from '../access/roles'
import { clientIp, loginAllowed } from '../../lib/rateLimit'
import { DEFAULT_FORM_TEXTS } from '../../lib/form-texts-defaults'

type MessageKey = keyof typeof DEFAULT_FORM_TEXTS.messages
/** A message from CMS → Labels & messages → Messages (built-in text when empty or unreadable). */
const message = async (req: { payload?: any }, key: MessageKey): Promise<string> => {
  try {
    const doc: any = await req.payload?.findGlobal({ slug: 'form-texts', depth: 0 })
    const v = doc?.messages?.[key]
    if (typeof v === 'string' && v.trim()) return v
  } catch {
    // fall through to the built-in text
  }
  return DEFAULT_FORM_TEXTS.messages[key]
}

/** A request that came in through Payload's own REST/GraphQL API (not our route handlers, which use the local API). */
const viaPayloadApi = (req: { payloadAPI?: string }) => req.payloadAPI === 'REST' || req.payloadAPI === 'GraphQL'

export const Users: CollectionConfig = {
  slug: 'users',
  labels: { singular: 'Team account', plural: 'Team & admin accounts' },
  auth: {
    // Native Payload authentication configuration per Pre-Flight Correction #3
    maxLoginAttempts: 5,
    lockTime: 10 * 60 * 1000, // 10 minutes lock upon repeated failures
    tokenExpiration: 24 * 60 * 60, // 24 h session (owner, 7 Oct 2026; was 7 days)
    // The user is reloaded on every request at this depth: their access roles (join below) arrive with their
    // permissions, so every access rule can read them synchronously (access/permissions.ts). Was the default 2.
    depth: 1,
    cookies: {
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'Lax',
    },
    verify: false, // Optional in dev, configurable for prod
  },
  admin: {
    useAsTitle: 'email',
    defaultColumns: ['name', 'email', 'role', 'createdAt'],
    listSearchableFields: ['name', 'email', 'institution'],
    description:
      'Team and admin accounts: set Account type to "Team member", then add them to access roles (Accounts → Access roles → People with this role). They sign in at /admin and only see what their roles allow. Participant accounts are listed under Admin tools → Participants.',
    // Participants have their own screen (Admin tools → Participants); this list is the team. Only the list view
    // is filtered: participant records still open by link and stay selectable in relationship fields.
    baseFilter: () => ({ role: { not_equals: 'PARTICIPANT' } }),
    // Team members don't manage accounts
    hidden: ({ user }) => !isAdmin(user),
  },
  hooks: {
    // Payload's own /api/users/login and /forgot-password bypass our /api/auth/* routes and their limits
    beforeOperation: [
      async ({ args, operation, req }) => {
        if (!viaPayloadApi(req)) return args
        if (operation === 'login' && !loginAllowed(clientIp({ headers: req.headers }))) {
          throw new APIError(await message(req, 'loginTooManyIp'), 429, undefined, true)
        }
        if (operation === 'forgotPassword') {
          // Our /forgot-password page sends the email; this endpoint would only replace a valid emailed reset link
          throw new APIError(await message(req, 'cmsForgotPage'), 403, undefined, true)
        }
        return args
      },
    ],
    beforeChange: [
      async ({ data, operation, req, originalDoc }) => {
        // Email addresses are changed only by admins: a confirmed account must not move to someone else's address
        // (registration uses the account email as the team leader's). Field access below drops it too; this says why.
        if (operation === 'update' && viaPayloadApi(req) && !isAdmin(req.user) && typeof data?.email === 'string') {
          if (data.email.trim().toLowerCase() !== String(originalDoc?.email || '').toLowerCase()) {
            throw new APIError(await message(req, 'cmsEmailAdminOnly'), 403, undefined, true)
          }
        }
        // Participants change their password on the portal profile page (current password required), not over the API
        if (operation === 'update' && viaPayloadApi(req) && !isAdmin(req.user) && originalDoc?.role === 'PARTICIPANT' && (data as any)?.password) {
          throw new APIError(await message(req, 'cmsPasswordPortal'), 403, undefined, true)
        }
        // The very first account (created via /admin "create first user") becomes SUPER_ADMIN.
        // Public self-registration passes context.publicRegistration and is always PARTICIPANT.
        // Public self-registration (participant portal) is always a participant, whatever the request body says
        if (operation === 'create' && req.context?.publicRegistration) {
          return { ...data, role: 'PARTICIPANT', roles: [], assignedEvents: [] }
        }
        if (operation === 'create' && !req.context?.publicRegistration) {
          const { totalDocs } = await req.payload.count({ collection: 'users', req, overrideAccess: true })
          if (totalDocs === 0) {
            return { ...data, role: 'SUPER_ADMIN' }
          }
        }
        // Only the owner can create or promote admins
        const adminLevel = (r: unknown) => r === 'SUPER_ADMIN' || r === 'ADMIN'
        if (req.user && !isSuperAdmin(req.user) && adminLevel(data?.role) && data?.role !== originalDoc?.role) {
          throw new APIError('Only the Super Admin can give admin access.', 403, undefined, true)
        }
        // Staff roles only mean something for team members
        if (data && data.role && data.role !== 'STAFF') return { ...data, roles: [], assignedEvents: [] }
        return data
      },
    ],
  },
  access: {
    // Only admins and team members with at least one role can enter /admin; participants and judges cannot
    admin: ({ req: { user } }) => canUseAdmin(user),
    // Accounts are created by /api/auth/register (participants) or by admins
    create: ({ req: { user } }) => isAdmin(user),
    // Admins can read all, individuals can only read themselves
    read: ({ req: { user } }) => {
      if (!user) return false
      if (isAdmin(user)) return true
      return { id: { equals: user.id } }
    },
    // Admins manage every account except the owner's; everyone else only their own (name, password)
    update: ({ req: { user } }) => {
      if (!user) return false
      if (isSuperAdmin(user)) return true
      if (isAdmin(user)) return { or: [{ role: { not_equals: 'SUPER_ADMIN' } }, { id: { equals: user.id } }] } as Where
      return { id: { equals: user.id } }
    },
    delete: ({ req: { user } }) => isSuperAdmin(user),
    // Payload's default lets ANY logged-in account (a participant too) unlock any account, which defeats the 5-attempt
    // lockout (RBAC audit, 8 Oct 2026). Only admins unlock; the owner's account only by the owner.
    unlock: ({ req: { user } }) => {
      if (isSuperAdmin(user)) return true
      if (isAdmin(user)) return { role: { not_equals: 'SUPER_ADMIN' } } as Where
      return false
    },
  },
  fields: [
    // Merged into Payload's built-in email field (validation, lower-casing, unique): only admins may change it
    {
      name: 'email',
      type: 'email',
      required: true,
      access: { update: ({ req: { user } }) => isAdmin(user) },
    },
    {
      name: 'name',
      type: 'text',
      required: true,
    },
    {
      name: 'role',
      type: 'select',
      required: true,
      label: 'Account type',
      defaultValue: 'PARTICIPANT',
      options: ACCOUNT_TYPE_OPTIONS,
      admin: { description: 'Team members: choose "Team member", then add them to access roles (Accounts → Access roles).' },
      access: {
        // Prevent privilege escalation via mass assignment
        create: ({ req: { user } }) => isAdmin(user),
        update: ({ req: { user } }) => isAdmin(user),
      },
    },
    // Access roles of this account (from Access roles → People with this role). Loaded with the user (auth depth 1).
    {
      name: 'accessRoles',
      label: 'Access roles',
      type: 'join',
      collection: 'access-roles',
      on: 'members',
      defaultLimit: 100,
      admin: { condition: (data) => data?.role === 'STAFF', description: 'Change them on the Access roles page (People with this role).' },
    },
    // The fixed roles used until 8 Oct 2026, kept unchanged in the database during the transition. They still count
    // for an account until the access-roles migration has given it the matching preset roles (legacyRolesMigrated),
    // and are ignored after that. Nobody can edit them any more; removed once the owner confirms.
    {
      name: 'roles',
      type: 'select',
      hasMany: true,
      options: STAFF_ROLE_OPTIONS,
      admin: { hidden: true },
      access: { create: () => false, update: () => false },
    },
    { name: 'legacyRolesMigrated', type: 'checkbox', defaultValue: false, admin: { hidden: true }, access: { create: () => false, update: () => false } },
    {
      name: 'assignedEvents',
      type: 'relationship',
      relationTo: 'events',
      hasMany: true,
      admin: {
        description: 'Used by access roles set to "the events assigned on each person\'s account" (e.g. Technical event team).',
        condition: (data) => data?.role === 'STAFF',
      },
      access: {
        create: ({ req: { user } }) => isAdmin(user),
        update: ({ req: { user } }) => isAdmin(user),
      },
    },
    {
      name: 'institution',
      type: 'text',
      admin: {
        description: 'College or University name',
      },
    },
    {
      name: 'phone',
      type: 'text',
      admin: {
        description: 'Private operational contact number (Never exposed publicly)',
      },
      access: {
        // Data minimization & privacy per Domain 06 / Domain 20
        read: ({ req: { user }, id }) => {
          if (!user) return false
          if (isAdmin(user)) return true
          return user.id === id
        },
      },
    },
    // ── AURIX participant email confirmation (only gates participants; staff/admin logins never depend on it) ──
    {
      name: 'emailVerified',
      label: 'Email confirmed',
      type: 'checkbox',
      defaultValue: false,
      access: { create: ({ req: { user } }) => isAdmin(user), update: ({ req: { user } }) => isAdmin(user) },
      admin: {
        position: 'sidebar',
        description:
          'Participants must confirm their email before they can use the AURIX portal or register a team. Unconfirmed participant accounts are deleted after 7 days. Admins can tick this by hand.',
      },
    },
    { name: 'emailVerifiedAt', type: 'date', admin: { readOnly: true, position: 'sidebar', condition: (d: any) => Boolean(d?.emailVerified) } },
    {
      // sha256 of the emailed token (the token itself is never stored); read/written only by the server
      name: 'verifyTokenHash',
      type: 'text',
      hidden: true,
      access: { read: () => false, create: () => false, update: () => false },
    },
    { name: 'verifyTokenExpires', type: 'date', hidden: true, access: { read: () => false, create: () => false, update: () => false } },
  ],
}
