import type { Field, GlobalConfig } from 'payload'
import { CONTENT_EDITORS, hasRole, hiddenUnless } from '../access/roles'

/** One legal page: title, "last updated" line and numbered sections (blank line = new paragraph, "- " = bullet). */
const page = (name: 'privacy' | 'terms', label: string): Field => ({
  name,
  type: 'group',
  label,
  fields: [
    { name: 'title', type: 'text', required: true },
    { name: 'lastUpdated', type: 'text', admin: { description: 'Shown under the title, e.g. "2 October 2026 // Version 1.1".' } },
    {
      name: 'sections',
      type: 'array',
      labels: { singular: 'Section', plural: 'Sections' },
      fields: [
        { name: 'heading', type: 'text', required: true },
        {
          name: 'body',
          type: 'textarea',
          required: true,
          admin: { rows: 6, description: 'Leave a blank line between paragraphs. Start a line with "- " for a bullet point.' },
        },
      ],
    },
  ],
})

/** Privacy policy (/privacy) and Terms (/terms), edited by admins and Media & outreach. */
export const LegalPages: GlobalConfig = {
  slug: 'legal-pages',
  label: 'Privacy & terms',
  admin: { group: 'Website', hidden: hiddenUnless(CONTENT_EDITORS) },
  access: { read: () => true, update: ({ req: { user } }) => hasRole(user, CONTENT_EDITORS) },
  fields: [
    {
      type: 'tabs',
      tabs: [
        { label: 'Privacy policy', fields: [page('privacy', 'Privacy policy')] },
        { label: 'Terms', fields: [page('terms', 'Terms')] },
      ],
    },
  ],
}
