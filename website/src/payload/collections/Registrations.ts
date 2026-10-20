import path from 'node:path'
import { stat } from 'node:fs/promises'
import { requireRealFileType } from '../hooks/realFileType'
import { deletePendingR2 } from './RoundSubmissions'
import { logger } from '../../lib/logger'
import { YEAR_ADMIN_LABELS, YEAR_VALUES } from '../../lib/member-details'
import { MAX_FILE_BYTES } from '../../lib/id-files'
import { confirmsOnIdApproval, schoolEntryChange } from '../../lib/school-entry'

const ID_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf']
import { APIError, type Access, type CollectionConfig, type FieldAccess } from 'payload'
import { anyKeyAccess, eventFieldKey, hiddenUnlessAny, isAdmin, keyAccess } from '../access/roles'
import { canFor, eventIdOf, grantOf } from '../access/permissions'

/**
 * Access roles (permissions.ts): "View registrations" and every field group are granted per event (all events, the
 * account's assigned events, or chosen events). Field rules check the group for the registration's own event.
 */
const EDIT_KEYS = ['registrations.editStatus', 'registrations.editIdCheck', 'registrations.editPayment', 'registrations.editDetails', 'registrations.editCheckin', 'registrations.notes']
const details = eventFieldKey('registrations.editDetails')
const contactsRead = eventFieldKey('registrations.contacts')
// "See contacts" includes the leader phone
const leaderPhoneRead: FieldAccess = (args) => eventFieldKey('registrations.leaderPhone')(args) || contactsRead(args)
const idsRead = eventFieldKey('registrations.ids')
const moneyRead = eventFieldKey('registrations.money')
const notesAccess = eventFieldKey('registrations.notes')
const statusEdit = eventFieldKey('registrations.editStatus')
const idCheckEdit = eventFieldKey('registrations.editIdCheck')
const paymentEdit = eventFieldKey('registrations.editPayment')
const checkinEdit = eventFieldKey('registrations.editCheckin')

/** Student ID files: "See student IDs" for all events, or only the IDs of registrations in the role's events. */
const idDocumentsFor =
  (key: string): Access =>
  async ({ req }) => {
    const g = grantOf(req.user as any, key)
    if (!g) return false
    if (g.all) return true
    const { docs } = await req.payload.find({
      collection: 'event-registrations',
      overrideAccess: true,
      depth: 0,
      pagination: false,
      where: { event: { in: [...g.ids].map(Number) } },
      select: { registrationCode: true },
    })
    const codes = (docs as any[]).map((d) => d.registrationCode).filter(Boolean)
    return { registrationCode: { in: codes.length ? codes : ['-'] } }
  }

/**
 * Student ID cards uploaded with AURIX registrations. Stored in the private uploads volume
 * (never under public/) and readable by staff only. Created only by /api/aurix/register.
 */
