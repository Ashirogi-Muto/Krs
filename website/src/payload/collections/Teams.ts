import type { CollectionConfig } from 'payload'

export const Teams: CollectionConfig = {
  slug: 'teams',
  admin: {
    useAsTitle: 'name',
    defaultColumns: ['name', 'code', 'event', 'status', 'createdAt'],
  },
  access: {
    read: ({ req: { user } }) => {
      if (!user) return false
      if (user.role === 'SUPER_ADMIN' || user.role === 'ADMIN' || user.role === 'ORGANIZER' || user.role === 'JUDGE') {
        return true
      }
      // Participants can only view their own teams
      return {
        teamLead: {
          equals: user.id,
        },
      }
    },
    create: ({ req: { user } }) => Boolean(user),
    update: ({ req: { user } }) => {
      if (!user) return false
      if (user.role === 'SUPER_ADMIN' || user.role === 'ADMIN' || user.role === 'ORGANIZER') return true
      return {
        teamLead: {
          equals: user.id,
        },
      }
    },
    delete: ({ req: { user } }) => Boolean(user && (user.role === 'SUPER_ADMIN' || user.role === 'ADMIN')),
  },
  fields: [
    {
      name: 'name',
      type: 'text',
      required: true,
    },
    {
      name: 'code',
      type: 'text',
      required: true,
      unique: true,
      index: true,
      admin: {
        description: 'Human-readable team identifier code',
      },
    },
    {
      name: 'event',
      type: 'relationship',
      relationTo: 'events',
      required: true,
    },
    {
      name: 'teamLead',
      type: 'relationship',
      relationTo: 'users',
      required: true,
    },
    {
      name: 'status',
      type: 'select',
      defaultValue: 'OPEN',
      options: [
        { label: 'Open for Members', value: 'OPEN' },
        { label: 'Team Full', value: 'FULL' },
        { label: 'Locked for Submission', value: 'LOCKED' },
        { label: 'Disqualified', value: 'DISQUALIFIED' },
      ],
    },
  ],
}

export const TeamMembers: CollectionConfig = {
  slug: 'team-members',
  admin: {
    defaultColumns: ['team', 'user', 'role', 'status'],
  },
  access: {
    read: ({ req: { user } }) => {
      if (!user) return false
      if (user.role === 'SUPER_ADMIN' || user.role === 'ADMIN' || user.role === 'ORGANIZER' || user.role === 'JUDGE') {
        return true
      }
      return {
        user: {
          equals: user.id,
        },
      }
    },
    create: ({ req: { user } }) => Boolean(user),
    update: ({ req: { user } }) => Boolean(user && (user.role === 'SUPER_ADMIN' || user.role === 'ADMIN')),
    delete: ({ req: { user } }) => Boolean(user),
  },
  fields: [
    {
      name: 'team',
      type: 'relationship',
      relationTo: 'teams',
      required: true,
    },
    {
      name: 'user',
      type: 'relationship',
      relationTo: 'users',
      required: true,
    },
    {
      name: 'role',
      type: 'select',
      defaultValue: 'MEMBER',
      options: [
        { label: 'Team Lead', value: 'LEAD' },
        { label: 'Member', value: 'MEMBER' },
      ],
    },
    {
      name: 'status',
      type: 'select',
      defaultValue: 'ACTIVE',
      options: [
        { label: 'Active', value: 'ACTIVE' },
        { label: 'Invited', value: 'INVITED' },
      ],
    },
  ],
}

export const Registrations: CollectionConfig = {
  slug: 'registrations',
  admin: {
    defaultColumns: ['team', 'event', 'status', 'paymentStatus', 'createdAt'],
  },
  access: {
    read: ({ req: { user } }) => {
      if (!user) return false
      if (user.role === 'SUPER_ADMIN' || user.role === 'ADMIN' || user.role === 'ORGANIZER') return true
      return false // Handled via scoped team access
    },
    create: ({ req: { user } }) => Boolean(user),
    update: ({ req: { user } }) => Boolean(user && (user.role === 'SUPER_ADMIN' || user.role === 'ADMIN' || user.role === 'ORGANIZER')),
    delete: ({ req: { user } }) => Boolean(user && user.role === 'SUPER_ADMIN'),
  },
  fields: [
    {
      name: 'team',
      type: 'relationship',
      relationTo: 'teams',
      required: true,
    },
    {
      name: 'event',
      type: 'relationship',
      relationTo: 'events',
      required: true,
    },
    {
      name: 'status',
      type: 'select',
      defaultValue: 'PENDING',
      options: [
        { label: 'Draft', value: 'DRAFT' },
        { label: 'Pending Verification', value: 'PENDING' },
        { label: 'Payment Pending', value: 'PAYMENT_PENDING' },
        { label: 'Confirmed', value: 'CONFIRMED' },
        { label: 'Cancelled', value: 'CANCELLED' },
        { label: 'Rejected', value: 'REJECTED' },
      ],
    },
    {
      name: 'paymentStatus',
      type: 'select',
      defaultValue: 'UNPAID',
      options: [
        { label: 'Unpaid / Not Required', value: 'UNPAID' },
        { label: 'Pending Verification', value: 'PENDING' },
        { label: 'Paid & Verified', value: 'PAID' },
        { label: 'Refunded', value: 'REFUNDED' },
      ],
    },
    {
      name: 'paymentReference',
      type: 'text',
      admin: {
        description: 'Server-verified payment transaction ID',
      },
    },
  ],
}
