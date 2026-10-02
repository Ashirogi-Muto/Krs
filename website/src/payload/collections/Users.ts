import type { CollectionConfig } from 'payload'
import { APIError, type Where } from 'payload'
import { ACCOUNT_TYPE_OPTIONS, STAFF_ROLE_OPTIONS, canUseAdmin, isAdmin, isSuperAdmin } from '../access/roles'

export const Users: CollectionConfig = {
  slug: 'users',
  auth: {
    // Native Payload authentication configuration per Pre-Flight Correction #3
    maxLoginAttempts: 5,
    lockTime: 10 * 60 * 1000, // 10 minutes lock upon repeated failures
    tokenExpiration: 7 * 24 * 60 * 60, // 7 days session
    cookies: {
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'Lax',
    },
    verify: false, // Optional in dev, configurable for prod
  },
  admin: {
    useAsTitle: 'email',
    defaultColumns: ['name', 'email', 'role', 'roles', 'createdAt'],
    description:
      'Team accounts: set Account type to "Team member" and tick their Roles (several allowed). They sign in at /admin and only see what their roles allow.',
    // Team members don't manage accounts
    hidden: ({ user }) => !isAdmin(user),
  },
  hooks: {
    beforeChange: [
      async ({ data, operation, req, originalDoc }) => {
        // The very first account (created via /admin "create first user") becomes SUPER_ADMIN.
        // Public self-registration passes context.publicRegistration and is always PARTICIPANT.
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
  },
  fields: [
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
      admin: { description: 'Team members: choose "Team member" and tick their roles below.' },
      access: {
        // Prevent privilege escalation via mass assignment
        create: ({ req: { user } }) => isAdmin(user),
        update: ({ req: { user } }) => isAdmin(user),
      },
    },
    {
      name: 'roles',
      type: 'select',
      hasMany: true,
      options: STAFF_ROLE_OPTIONS,
      admin: {
        description:
          'Tick every team and core role this person holds. Team Head + a team = that team\'s CSV export. Technical event team members only see their Assigned events.',
        condition: (data) => data?.role === 'STAFF',
      },
      access: {
        create: ({ req: { user } }) => isAdmin(user),
        update: ({ req: { user } }) => isAdmin(user),
      },
    },
    {
      name: 'assignedEvents',
      type: 'relationship',
      relationTo: 'events',
      hasMany: true,
      admin: {
        description: 'Technical event team: the events whose registrations this person sees.',
        condition: (data) => data?.role === 'STAFF' && Array.isArray(data?.roles) && data.roles.includes('TECH_EVENT'),
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
  ],
}
