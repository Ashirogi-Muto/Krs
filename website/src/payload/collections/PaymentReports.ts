import type { CollectionConfig } from 'payload'
import { adminsOnly } from '../access/roles'
import { REPORT_TYPES } from '../../lib/payments/report-file'
import { REPORTS_DIR } from '../../lib/payments/reports'

/**
 * Razorpay payment reports uploaded on CMS → Registrations → Payment matching (owner, 9 Oct 2026). Stored in the
 * private uploads volume next to the student IDs (never under public/); the newest KEEP_REPORTS are kept and older
 * ones deleted with their files (lib/payments/reports.ts). The previous report tells staff which rows are new.
 * Only the payment-matching screen creates them; reading them back goes through its own permission check
 * (/api/admin/payment-matching/reports/<id>), so the collection itself is admins-only and hidden from the sidebar.
 */
export const PaymentReports: CollectionConfig = {
  slug: 'payment-reports',
  labels: { singular: 'Payment report', plural: 'Payment reports' },
  admin: {
    hidden: true,
    useAsTitle: 'originalName',
    description: 'Razorpay reports uploaded on Registrations → Payment matching (the newest 3 are kept).',
  },
  access: {
    read: adminsOnly,
    create: () => false,
    update: () => false,
    delete: adminsOnly,
  },
  upload: {
    staticDir: REPORTS_DIR,
    mimeTypes: Object.values(REPORT_TYPES),
    disableLocalStorage: false,
    // Payer names, emails and phones: never kept in browser or Cloudflare caches
    modifyResponseHeaders: ({ headers }) => {
      headers.set('Cache-Control', 'private, no-store, max-age=0')
      return headers
    },
  },
  fields: [
    { name: 'originalName', type: 'text', admin: { readOnly: true } },
    { name: 'uploadedBy', type: 'text', admin: { readOnly: true } },
    { name: 'rowCount', type: 'number', admin: { readOnly: true } },
    // Payment IDs in this report (from its payment-ID column): the next upload marks rows already seen here
    { name: 'paymentIds', type: 'json', admin: { readOnly: true } },
  ],
}
