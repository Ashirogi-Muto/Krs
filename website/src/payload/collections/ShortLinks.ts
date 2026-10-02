import type { Access, CollectionConfig } from 'payload'

const isStaff: Access = ({ req: { user } }) =>
  Boolean(user && (user.role === 'SUPER_ADMIN' || user.role === 'ADMIN' || user.role === 'ORGANIZER'))

/**
 * Permanent short links: go.kalamroboticssociety.com/<slug> (and /go/<slug> on the main site).
 * Point a link at an event (it follows the event even if the event's URL changes), a site page,
 * or any external URL. Redirects are temporary (302), so edits take effect immediately.
 */
export const ShortLinks: CollectionConfig = {
  slug: 'short-links',
  admin: {
    useAsTitle: 'slug',
    defaultColumns: ['slug', 'destinationType', 'event', 'path', 'active', 'clicks'],
    description: 'Short links: https://go.kalamroboticssociety.com/<slug> or https://kalamroboticssociety.com/go/<slug>',
  },
  access: {
    read: isStaff,
    create: isStaff,
    update: isStaff,
    delete: isStaff,
  },
  fields: [
    {
      name: 'slug',
      type: 'text',
      required: true,
      unique: true,
      index: true,
      admin: { description: 'Lowercase letters, numbers and dashes, e.g. "soccer" or "soccer-register".' },
      validate: (value: unknown) =>
        typeof value === 'string' && /^[a-z0-9]+(-[a-z0-9]+)*$/.test(value)
          ? true
          : 'Use lowercase letters, numbers and single dashes only.',
    },
    {
      name: 'destinationType',
      type: 'select',
      required: true,
      defaultValue: 'EVENT',
      options: [
        { label: 'Event', value: 'EVENT' },
        { label: 'Page on this site', value: 'PATH' },
        { label: 'External URL', value: 'URL' },
      ],
    },
    {
      name: 'event',
      type: 'relationship',
      relationTo: 'events',
      admin: { condition: (data) => data?.destinationType === 'EVENT' },
    },
    {
      name: 'eventTarget',
      type: 'select',
      defaultValue: 'DETAILS',
      options: [
        { label: 'Event details page', value: 'DETAILS' },
        { label: 'Registration form for this event', value: 'REGISTER' },
      ],
      admin: { condition: (data) => data?.destinationType === 'EVENT' },
    },
    {
      name: 'path',
      type: 'text',
      admin: {
        description: 'Path on this site starting with "/", e.g. /aurix or /aurix/register',
        condition: (data) => data?.destinationType === 'PATH',
      },
    },
    {
      name: 'url',
      type: 'text',
      admin: {
        description: 'Full https:// address',
        condition: (data) => data?.destinationType === 'URL',
      },
    },
    { name: 'active', type: 'checkbox', defaultValue: true },
    { name: 'notes', type: 'textarea' },
    { name: 'clicks', type: 'number', defaultValue: 0, admin: { readOnly: true } },
  ],
}
