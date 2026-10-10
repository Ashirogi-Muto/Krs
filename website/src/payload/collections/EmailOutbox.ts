import type { CollectionConfig } from 'payload'
import { adminsOnly, hiddenUnlessAny, keyAllowed, superAdminOnly } from '../access/roles'

/**
 * Outgoing emails (registration confirmations, ...). Rows are created by the app and sent by the background
 * worker in src/lib/email/outbox.ts: PENDING -> SENDING -> SENT, or back to PENDING with a delay after an error,
 * and FAILED after the last attempt. Set Status back to "Pending" to send a failed email again.
 */
export const EmailOutbox: CollectionConfig = {
  slug: 'email-outbox',
  labels: { singular: 'Email', plural: 'Email outbox' },
  admin: {
    group: 'AURIX',
    useAsTitle: 'subject',
    defaultColumns: ['reference', 'to', 'status', 'attempts', 'lastError', 'sentAt', 'createdAt'],
    listSearchableFields: ['to', 'subject', 'reference'],
    description: 'Emails sent by the site. A failed email can be sent again by setting Status to "Pending".',
    hidden: hiddenUnlessAny(['emailOutbox.view']),
  },
  access: {
    read: keyAllowed('emailOutbox.view'),
    create: () => false,
    update: adminsOnly,
    delete: superAdminOnly,
  },
  hooks: {
    beforeChange: [
      // Re-queueing by hand ("Pending" set by a signed-in admin) gets a fresh set of attempts.
      // The worker's own retries run without a user and must keep their attempt count and delay.
      ({ data, originalDoc, operation, req }) => {
        if (req.user && operation === 'update' && data?.status === 'PENDING' && originalDoc?.status !== 'PENDING') {
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
      options: [
        { label: 'Registration confirmation', value: 'REGISTRATION_CONFIRMATION' },
        { label: 'Account: confirm email', value: 'ACCOUNT_VERIFICATION' },
        { label: 'Account: password reset', value: 'PASSWORD_RESET' },
        { label: 'Student ID re-upload request', value: 'ID_REUPLOAD_REQUEST' },
        { label: 'Registration cancelled (no valid ID)', value: 'REGISTRATION_CANCELLED' },
      ],
      admin: { readOnly: true },
    },
    { name: 'registration', type: 'relationship', relationTo: 'event-registrations', admin: { readOnly: true } },
    { name: 'reference', type: 'text', index: true, admin: { readOnly: true, description: 'Registration code (used in logs instead of the address).' } },
    // One email per purpose and registration (e.g. REGISTRATION_CONFIRMATION:42): queueing twice is a no-op
    { name: 'dedupeKey', type: 'text', unique: true, index: true, admin: { readOnly: true, hidden: true } },
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
    { name: 'lastAttemptAt', type: 'date', admin: { position: 'sidebar', readOnly: true, date: { pickerAppearance: 'dayAndTime' } } },
    { name: 'sentAt', type: 'date', admin: { position: 'sidebar', readOnly: true, date: { pickerAppearance: 'dayAndTime' } } },
    { name: 'messageId', type: 'text', admin: { position: 'sidebar', readOnly: true } },
    { name: 'lastError', type: 'textarea', admin: { readOnly: true } },
    { name: 'html', type: 'textarea', required: true, admin: { readOnly: true, hidden: true } },
    { name: 'text', type: 'textarea', admin: { readOnly: true, description: 'Plain-text version of the email.' } },
  ],
}
