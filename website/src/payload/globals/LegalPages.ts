import type { Field, GlobalConfig } from 'payload'
import { previewUrl } from '../../lib/preview-targets'
import { hiddenUnlessAny, keyAllowed } from '../access/roles'
import { LEGAL_SEO } from '../../lib/data/seed-legal'
import { builtInTextField } from '../fields/textGroups'

/** One legal page: title, "last updated" line and numbered sections (blank line = new paragraph, "- " = bullet). */
const page = (name: 'privacy' | 'terms', label: string): Field => ({
  name,
  type: 'group',
  label,
  fields: [
    { name: 'title', type: 'text', required: true },
    { name: 'lastUpdated', type: 'text', admin: { description: 'Shown under the title, e.g. "2 October 2026 // Version 1.1".' } },
    {
      type: 'row',
      fields: [
        { ...builtInTextField('seoTitle', 'Browser-tab / search title', LEGAL_SEO[name].seoTitle), admin: { description: 'Cleared = the built-in title.' } } as Field,
        {
          ...builtInTextField('seoDescription', 'Search description', LEGAL_SEO[name].seoDescription),
          type: 'textarea',
          maxLength: 300,
          admin: { description: 'Cleared = the built-in description.' },
        } as Field,
      ],
    },
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
  admin: {
    livePreview: { url: () => previewUrl({ global: 'legal-pages' }) }, // side panel with a sample page; refreshes on Save
    group: 'Website',
    hidden: hiddenUnlessAny(['globals.legalPages']),
    description: 'The /privacy and /terms pages. A blank line starts a new paragraph; lines starting with "- " become a bullet list.',
  },
  access: { read: () => true, update: keyAllowed('globals.legalPages') },
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
