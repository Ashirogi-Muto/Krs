import type { GlobalConfig } from 'payload'
import { CONTENT_EDITORS, hasRole, hiddenUnless, isAdmin } from '../access/roles'
import { HIDEABLE_PAGES } from '../../lib/visibility'

/**
 * Site-wide settings: society details shown on the KRS pages and footers, social links, and which pages are hidden.
 * Media & outreach edit the texts; only admins can hide or publish pages.
 */
export const SiteSettings: GlobalConfig = {
  slug: 'site-settings',
  label: 'Site settings',
  admin: {
    group: 'Website',
    description: 'Society details, footer, social links and which pages are hidden. Changes appear within about a minute.',
    hidden: hiddenUnless(CONTENT_EDITORS),
  },
  access: {
    read: () => true,
    update: ({ req: { user } }) => hasRole(user, CONTENT_EDITORS),
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
                    { name: 'url', type: 'text', required: true },
                  ],
                },
              ],
            },
          ],
        },
        {
          label: 'Hidden pages',
          description: 'Ticked pages return "not found" and disappear from menus, footers and the sitemap. Admins only.',
          fields: [
            {
              name: 'hiddenPages',
              type: 'select',
              hasMany: true,
              options: HIDEABLE_PAGES.map((p) => ({ label: `${p.label} (${p.route})`, value: p.route })),
              access: { update: ({ req: { user } }) => isAdmin(user) },
              admin: { description: 'Untick a page to publish it. Admins only.' },
            },
          ],
        },
      ],
    },
  ],
}
