import path from 'node:path'
import type { Access, CollectionConfig } from 'payload'
import { MANAGER_ROLES, assignedEventIds, fieldRoles, hasRole, isManager, managersOnly } from '../access/roles'

const isSuperAdmin: Access = ({ req: { user } }) => Boolean(user && user.role === 'SUPER_ADMIN')

/** Managers, finance and verifiers see all registrations; coordinators only their assigned events. */
const readRegistrations: Access = ({ req: { user } }) => {
  if (hasRole(user, [...MANAGER_ROLES, 'FINANCE', 'VERIFIER'])) return true
  if (hasRole(user, ['COORDINATOR'])) {
    const ids = assignedEventIds(user)
    return ids.length ? { event: { in: ids } } : false
  }
  return false
}
const managersOnlyField = fieldRoles(MANAGER_ROLES)
const financeField = fieldRoles([...MANAGER_ROLES, 'FINANCE'])
const verifierField = fieldRoles([...MANAGER_ROLES, 'VERIFIER'])
const notesField = fieldRoles([...MANAGER_ROLES, 'FINANCE', 'VERIFIER'])

/**
 * Student ID cards uploaded with AURIX registrations. Stored in the private uploads volume
 * (never under public/) and readable by staff only. Created only by /api/aurix/register.
 */
export const IdDocuments: CollectionConfig = {
  slug: 'id-documents',
  admin: {
    group: 'AURIX Registrations',
    useAsTitle: 'memberName',
    hidden: ({ user }) => !hasRole(user, [...MANAGER_ROLES, 'VERIFIER']),
    defaultColumns: ['memberName', 'registrationCode', 'filename', 'createdAt'],
  },
  access: {
    // Only managers and the ID verification team can open student ID files
    read: ({ req: { user } }) => hasRole(user, [...MANAGER_ROLES, 'VERIFIER']),
    create: () => false,
    update: managersOnly,
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
    read: readRegistrations,
    create: () => false,
    // Finance and verifiers may save, but field access limits them to their own fields
    update: ({ req: { user } }) => hasRole(user, [...MANAGER_ROLES, 'FINANCE', 'VERIFIER']),
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
    { name: 'event', type: 'relationship', relationTo: 'events', required: true, access: { update: managersOnlyField } },
    { name: 'teamName', type: 'text', required: true, access: { update: managersOnlyField } },
    {
      type: 'row',
      fields: [
        { name: 'leaderName', type: 'text', required: true, access: { update: managersOnlyField } },
        { name: 'leaderEmail', type: 'email', required: true, index: true, access: { update: managersOnlyField } },
        { name: 'leaderPhone', type: 'text', required: true, index: true, access: { update: managersOnlyField } },
      ],
    },
    {
      name: 'college',
      type: 'text',
      required: true,
      access: { update: managersOnlyField },
      admin: { description: "Team leader's university / college (sent to the payment page)." },
    },
    {
      name: 'members',
      access: { update: managersOnlyField },
      type: 'array',
      required: true,
      minRows: 1,
      admin: { description: 'The first member is the team leader.' },
      fields: [
        { name: 'name', type: 'text', required: true },
        { name: 'email', type: 'text' },
        { name: 'phone', type: 'text' },
        { name: 'college', type: 'text', required: true, access: { update: managersOnlyField } },
        { name: 'idDocument', type: 'upload', relationTo: 'id-documents', required: true },
      ],
    },
    {
      name: 'amountDue',
      access: { update: managersOnlyField },
      type: 'number',
      admin: { description: 'Registration fee (INR) for the event at the time of registration.' },
    },
    {
      type: 'row',
      fields: [
        {
          name: 'status',
      access: { update: managersOnlyField },
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
      access: { update: financeField },
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
      access: { update: verifierField },
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
      access: { update: financeField },
      type: 'text',
      admin: { description: 'Razorpay payment ID from the daily export, once matched.' },
    },
    { name: 'verifiedAt', type: 'date', access: { update: financeField } },
    { name: 'adminNotes', type: 'textarea', access: { read: notesField, update: notesField } },
    {
      name: 'consent',
      access: { update: managersOnlyField },
      type: 'checkbox',
      required: true,
      admin: { readOnly: true, description: 'Team leader accepted the rules and ID-check notice.' },
    },
  ],
}
