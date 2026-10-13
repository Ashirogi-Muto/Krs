import type { GlobalConfig } from 'payload'
import { previewUrl } from '../../lib/preview-targets'
import { hiddenUnlessAny, isAdmin, keyAllowed } from '../access/roles'
import { can } from '../access/permissions'
import { HIDEABLE_PAGES, isHideablePath } from '../../lib/visibility'
import { image, safeHref, withDefault } from '../fields/common'
import { DEFAULT_HERO_SPONSORS_LABEL } from '../../lib/site-settings-defaults'

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
          // Owner, 10 Oct 2026: one list for the AURIX home "Sponsors" section and the competition pages
          label: 'Sponsors (AURIX)',
          description: 'Shown by the "Sponsors" section on pages (e.g. AURIX home) and as a strip on competition pages. Order here = order on the site.',
          fields: [
            withDefault(
              { name: 'heroLabel', type: 'text', label: 'Hero: text before the small logos', admin: { description: 'Shown in the hero of AURIX home and competition pages, before the logos ticked "Show a small logo in the hero".' } },
              DEFAULT_HERO_SPONSORS_LABEL,
            ),
            {
              name: 'sponsors',
              type: 'array',
              labels: { singular: 'Sponsor', plural: 'Sponsors' },
              fields: [
                {
                  type: 'row',
                  fields: [
                    { name: 'name', type: 'text', required: true, admin: { description: 'e.g. realme (also the logo\'s description for screen readers)' } },
                    { name: 'label', type: 'text', defaultValue: 'Brand Partner', admin: { description: 'Shown above the logo, e.g. Brand Partner, Title Sponsor. Empty = none.' } },
                  ],
                },
                { name: 'logo', type: 'upload', relationTo: 'media', required: true, admin: { description: 'PNG or WebP with a transparent background; shown light-on-dark (the AURIX pages are dark).' } },
                { name: 'url', type: 'text', validate: safeHref, admin: { description: 'Sponsor website (opens in a new tab). Empty = logo without a link.' } },
                // Owner, 10 Oct 2026: a smaller logo in the hero too, only for the sponsors ticked here
                { name: 'inHero', type: 'checkbox', defaultValue: false, label: 'Show a small logo in the hero (AURIX home, and the competition pages chosen below)' },
                {
                  type: 'row',
                  fields: [
                    { name: 'onCompetitions', type: 'checkbox', defaultValue: true, label: 'Show on competition pages' },
                    { name: 'events', type: 'relationship', relationTo: 'events', hasMany: true, admin: { description: 'Only these competition pages (empty = all of them).', condition: (_: any, s: any) => Boolean(s?.onCompetitions) } },
                  ],
                },
              ],
            },
          ],
        },
        {
          // Owner, 13 Oct 2026: every image on the site can be changed in the CMS. Empty = the built-in image.
          label: 'Logos & icons',
          description: 'Images that are not part of a page section. Leave a field empty to keep the built-in image. Changes appear within about 5 minutes.',
          fields: [
            {
              name: 'brandImages',
              type: 'group',
              label: false,
              fields: [
                {
                  type: 'row',
                  fields: [
                    image('krsIcon', 'Browser-tab icon: KRS pages (empty = built-in KRS mark)'),
                    image('aurixIcon', 'Browser-tab icon: AURIX pages and the rest of the site (empty = built-in AURIX "A")'),
                  ],
                },
                { type: 'row', fields: [image('shareLogo', 'Logo on link previews (WhatsApp, LinkedIn…; empty = built-in AURIX logo)'), image('emailLogo', 'Logo at the top of the emails (empty = built-in AURIX logo)')] },
                image('searchLogo', 'Logo for search engines (Google; empty = built-in KRS logo)'),
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
