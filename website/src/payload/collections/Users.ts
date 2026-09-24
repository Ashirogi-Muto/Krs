import type { CollectionConfig } from 'payload'

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
  },
  access: {
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
        { label: 'Judge', value: 'JUDGE' },
        { label: 'Participant', value: 'PARTICIPANT' },
      ],
      access: {
        // Prevent privilege escalation via mass assignment
        update: ({ req: { user } }) => Boolean(user && (user.role === 'SUPER_ADMIN' || user.role === 'ADMIN')),
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
