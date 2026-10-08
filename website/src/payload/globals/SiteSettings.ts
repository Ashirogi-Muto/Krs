import type { GlobalConfig } from 'payload'
import { previewUrl } from '../../lib/preview-targets'
import { hiddenUnlessAny, isAdmin, keyAllowed } from '../access/roles'
import { can } from '../access/permissions'
import { HIDEABLE_PAGES, isHideablePath } from '../../lib/visibility'
import { safeHref } from '../fields/common'

/**
 * Site-wide settings: society details shown on the KRS pages and footers, social links, and which pages are hidden
 * (edited on the Page visibility screen). Media & outreach edit the texts; only admins can hide or publish pages.
 */
export const SiteSettings: GlobalConfig = {
  slug: 'site-settings',
  label: 'Site settings',
  admin: {
    livePreview: { url: () => previewUrl({ global: 'site-settings' }) }, // side panel with a sample page; refreshes on Save
    group: 'Website',
    description: 'Society details, footer and social links. Changes appear within about a minute. To hide or show pages, use Website → Page visibility.',
    hidden: hiddenUnlessAny(['globals.siteSettings']),
  },
  access: {
    read: () => true,
    update: keyAllowed('globals.siteSettings'),
  },
  fields: [
    {
      type: 'tabs',
      tabs: [
        {
          label: 'Society',
          fields: [
            {
              type: 'row',
              fields: [
                { name: 'name', type: 'text', required: true },
                { name: 'shortName', type: 'text', required: true },
              ],
            },
            {
              type: 'row',
              fields: [
                { name: 'institution', type: 'text', required: true },
                { name: 'motto', type: 'text' },
              ],
            },
            { name: 'location', type: 'text', admin: { description: 'Address shown on the site.' } },
            {
              // Which pages are hidden (any site path). Edited on the Page visibility screen: admins and access roles
              // with "Page visibility".
              name: 'hiddenPaths',
              type: 'json',
              access: { update: ({ req: { user } }) => can(user, 'admin.pageVisibility') },
              validate: (value: unknown) =>
                value === null || value === undefined || (Array.isArray(value) && value.length <= 300 && value.every(isHideablePath))
                  ? true
                  : 'Hidden pages must be a list of site paths such as /team',
              admin: { hidden: true },
            },
            // Retired 2026-10-04 (fixed list of 15 pages): replaced by hiddenPaths; data kept, no longer read
            {
              name: 'hiddenPages',
              type: 'select',
              hasMany: true,
              options: HIDEABLE_PAGES.map((p) => ({ label: `${p.label} (${p.route})`, value: p.route })),
              access: { update: ({ req: { user } }) => isAdmin(user) },
              admin: { hidden: true },
            },
            // Retired 2026-10-03: the home page text now lives in Pages → KRS home (data kept, hidden from editors)
            { name: 'about', type: 'textarea', admin: { hidden: true } },
            { name: 'domains', type: 'array', admin: { hidden: true }, labels: { singular: 'Domain', plural: 'Domains' }, fields: [{ name: 'domain', type: 'text', required: true }] },
            {
              name: 'pillars',
              admin: { hidden: true },
              type: 'array',
              labels: { singular: 'Pillar', plural: 'Pillars' },
              fields: [
                { name: 'title', type: 'text', required: true },
                { name: 'description', type: 'textarea', required: true },
              ],
            },
          ],
        },
        {
          label: 'Contact & footer',
          fields: [
            { name: 'contactEmail', type: 'email', admin: { description: 'Public contact address (leave empty to show none).' } },
            { name: 'footerBlurb', type: 'textarea', admin: { description: 'Short text under the logo in the KRS footer.' } },
            {
              name: 'socialLinks',
              type: 'array',
              labels: { singular: 'Social link', plural: 'Social links' },
              fields: [
                {
                  type: 'row',
                  fields: [
                    {
                      name: 'platform',
                      type: 'select',
                      required: true,
                      options: ['Instagram', 'LinkedIn', 'GitHub', 'YouTube', 'X', 'WhatsApp', 'Other'].map((p) => ({ label: p, value: p })),
                    },
                    { name: 'url', type: 'text', required: true, validate: safeHref },
                  ],
                },
              ],
            },
          ],
        },
      ],
    },
  ],
}
