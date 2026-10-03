import type { CollectionConfig, TextFieldSingleValidation } from 'payload'
import { CONTENT_EDITORS, hasRole, hiddenUnless } from '../access/roles'
import { PAGE_BLOCKS } from '../blocks'
import { image } from '../fields/common'

/** Paths that belong to the app itself; a CMS page can never take them over. */
const RESERVED = ['/admin', '/api', '/aurix/portal', '/judge', '/checkin', '/payment-matching', '/retention', '/login', '/register', '/og', '/go']

const validPath: TextFieldSingleValidation = (value) => {
  const v = String(value || '')
  if (!/^\/([a-z0-9]+(-[a-z0-9]+)*(\/[a-z0-9]+(-[a-z0-9]+)*)*)?$/.test(v))
    return 'Start with / and use lowercase letters, digits and dashes, e.g. /about or /aurix/sponsors'
  if (RESERVED.some((r) => v === r || v.startsWith(r + '/'))) return `${v} is used by the site itself; pick another path`
  return true
}

const editors = ({ req: { user } }: any) => hasRole(user, CONTENT_EDITORS)

/**
 * Website pages built from sections (blocks). Built-in pages (home, team, …) are created on first start with
 * today's content (src/lib/pages/defaults.ts); editors can change everything except their path. New pages
 * can be added at any free path: under /aurix/… they use the AURIX look, everywhere else the KRS look.
 */
export const Pages: CollectionConfig = {
  slug: 'pages',
  labels: { singular: 'Page', plural: 'Pages' },
  admin: {
    group: 'Website',
    useAsTitle: 'title',
    defaultColumns: ['title', 'path', 'published', 'updatedAt'],
    description: 'Every page of the site: texts, images, buttons and the order of sections. Changes appear within about a minute.',
    hidden: hiddenUnless(CONTENT_EDITORS),
  },
  access: {
    // The public only sees published pages; editors see drafts too
    read: ({ req: { user } }) => (hasRole(user, CONTENT_EDITORS) ? true : { published: { equals: true } }),
    create: editors,
    update: editors,
    delete: editors, // built-in pages are refused by the beforeDelete hook below
  },
  hooks: {
    beforeDelete: [
      async ({ req, id }) => {
        const doc: any = await req.payload.findByID({ collection: 'pages', id, depth: 0, overrideAccess: true })
        if (doc?.system) throw new Error('Built-in pages cannot be deleted. Hide them in Site settings instead.')
      },
    ],
  },
  fields: [
    { name: 'title', type: 'text', required: true, admin: { description: 'Name in the CMS (and default browser-tab title)' } },
    {
      type: 'row',
      fields: [
        {
          name: 'path',
          type: 'text',
          required: true,
          unique: true,
          index: true,
          validate: validPath,
          access: { update: ({ doc }: any) => !doc?.system },
          admin: { description: 'Address of the page, e.g. /about. Built-in pages keep their address.' },
        },
        {
          name: 'spacing',
          type: 'select',
          admin: { description: 'Empty = the built-in setting (compact for new pages)' },
          options: [
            { label: 'Compact (title pages, lists)', value: 'compact' },
            { label: 'Roomy (landing pages)', value: 'roomy' },
          ],
        },
        {
          name: 'width',
          type: 'select',
          admin: { description: 'Empty = the built-in setting (full for new pages)' },
          options: [
            { label: 'Full width', value: 'full' },
            { label: 'Large (rulebooks, schedules)', value: 'large' },
            { label: 'Medium (FAQ, results, registration)', value: 'medium' },
            { label: 'Narrow (forms, text)', value: 'narrow' },
          ],
        },
        {
          name: 'published',
          type: 'checkbox',
          defaultValue: true,
          admin: { description: 'Unticked = only visible in the CMS' },
        },
      ],
    },
    {
      name: 'system',
      type: 'checkbox',
      defaultValue: false,
      access: { create: () => false, update: () => false },
      admin: { readOnly: true, position: 'sidebar', description: 'Built-in page (cannot be deleted; path fixed)' },
    },
    {
      type: 'tabs',
      tabs: [
        { label: 'Sections', fields: [{ name: 'layout', label: 'Sections', type: 'blocks', blocks: PAGE_BLOCKS }] },
        {
          label: 'SEO',
          fields: [
            {
              name: 'seo',
              type: 'group',
              label: false,
              fields: [
                { name: 'title', type: 'text', label: 'Browser-tab / search title' },
                { name: 'description', type: 'textarea', label: 'Search description', maxLength: 300 },
                image('image', 'Share image (empty = generated)'),
                { name: 'noIndex', type: 'checkbox', label: 'Hide from search engines' },
              ],
            },
          ],
        },
      ],
    },
  ],
}
