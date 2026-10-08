import type { CollectionConfig } from 'payload'
import { isAdmin, isManager } from '../access/roles'
import { logger } from '../../lib/logger'

/** Judges and registration managers (President, Event Head) read submissions; managers set the review status. */
const reviewers = ({ req: { user } }: any) => Boolean(user && (isManager(user) || user.role === 'JUDGE'))
const managers = ({ req: { user } }: any) => Boolean(user && isManager(user))
const ro = { readOnly: true }

/**
 * Round submissions (owner, 8 Oct 2026): one per team and round (e.g. Hackathon Round 1 PPT). Teams submit in the
 * participant portal (/aurix/portal/submissions); the file is stored in the private Cloudflare R2 bucket and opened here
 * through a short-lived download link. Created only by the portal API (lib/submissions.ts).
 */
export const RoundSubmissions: CollectionConfig = {
  slug: 'round-submissions',
  labels: { singular: 'Submission', plural: 'Submissions' },
  admin: {
    group: 'AURIX',
    useAsTitle: 'projectTitle',
    defaultColumns: ['projectTitle', 'teamName', 'registrationCode', 'roundNumber', 'status', 'submittedAt'],
    listSearchableFields: ['projectTitle', 'teamName', 'registrationCode'],
    description:
      'What teams submitted for each round (e.g. the Hackathon Round 1 PPT). Open one to download the file; set "Review status" to Qualified to let the team into the next round.',
    hidden: ({ user }) => !(user && (isManager(user as any) || (user as any).role === 'JUDGE')),
  },
  access: { read: reviewers, create: () => false, update: managers, delete: managers },
  indexes: [{ fields: ['registration', 'roundNumber'], unique: true }],
  hooks: {
    // The stored file goes with the record (CMS delete, registration delete, data retention)
    afterDelete: [
      async ({ doc }) => {
        const key = (doc as any)?.file?.key
        if (!key) return
        const { deleteObject, isR2Configured } = await import('../../lib/r2')
        if (!isR2Configured()) return logger.warn(`Submission file not deleted (R2 not configured): ${key}`)
        await deleteObject(key).catch((err) => logger.error(`Submission file delete failed (${key}): ${err?.message || err}`))
      },
    ],
  },
  fields: [
    {
      type: 'row',
      fields: [
        { name: 'registrationCode', type: 'text', index: true, admin: ro },
        { name: 'teamName', type: 'text', admin: ro },
        { name: 'roundNumber', type: 'number', required: true, admin: ro },
      ],
    },
    { name: 'download', type: 'ui', admin: { components: { Field: '@/payload/components/SubmissionDownload#SubmissionDownload' } } },
    {
      type: 'row',
      fields: [
        {
          name: 'status',
          label: 'Review status',
          type: 'select',
          defaultValue: 'SUBMITTED',
          options: [
            { label: 'Submitted', value: 'SUBMITTED' },
            { label: 'Under review', value: 'UNDER_REVIEW' },
            { label: 'Qualified (next round)', value: 'QUALIFIED' },
            { label: 'Not qualified', value: 'NOT_QUALIFIED' },
          ],
        },
        { name: 'submittedAt', type: 'date', admin: { ...ro, date: { pickerAppearance: 'dayAndTime' } } },
      ],
    },
    { name: 'projectTitle', type: 'text', admin: ro },
    { name: 'track', type: 'text', admin: ro },
    { name: 'repositoryUrl', label: 'Repository link', type: 'text', admin: ro },
    { name: 'demoUrl', label: 'Demo link', type: 'text', admin: ro },
    {
      name: 'file',
      type: 'group',
      admin: { ...ro, condition: (data: any) => Boolean(data?.file?.key) },
      fields: [
        { type: 'row', fields: [{ name: 'filename', type: 'text', admin: ro }, { name: 'size', label: 'Size (bytes)', type: 'number', admin: ro }, { name: 'contentType', type: 'text', admin: ro }] },
        { name: 'key', type: 'text', admin: { hidden: true } },
      ],
    },
    { name: 'reviewNotes', label: 'Review notes (staff only)', type: 'textarea' },
    { name: 'registration', type: 'relationship', relationTo: 'event-registrations', required: true, admin: { ...ro, position: 'sidebar' } },
    { name: 'event', type: 'relationship', relationTo: 'events', required: true, admin: { ...ro, position: 'sidebar' } },
    { name: 'submittedBy', type: 'relationship', relationTo: 'users', admin: { ...ro, position: 'sidebar' }, access: { read: ({ req: { user } }) => isAdmin(user as any) } },
  ],
}
