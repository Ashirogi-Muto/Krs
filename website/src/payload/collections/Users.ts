import type { CollectionConfig } from 'payload'
import { ADMIN_PANEL_ROLES, hasRole } from '../access/roles'

const isAdmin = (user: any) => Boolean(user && (user.role === 'SUPER_ADMIN' || user.role === 'ADMIN'))

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
    defaultColumns: ['name', 'email', 'role', 'createdAt'],
    // Team accounts (finance, verification, coordinators) don't manage users
    hidden: ({ user }) => !isAdmin(user),
  },
  hooks: {
    beforeChange: [
      async ({ data, operation, req }) => {
        // The very first account (created via /admin "create first user") becomes SUPER_ADMIN.
        // Public self-registration passes context.publicRegistration and is always PARTICIPANT.
        if (operation === 'create' && !req.context?.publicRegistration) {
          const { totalDocs } = await req.payload.count({ collection: 'users', req, overrideAccess: true })
          if (totalDocs === 0) {
            return { ...data, role: 'SUPER_ADMIN' }
          }
        }
        return data
      },
    ],
  },
  access: {
    // Only staff teams can enter the Payload admin panel; participants and judges cannot
    admin: ({ req: { user } }) => hasRole(user, ADMIN_PANEL_ROLES),
    // Accounts are created by /api/auth/register (participants) or by admins
    create: ({ req: { user } }) => isAdmin(user),
    // Admins can read all, individuals can only read themselves
    read: ({ req: { user } }) => {
      if (!user) return false
      if (user.role === 'SUPER_ADMIN' || user.role === 'ADMIN') return true
      return { id: { equals: user.id } }
    },
    update: ({ req: { user } }) => {
      if (!user) return false
      if (user.role === 'SUPER_ADMIN' || user.role === 'ADMIN') return true
      return { id: { equals: user.id } }
    },
    delete: ({ req: { user } }) => Boolean(user && user.role === 'SUPER_ADMIN'),
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
      defaultValue: 'PARTICIPANT',
      options: [
        { label: 'Super Admin', value: 'SUPER_ADMIN' },
        { label: 'Admin', value: 'ADMIN' },
        { label: 'Event Organizer', value: 'ORGANIZER' },
        { label: 'Finance Team', value: 'FINANCE' },
        { label: 'ID Verification Team', value: 'VERIFIER' },
        { label: 'Event Coordinator', value: 'COORDINATOR' },
        { label: 'Judge', value: 'JUDGE' },
        { label: 'Participant', value: 'PARTICIPANT' },
      ],
      access: {
        // Prevent privilege escalation via mass assignment
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
        description: 'Event coordinators only see registrations for these events.',
        condition: (data) => data?.role === 'COORDINATOR',
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
          if (user.role === 'SUPER_ADMIN' || user.role === 'ADMIN') return true
          return user.id === id
        },
      },
    },
  ],
}
