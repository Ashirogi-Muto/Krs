import type { CollectionConfig } from 'payload'
import { REG_MANAGERS, adminsOnly, hasRole, superAdminOnly } from '../access/roles'

/**
 * Outgoing emails (registration confirmations, ...). Rows are created by the app and sent by the background
 * worker in src/lib/email/outbox.ts: PENDING -> SENDING -> SENT, or back to PENDING with a delay after an error,
 * and FAILED after the last attempt. Set Status back to "Pending" to send a failed email again.
 */
export const EmailOutbox: CollectionConfig = {
  slug: 'email-outbox',
  labels: { singular: 'Email', plural: 'Email outbox' },
  admin: {
    group: 'AURIX Registrations',
    useAsTitle: 'subject',
    defaultColumns: ['to', 'subject', 'status', 'attempts', 'sentAt', 'createdAt'],
    listSearchableFields: ['to', 'subject'],
    description: 'Emails sent by the site. A failed email can be sent again by setting Status to "Pending".',
    hidden: ({ user }) => !hasRole(user, REG_MANAGERS),
  },
  access: {
    read: ({ req: { user } }) => hasRole(user, REG_MANAGERS),
    create: () => false,
    update: adminsOnly,
    delete: superAdminOnly,
  },
  hooks: {
    beforeChange: [
      // Re-queueing by hand ("Pending") gets a fresh set of attempts
      ({ data, originalDoc, operation }) => {
        if (operation === 'update' && data?.status === 'PENDING' && originalDoc?.status !== 'PENDING') {
          return { ...data, attempts: 0, nextAttemptAt: null, lastError: null }
        }
        return data
      },
    ],
  },
  fields: [
    { name: 'to', type: 'email', required: true, index: true, admin: { readOnly: true } },
    { name: 'subject', type: 'text', required: true, admin: { readOnly: true } },
    {
      name: 'kind',
      type: 'select',
      required: true,
      options: [{ label: 'Registration confirmation', value: 'REGISTRATION_CONFIRMATION' }],
      admin: { readOnly: true },
    },
    { name: 'registration', type: 'relationship', relationTo: 'event-registrations', admin: { readOnly: true } },
    {
      name: 'status',
      type: 'select',
      required: true,
      defaultValue: 'PENDING',
      index: true,
      options: [
        { label: 'Pending', value: 'PENDING' },
        { label: 'Sending', value: 'SENDING' },
        { label: 'Sent', value: 'SENT' },
        { label: 'Failed', value: 'FAILED' },
      ],
      admin: { position: 'sidebar' },
    },
    { name: 'attempts', type: 'number', defaultValue: 0, admin: { position: 'sidebar', readOnly: true } },
    { name: 'nextAttemptAt', type: 'date', index: true, admin: { position: 'sidebar', readOnly: true, date: { pickerAppearance: 'dayAndTime' } } },
    { name: 'sentAt', type: 'date', admin: { position: 'sidebar', readOnly: true, date: { pickerAppearance: 'dayAndTime' } } },
    { name: 'messageId', type: 'text', admin: { position: 'sidebar', readOnly: true } },
    { name: 'lastError', type: 'textarea', admin: { readOnly: true } },
    { name: 'html', type: 'textarea', required: true, admin: { readOnly: true, hidden: true } },
    { name: 'text', type: 'textarea', admin: { readOnly: true, description: 'Plain-text version of the email.' } },
  ],
}