export const IdDocuments: CollectionConfig = {
  slug: 'id-documents',
  labels: { singular: 'ID document', plural: 'ID documents' },
  admin: {
    group: 'AURIX',
    useAsTitle: 'memberName',
    description: 'Student ID cards uploaded with team registrations. Private: only the registration team and managers can open them.',
    hidden: hiddenUnlessAny(['registrations.ids']),
    defaultColumns: ['memberName', 'registrationCode', 'filename', 'createdAt'],
    listSearchableFields: ['memberName', 'registrationCode'],
  },
  access: {
    // "See student IDs" opens the files; "Replace ID files" edits them (both per event)
    read: idDocumentsFor('registrations.ids'),
    create: () => false,
    update: async (args) => {
      const own = await idDocumentsFor('idDocuments.edit')(args)
      return own === false ? false : own
    },
    delete: idDocumentsFor('idDocuments.delete'),
  },
  upload: {
    staticDir: path.resolve(process.cwd(), '.private_uploads/id-documents'),
    mimeTypes: ID_TYPES,
    disableLocalStorage: false,
    // Student ID cards: never kept in browser or Cloudflare caches (Payload sends no Cache-Control of its own)
    modifyResponseHeaders: ({ headers }) => {
      headers.set('Cache-Control', 'private, no-store, max-age=0')
      return headers
    },
  },
  // A file replaced in the CMS must really be an image/PDF (the registration API checks its uploads the same way)
  hooks: {
    beforeValidate: [
      // ID cards stay at 2 MB when staff replace one in the CMS (the site-wide cap is 10 MB for website photos)
      async ({ req, data }) => {
        const file = (req as any).file as { size?: number; data?: Buffer; tempFilePath?: string; name?: string } | undefined
        const size = !file ? 0 : Number(file.size) || file.data?.length || (file.tempFilePath ? (await stat(file.tempFilePath)).size : 0)
        if (file && size > MAX_FILE_BYTES) {
          const { getFormTexts } = await import('../../lib/form-texts')
          const { fill } = await import('../../lib/form-texts-defaults')
          throw new APIError(fill((await getFormTexts()).messages.regIdTooBig, { name: String(file.name || '') }), 413, undefined, true)
        }
        return data
      },
      requireRealFileType(ID_TYPES),
    ],
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
  // Field rules are per event (access roles): the event is always loaded, even when a request selects fewer fields
  forceSelect: { event: true },
  labels: { singular: 'Event registration', plural: 'Event registrations' },
  admin: {
    group: 'AURIX',
    useAsTitle: 'teamName',
    description:
      'Teams registered through /aurix/register. Check the ID cards and payment, then set Status. Check-in on event day: /checkin. Payment matching: Registrations → Payment matching.',
    defaultColumns: ['registrationCode', 'teamName', 'event', 'status', 'paymentStatus', 'schoolEntry', 'entryOption', 'receiptUploadedAt', 'idVerification', 'checkedIn', 'createdAt'],
    // Fields every team may read (searching a hidden field would fail for teams without access to it)
    // Only fields every registration reader may see (emails/phones are limited by role, so not searchable here)
    listSearchableFields: ['registrationCode', 'teamName', 'leaderName', 'college'],
    hidden: hiddenUnlessAny(['registrations.view']),
  },
  hooks: {
    // ID re-upload bookkeeping: rejecting again allows a new request email; leaving "Rejected" stops the auto-cancel
    beforeChange: [
      ({ data, originalDoc, operation }) => {
        if (operation !== 'update' || !data || !('idVerification' in data)) return data
        const before = (originalDoc as any)?.idVerification
        if (data.idVerification === 'REJECTED' && before !== 'REJECTED') {
          data.idReuploadRequestedAt = null
          data.idReuploadDeadline = null
        } else if (data.idVerification !== 'REJECTED' && before === 'REJECTED') {
          data.idReuploadDeadline = null
        }
        return data
      },
      async ({ data, originalDoc, operation, req }) => {
        // School entry (owner, 18 Oct 2026; lib/school-entry.ts): ticking makes the team free, unticking makes the
        // competition's normal fee due again (e.g. after a failed school ID check)
        if (operation !== 'update' || !data || !('schoolEntry' in data)) return data
        const eventId = eventIdOf(data) || eventIdOf(originalDoc)
        const ev: any = eventId ? await req.payload.findByID({ collection: 'events', id: eventId, depth: 0, overrideAccess: true, req }).catch(() => null) : null
        const patch = schoolEntryChange(originalDoc || {}, data, ev?.registrationFee ?? null)
        return patch ? { ...data, ...patch } : data
      },
      ({ data, originalDoc, operation, req }) => {
        // Moving a team to another event: "Edit team details" must cover the new event as well (limited roles)
        if (operation === 'update' && data && 'event' in data && req.user && !isAdmin(req.user as any)) {
          const to = eventIdOf(data)
          if (to && to !== eventIdOf(originalDoc) && !canFor(req.user as any, 'registrations.editDetails', to)) throw new APIError('Not allowed for that event.', 403)
        }
        return data
      },
    ],
    // A cancelled team loses its round submissions (owner, 9 Oct 2026): staff cancelling in the CMS (also bulk edits)
    // and the ID re-upload auto-cancel both land here. Rows go in the same transaction; their R2 files are collected
    // and deleted once the rows are gone. Restoring the team later does not bring the files back.
    afterChange: [
      async ({ doc, previousDoc, operation, req }) => {
        // School entry: staff approve the leader's school ID → the free team is confirmed (nothing else to wait for)
        if (operation !== 'update' || req.context.schoolAutoConfirm || !confirmsOnIdApproval(previousDoc || {}, doc || {})) return doc
        req.context.schoolAutoConfirm = true
        const updated = await req.payload.update({ collection: 'event-registrations', id: (doc as any).id, data: { status: 'CONFIRMED' } as any, overrideAccess: true, req, context: { schoolAutoConfirm: true } })
        logger.audit(String((req.user as any)?.email || 'system'), 'SCHOOL_ENTRY_CONFIRMED', 'EventRegistration', String((doc as any).registrationCode), { by: 'idVerification approved' })
        return updated
      },
      async ({ doc, previousDoc, operation, req }) => {
        if (operation !== 'update' || (doc as any)?.status !== 'CANCELLED' || (previousDoc as any)?.status === 'CANCELLED') return doc
        if (!Array.isArray(req.context.pendingR2Deletes)) req.context.pendingR2Deletes = []
        const { docs } = await req.payload.delete({ collection: 'round-submissions', overrideAccess: true, req, where: { registration: { equals: (doc as any).id } } })
        await deletePendingR2(req)
        if (docs.length) logger.audit(String((req.user as any)?.email || 'system'), 'SUBMISSIONS_DELETED_ON_CANCEL', 'EventRegistration', String((doc as any).registrationCode), { submissions: docs.length })
        return doc
      },
    ],
    // Round submissions must go first (their registration link is required, so the database cannot unlink them). Same
    // transaction; their R2 files are only collected here and deleted after the registration delete succeeded.
    beforeDelete: [
      async ({ id, req }) => {
        // Bulk deletes run documents concurrently with one shared context: append, never reset
        if (!Array.isArray(req.context.pendingR2Deletes)) req.context.pendingR2Deletes = []
        await req.payload.delete({ collection: 'round-submissions', overrideAccess: true, req, where: { registration: { equals: id } } })
        // Judge scores and judging decisions of the team (20 Oct 2026): same reason (required link)
        await req.payload.delete({ collection: 'judge-scores' as any, overrideAccess: true, req, where: { registration: { equals: id } } })
        await req.payload.delete({ collection: 'judging-decisions' as any, overrideAccess: true, req, where: { registration: { equals: id } } })
      },
    ],
    // Deleting a registration (CMS, retention page, anywhere) also deletes its submission files, student ID files and emails
    afterDelete: [
      async ({ doc, req }) => {
        // The team's payment receipt file goes too (bulk deletes share one list: append)
        const receipt = (doc as any)?.receiptKey
        if (receipt) {
          if (!Array.isArray(req.context.pendingR2Deletes)) req.context.pendingR2Deletes = []
          ;(req.context.pendingR2Deletes as string[]).push(receipt)
        }
        await deletePendingR2(req)
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
    read: keyAccess('registrations.view', 'event'),
    create: () => false,
    // Anyone holding an edit permission may save (for their events); each field checks its own permission
    update: anyKeyAccess(EDIT_KEYS, 'event'),
    delete: keyAccess('registrations.delete', 'event'),
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
    { name: 'event', type: 'relationship', relationTo: 'events', required: true, access: { update: details } },
    { name: 'teamName', type: 'text', required: true, access: { update: details } },
    {
      type: 'row',
      fields: [
        { name: 'leaderName', type: 'text', required: true, access: { update: details } },
        { name: 'leaderEmail', type: 'email', required: true, index: true, access: { read: contactsRead, update: details } },
        { name: 'leaderPhone', type: 'text', required: true, index: true, access: { read: leaderPhoneRead, update: details } },
      ],
    },
    {
      name: 'college',
      type: 'text',
      required: true,
      access: { update: details },
      admin: { description: "Team leader's university / college (sent to the payment page)." },
    },
    {
      name: 'members',
      access: { update: details },
      type: 'array',
      required: true,
      minRows: 1,
      admin: { description: 'The first member is the team leader.' },
      fields: [
        { name: 'name', type: 'text', required: true },
        { name: 'email', type: 'text', access: { read: contactsRead } },
        { name: 'phone', type: 'text', access: { read: contactsRead } },
        { name: 'college', type: 'text', required: true, access: { update: details } },
        // Optional (owner, 11 Oct 2026): school students too
        {
          type: 'row',
          fields: [
            { name: 'branch', label: 'Branch / stream', type: 'text', access: { update: details } },
            { name: 'year', label: 'Year / class', type: 'select', access: { update: details }, options: YEAR_VALUES.map((v) => ({ value: v, label: YEAR_ADMIN_LABELS[v] })) },
          ],
        },
        {
          // Owner, 13 Oct 2026: answers to the competition's extra questions (e.g. BGMI: in-game name, player ID)
          name: 'answers',
          label: 'Answers to the competition\'s questions',
          type: 'array',
          access: { update: details },
          admin: { condition: (_: any, sibling: any) => Array.isArray(sibling?.answers) && sibling.answers.length > 0 },
          fields: [
            {
              type: 'row',
              fields: [
                { name: 'question', type: 'text', admin: { readOnly: true } },
                { name: 'answer', type: 'text', maxLength: 200 },
              ],
            },
          ],
        },
        // Required for the team leader only since 8 Oct 2026 (enforced by the registration form/API)
        {
          name: 'idDocument',
          type: 'upload',
          relationTo: 'id-documents',
          access: { read: idsRead },
          admin: { description: "Student ID card. Required for the team leader; optional for other members (since 8 Oct 2026)." },
        },
      ],
    },
    {
      name: 'amountDue',
      access: { read: moneyRead, update: details },
      type: 'number',
      admin: { description: 'What the team pays (INR): the registration fee, minus a coupon discount if one was applied.' },
    },
    {
      // Owner, 13 Oct 2026: coupon applied on the checkout step (/aurix/pay/<code>); written only by that step
      type: 'collapsible',
      label: 'Coupon',
      admin: { initCollapsed: true, condition: (d: any) => Boolean(d?.couponCode) },
      fields: [
        {
          type: 'row',
          fields: [
            { name: 'couponCode', label: 'Coupon code', type: 'text', access: { read: moneyRead, create: () => false, update: () => false }, admin: { readOnly: true } },
            { name: 'originalFee', label: 'Fee before the coupon (₹)', type: 'number', access: { read: moneyRead, create: () => false, update: () => false }, admin: { readOnly: true } },
            { name: 'discountAmount', label: 'Discount (₹)', type: 'number', access: { read: moneyRead, create: () => false, update: () => false }, admin: { readOnly: true } },
            { name: 'couponAppliedAt', label: 'Applied at', type: 'date', access: { read: moneyRead, create: () => false, update: () => false }, admin: { readOnly: true, date: { pickerAppearance: 'dayAndTime' } } },
          ],
        },
        {
          name: 'coupon',
          type: 'relationship',
          relationTo: 'coupons',
          access: { read: moneyRead, create: () => false, update: () => false },
          admin: { readOnly: true, description: 'Empty while the code is shown above = the coupon was deleted later (the team keeps its discount).' },
        },
      ],
    },
    {
      type: 'row',
      fields: [
        {
          name: 'status',
          access: { update: statusEdit },
          type: 'select',
          defaultValue: 'PENDING',
          admin: { description: 'Cancelled also deletes the team\'s round submissions and their files (cannot be undone).' },
          options: [
            { label: 'Pending verification', value: 'PENDING' },
            { label: 'Confirmed', value: 'CONFIRMED' },
            { label: 'Rejected', value: 'REJECTED' },
            { label: 'Cancelled', value: 'CANCELLED' },
          ],
        },
        {
          name: 'paymentStatus',
          access: { update: paymentEdit },
          type: 'select',
          defaultValue: 'AWAITING_PAYMENT',
          options: [
            { label: 'Awaiting payment', value: 'AWAITING_PAYMENT' },
            { label: 'Paid (verified)', value: 'PAID_VERIFIED' },
            { label: 'Free (school entry)', value: 'NOT_REQUIRED' },
            { label: 'Payment not found', value: 'NOT_FOUND' },
            { label: 'Refunded', value: 'REFUNDED' },
          ],
        },
        {
          name: 'idVerification',
          access: { update: idCheckEdit },
          type: 'select',
          defaultValue: 'PENDING',
          options: [
            { label: 'Pending', value: 'PENDING' },
            { label: 'Approved', value: 'APPROVED' },
            { label: 'Rejected', value: 'REJECTED' },
          ],
        },
        {
          // Owner, 18 Oct 2026 (lib/entry-options.ts): the entry option the team registered with (e.g. Solo, Squad)
          name: 'entryOption',
          label: 'Entry option',
          type: 'text',
          access: { update: () => false },
          admin: { readOnly: true, description: 'Set by the registration form (e.g. Solo or Squad). Its fee and coupon rule come from the competition.' },
        },
        {
          // Owner, 18 Oct 2026 (lib/school-entry.ts): the team leader is a school student → free registration
          name: 'schoolEntry',
          label: 'School entry (free)',
          type: 'checkbox',
          defaultValue: false,
          access: { update: paymentEdit },
          admin: {
            description:
              'Ticked by the registration form when the team leader is a school student (Class 5–12): nothing to pay. Approving the ID check confirms the team. Untick (e.g. after a failed school ID check) to make the normal fee due again.',
          },
        },
      ],
    },
    // ID re-upload (owner, 8 Oct 2026): staff mark "Rejected" + a reason, then send the request from
    // Registrations → ID re-upload; the leader uploads new cards at /aurix/update-id before the deadline, or the
    // registration is cancelled automatically (lib/id-reupload.ts).
    {
      name: 'idRejectReason',
      label: 'ID: why rejected',
      type: 'textarea',
      access: { read: idsRead, update: idCheckEdit },
      admin: {
        condition: (data: any) => data?.idVerification === 'REJECTED',
        description: 'Shown to the team in the email and on the upload page, e.g. "Member 2 uploaded a fee receipt, not an ID card".',
      },
    },
    {
      type: 'row',
      admin: { condition: (data: any) => Boolean(data?.idReuploadRequestedAt || data?.idReuploadedAt) },
      fields: [
        { name: 'idReuploadRequestedAt', label: 'ID re-upload: email sent', type: 'date', access: { read: idsRead, update: () => false }, admin: { readOnly: true, date: { pickerAppearance: 'dayAndTime' } } },
        { name: 'idReuploadDeadline', label: 'ID re-upload: deadline (auto-cancel after)', type: 'date', access: { read: idsRead, update: () => false }, admin: { readOnly: true, date: { pickerAppearance: 'dayAndTime' } } },
        { name: 'idReuploadedAt', label: 'ID re-upload: new cards uploaded', type: 'date', access: { read: idsRead, update: () => false }, admin: { readOnly: true, date: { pickerAppearance: 'dayAndTime' } } },
      ],
    },
    {
      name: 'paymentReference',
      access: { read: moneyRead, update: paymentEdit },
      type: 'text',
      // One Razorpay payment pays for one team: the database refuses the same payment ID on two registrations.
      // A cleared field is stored as NULL (many NULLs are allowed by the unique index, many '' would not be);
      // anything that is not a string (e.g. the stored value Payload passes for an update without this field) is kept.
      unique: true,
      hooks: { beforeValidate: [({ value }) => (typeof value === 'string' ? value.trim() || null : value)] },
      admin: { description: 'Razorpay payment ID from the daily export, once matched.' },
    },
    { name: 'verifiedAt', type: 'date', access: { read: moneyRead, update: paymentEdit } },
    // Payment receipt uploaded by the team leader at /aurix/payment-done (owner, 10 Oct 2026): required for teams whose
    // payment is not verified yet, but only secondary evidence; it never marks the team paid. Written by the upload
    // API (local API) only; the file lives in the private R2 bucket and opens through a 5-minute signed link.
    {
      type: 'collapsible',
      label: 'Payment receipt (from the team)',
      admin: { initCollapsed: false },
      fields: [
        { name: 'receiptDownload', type: 'ui', admin: { components: { Field: '@/payload/components/ReceiptDownload#ReceiptDownload' } } },
        {
          type: 'row',
          fields: [
            { name: 'receiptUploadedAt', label: 'Receipt uploaded', type: 'date', access: { read: moneyRead, update: () => false }, admin: { readOnly: true, date: { pickerAppearance: 'dayAndTime' } } },
            { name: 'receiptPaymentId', label: 'Payment ID given by the team (unverified)', type: 'text', access: { read: moneyRead, update: () => false }, admin: { readOnly: true } },
          ],
        },
        {
          type: 'row',
          fields: [
            { name: 'receiptFilename', label: 'Receipt file', type: 'text', access: { read: moneyRead, update: () => false }, admin: { readOnly: true } },
            { name: 'receiptSize', label: 'Size (bytes)', type: 'number', access: { read: moneyRead, update: () => false }, admin: { readOnly: true } },
            { name: 'receiptType', label: 'Type', type: 'text', access: { read: moneyRead, update: () => false }, admin: { readOnly: true } },
          ],
        },
        { name: 'receiptKey', label: 'Storage key', type: 'text', access: { read: moneyRead, update: () => false }, admin: { readOnly: true } },
      ],
    },
    { name: 'adminNotes', type: 'textarea', access: { read: notesAccess, update: notesAccess } },
    // Participant-portal accounts that claimed this registration (linked by /api/aurix/portal/claim after checks)
    {
      name: 'participants',
      type: 'relationship',
      relationTo: 'users',
      hasMany: true,
      access: { read: eventFieldKey('registrations.portalAccounts'), create: details, update: details },
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
      access: { update: details },
      admin: { position: 'sidebar', readOnly: true },
    },
    // Event-day arrival, set from the check-in desk (/checkin)
    {
      name: 'checkedIn',
      type: 'checkbox',
      defaultValue: false,
      access: { update: checkinEdit },
      admin: { position: 'sidebar', readOnly: true, description: 'Set at the check-in desk: kalamroboticssociety.com/checkin' },
    },
    { name: 'checkedInAt', type: 'date', access: { update: checkinEdit }, admin: { position: 'sidebar', readOnly: true, date: { pickerAppearance: 'dayAndTime' } } },
    { name: 'checkedInBy', type: 'text', access: { update: checkinEdit }, admin: { position: 'sidebar', readOnly: true } },
    {
      name: 'consent',
      access: { update: details },
      type: 'checkbox',
      required: true,
      admin: { readOnly: true, description: 'Team leader accepted the rules and ID-check notice.' },
    },
  ],
}
