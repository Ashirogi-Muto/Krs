import path from 'node:path'
import type { Access, CollectionConfig } from 'payload'
import {
  REG_MANAGERS,
  REG_READ_ALL,
  SEE_CONTACTS,
  SEE_IDS,
  SEE_LEADER_PHONE,
  SEE_MONEY,
  SEE_NOTES,
  assignedEventIds,
  fieldRoles,
  hasRole,
  holds,
  limitedToAssignedEvents,
  managersOnly,
  superAdminOnly,
} from '../access/roles'

/** Most teams see every registration; technical-event members only their assigned events (see roles.ts). */
const readRegistrations: Access = ({ req: { user } }) => {
  if (hasRole(user, REG_READ_ALL) || (holds(user, 'TECH_EVENT') && !limitedToAssignedEvents(user))) return true
  if (holds(user, 'TECH_EVENT')) {
    const ids = assignedEventIds(user)
    return ids.length ? { event: { in: ids } } : false
  }
  return false
}
const canSeeRegistrations = (user: any) => hasRole(user, REG_READ_ALL) || holds(user, 'TECH_EVENT')

// Who may change which fields
const managersOnlyField = fieldRoles(REG_MANAGERS)
const registrationTeamField = fieldRoles([...REG_MANAGERS, 'REGISTRATION'])
const financeField = fieldRoles([...REG_MANAGERS, 'FINANCE'])
// Who may see the sensitive fields (everyone who can open a registration sees the rest)
const contactsRead = fieldRoles(SEE_CONTACTS)
const leaderPhoneRead = fieldRoles(SEE_LEADER_PHONE)
const idsRead = fieldRoles(SEE_IDS)
const moneyRead = fieldRoles(SEE_MONEY)
const notesAccess = fieldRoles(SEE_NOTES)

/**
 * Student ID cards uploaded with AURIX registrations. Stored in the private uploads volume
 * (never under public/) and readable by staff only. Created only by /api/aurix/register.
 */
export const IdDocuments: CollectionConfig = {
  slug: 'id-documents',
  admin: {
    group: 'AURIX Registrations',
    useAsTitle: 'memberName',
    hidden: ({ user }) => !hasRole(user, SEE_IDS),
    defaultColumns: ['memberName', 'registrationCode', 'filename', 'createdAt'],
  },
  access: {
    // Only registration managers and the registration team can open student ID files
    read: ({ req: { user } }) => hasRole(user, SEE_IDS),
    create: () => false,
    update: managersOnly,
    delete: superAdminOnly,
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
    defaultColumns: ['registrationCode', 'teamName', 'event', 'status', 'paymentStatus', 'idVerification', 'checkedIn', 'createdAt'],
    // Fields every team may read (searching a hidden field would fail for teams without access to it)
    listSearchableFields: ['registrationCode', 'teamName', 'leaderName'],
    hidden: ({ user }) => !canSeeRegistrations(user),
  },
  hooks: {
    // Deleting a registration (CMS, retention page, anywhere) also deletes its student ID files and its emails
    afterDelete: [
      async ({ doc, req }) => {
        const ids = ((doc as any)?.members || [])
          .map((m: any) => (m?.idDocument && typeof m.idDocument === 'object' ? m.idDocument.id : m?.idDocument))
          .filter(Boolean)
        const code = (doc as any)?.registrationCode
        const or: any[] = []
        if (ids.length) or.push({ id: { in: ids } })
        if (code) or.push({ registrationCode: { equals: code } })
        if (or.length) await req.payload.delete({ collection: 'id-documents', overrideAccess: true, req, where: { or } })
        // By code as well: the database has already unlinked the emails (registration set to null) at this point
        const mail: any[] = [{ registration: { equals: (doc as any).id } }]
        if (code) mail.push({ reference: { equals: code } }, { dedupeKey: { equals: `REGISTRATION_CONFIRMATION:${(doc as any).id}` } })
        await req.payload.delete({ collection: 'email-outbox', overrideAccess: true, req, where: { or: mail } })
      },
    ],
  },
  access: {
    read: readRegistrations,
    create: () => false,
    // Registration team and finance may save, but field access limits them to their own fields
    update: ({ req: { user } }) => hasRole(user, [...REG_MANAGERS, 'REGISTRATION', 'FINANCE']),
    delete: superAdminOnly,
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
        { name: 'leaderEmail', type: 'email', required: true, index: true, access: { read: contactsRead, update: managersOnlyField } },
        { name: 'leaderPhone', type: 'text', required: true, index: true, access: { read: leaderPhoneRead, update: managersOnlyField } },
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
        { name: 'email', type: 'text', access: { read: contactsRead } },
        { name: 'phone', type: 'text', access: { read: contactsRead } },
        { name: 'college', type: 'text', required: true, access: { update: managersOnlyField } },
        { name: 'idDocument', type: 'upload', relationTo: 'id-documents', required: true, access: { read: idsRead } },
      ],
    },
    {
      name: 'amountDue',
      access: { read: moneyRead, update: managersOnlyField },
      type: 'number',
      admin: { description: 'Registration fee (INR) for the event at the time of registration.' },
    },
    {
      type: 'row',
      fields: [
        {
          name: 'status',
          access: { update: registrationTeamField },
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
          access: { update: registrationTeamField },
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
      access: { read: moneyRead, update: financeField },
      type: 'text',
      admin: { description: 'Razorpay payment ID from the daily export, once matched.' },
    },
    { name: 'verifiedAt', type: 'date', access: { read: moneyRead, update: financeField } },
    { name: 'adminNotes', type: 'textarea', access: { read: notesAccess, update: notesAccess } },
    // Participant-portal accounts that claimed this registration (linked by /api/aurix/portal/claim after checks)
    {
      name: 'participants',
      type: 'relationship',
      relationTo: 'users',
      hasMany: true,
      access: { read: fieldRoles([...REG_MANAGERS, 'REGISTRATION']), create: managersOnlyField, update: managersOnlyField },
      admin: { position: 'sidebar', description: 'Portal accounts that claimed this registration.' },
    },
    // Confirmation email to the team leader (kept in sync by the email worker; details in Email outbox)
    {
      name: 'confirmationEmail',
      type: 'select',
      options: [
        { label: 'Queued', value: 'PENDING' },
        { label: 'Retrying', value: 'RETRYING' },
        { label: 'Sent', value: 'SENT' },
        { label: 'Failed', value: 'FAILED' },
      ],
      access: { update: managersOnlyField },
      admin: { position: 'sidebar', readOnly: true },
    },
    // Event-day arrival, set from the check-in desk (/checkin)
    {
      name: 'checkedIn',
      type: 'checkbox',
      defaultValue: false,
      access: { update: managersOnlyField },
      admin: { position: 'sidebar', readOnly: true, description: 'Set at the check-in desk: kalamroboticssociety.com/checkin' },
    },
    { name: 'checkedInAt', type: 'date', access: { update: managersOnlyField }, admin: { position: 'sidebar', readOnly: true, date: { pickerAppearance: 'dayAndTime' } } },
    { name: 'checkedInBy', type: 'text', access: { update: managersOnlyField }, admin: { position: 'sidebar', readOnly: true } },
    {
      name: 'consent',
      access: { update: managersOnlyField },
      type: 'checkbox',
      required: true,
      admin: { readOnly: true, description: 'Team leader accepted the rules and ID-check notice.' },
    },
  ],
}
