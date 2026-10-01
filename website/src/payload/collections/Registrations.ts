import path from 'node:path'
import type { Access, CollectionConfig } from 'payload'

const isStaff: Access = ({ req: { user } }) =>
  Boolean(user && (user.role === 'SUPER_ADMIN' || user.role === 'ADMIN' || user.role === 'ORGANIZER'))
const isSuperAdmin: Access = ({ req: { user } }) => Boolean(user && user.role === 'SUPER_ADMIN')

/**
 * Student ID cards uploaded with AURIX registrations. Stored in the private uploads volume
 * (never under public/) and readable by staff only. Created only by /api/aurix/register.
 */
export const IdDocuments: CollectionConfig = {
  slug: 'id-documents',
  admin: {
    group: 'AURIX Registrations',
    useAsTitle: 'memberName',
    defaultColumns: ['memberName', 'registrationCode', 'filename', 'createdAt'],
  },
  access: {
    read: isStaff,
    create: () => false,
    update: isStaff,
    delete: isSuperAdmin,
  },
  upload: {
    staticDir: path.resolve(process.cwd(), '.private_uploads/id-documents'),
    mimeTypes: ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'],
    disableLocalStorage: false,
  },
  fields: [
    { name: 'memberName', type: 'text', required: true },
    { name: 'registrationCode', type: 'text', index: true },
  ],
}

/**
 * Public AURIX team registrations (no participant account needed). Created only by
 * /api/aurix/register; organizers verify ID cards and payments here.
 */
export const EventRegistrations: CollectionConfig = {
  slug: 'event-registrations',
  admin: {
    group: 'AURIX Registrations',
    useAsTitle: 'teamName',
    defaultColumns: ['registrationCode', 'teamName', 'event', 'status', 'paymentStatus', 'idVerification', 'createdAt'],
    listSearchableFields: ['registrationCode', 'teamName', 'leaderEmail', 'leaderPhone'],
  },
  access: {
    read: isStaff,
    create: () => false,
    update: isStaff,
    delete: isSuperAdmin,
  },
  fields: [
    {
      name: 'registrationCode',
      type: 'text',
      required: true,
      unique: true,
      index: true,
      admin: { readOnly: true },
    },
    { name: 'event', type: 'relationship', relationTo: 'events', required: true },
    { name: 'teamName', type: 'text', required: true },
    {
      type: 'row',
      fields: [
        { name: 'leaderName', type: 'text', required: true },
        { name: 'leaderEmail', type: 'email', required: true, index: true },
        { name: 'leaderPhone', type: 'text', required: true, index: true },
      ],
    },
    { name: 'college', type: 'text', required: true },
    {
      name: 'members',
      type: 'array',
      required: true,
      minRows: 1,
      admin: { description: 'The first member is the team leader.' },
      fields: [
        { name: 'name', type: 'text', required: true },
        { name: 'email', type: 'text' },
        { name: 'phone', type: 'text' },
        { name: 'idDocument', type: 'upload', relationTo: 'id-documents', required: true },
      ],
    },
    {
      name: 'amountDue',
      type: 'number',
      admin: { description: 'Registration fee (INR) for the event at the time of registration.' },
    },
    {
      type: 'row',
      fields: [
        {
          name: 'status',
          type: 'select',
          defaultValue: 'PENDING',
          options: [
            { label: 'Pending verification', value: 'PENDING' },
            { label: 'Confirmed', value: 'CONFIRMED' },
            { label: 'Rejected', value: 'REJECTED' },
            { label: 'Cancelled', value: 'CANCELLED' },
          ],
        },
        {
          name: 'paymentStatus',
          type: 'select',
          defaultValue: 'AWAITING_PAYMENT',
          options: [
            { label: 'Awaiting payment', value: 'AWAITING_PAYMENT' },
            { label: 'Paid (verified)', value: 'PAID_VERIFIED' },
            { label: 'Payment not found', value: 'NOT_FOUND' },
            { label: 'Refunded', value: 'REFUNDED' },
          ],
        },
        {
          name: 'idVerification',
          type: 'select',
          defaultValue: 'PENDING',
          options: [
            { label: 'Pending', value: 'PENDING' },
            { label: 'Approved', value: 'APPROVED' },
            { label: 'Rejected', value: 'REJECTED' },
          ],
        },
      ],
    },
    {
      name: 'paymentReference',
      type: 'text',
      admin: { description: 'Razorpay payment ID from the daily export, once matched.' },
    },
    { name: 'verifiedAt', type: 'date' },
    { name: 'adminNotes', type: 'textarea' },
    {
      name: 'consent',
      type: 'checkbox',
      required: true,
      admin: { readOnly: true, description: 'Team leader accepted the rules and ID-check notice.' },
    },
  ],
}
