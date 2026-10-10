import type { CollectionConfig, TextFieldSingleValidation, Where } from 'payload'
import { hiddenUnlessAny, createAccess, keyAccess } from '../access/roles'
import { accessFor } from '../access/permissions'
import { PAGE_BLOCKS } from '../blocks'
import { image } from '../fields/common'
import { previewUrl } from '../../lib/preview-targets'

/** Paths that belong to the app itself; a CMS page can never take them over. */
const RESERVED = ['/admin', '/api', '/aurix/portal', '/judge', '/checkin', '/payment-matching', '/retention', '/login', '/register', '/og', '/go']

const validPath: TextFieldSingleValidation = (value) => {
  const v = String(value || '')
  if (!/^\/([a-z0-9]+(-[a-z0-9]+)*(\/[a-z0-9]+(-[a-z0-9]+)*)*)?$/.test(v))
    return 'Start with / and use lowercase letters, digits and dashes, e.g. /about or /aurix/sponsors'
  if (RESERVED.some((r) => v === r || v.startsWith(r + '/'))) return `${v} is used by the site itself; pick another path`
  return true
}


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
    preview: (doc) => (typeof doc?.path === 'string' ? doc.path : null), // "Preview" button: the live page
    // Side panel with the page as it will look (drafts included); docs/LIVE_PREVIEW_PLAN.md
    livePreview: { url: ({ data }) => previewUrl({ collection: 'pages', id: data?.id }) },
    defaultColumns: ['title', 'path', 'published', 'updatedAt'],
    listSearchableFields: ['title', 'path'],
    description:
      'Every page of the site: texts, images, buttons and the order of sections. Edits are kept as a draft while you type (see them in Live Preview); "Publish changes" puts them on the site within about a minute.',
    hidden: hiddenUnlessAny(['pages.view', 'pages.edit', 'pages.create', 'pages.delete']),
  },
  access: {
    // The public only sees pages that are shown and published (a page saved only as a draft never is); editors see all
    // (access roles: "View drafts" on all pages, or only on chosen pages)
    read: ({ req: { user } }) => {
      const published: Where = { and: [{ published: { equals: true } }, { _status: { equals: 'published' } }] }
      const own = accessFor(user, 'pages.view', 'id')
      return own === true ? true : own ? ({ or: [published, own] } as Where) : published
    },
    readVersions: keyAccess('pages.versions', 'parent'),
    create: createAccess('pages.create'),
    update: keyAccess('pages.edit'),
    delete: keyAccess('pages.delete'), // built-in pages are refused by the beforeDelete hook below
  },
  // Drafts + autosave (owner, 8 Oct 2026): typing saves a draft every 2 s for the preview; visitors keep the published
  // version until "Publish changes". Saving a draft never touches the published row (Payload writes drafts to _pages_v).
  versions: { drafts: { autosave: { interval: 2000 } }, maxPerDoc: 25 },
  hooks: {
    beforeDelete: [
      async ({ req, id }) => {
        const doc: any = await req.payload.findByID({ collection: 'pages', id, depth: 0, overrideAccess: true })
        if (doc?.system) {
          // Wording: Staff & admin texts → Admin messages (imported here: the module reads the Payload config)
          const { getStaffTexts } = await import('../../lib/staff-texts')
          throw new Error((await getStaffTexts(req.payload)).adminApi.pageDeleteBuiltIn)
        }
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
          label: 'Show on the site',
          type: 'checkbox',
          defaultValue: true,
          admin: { description: 'Untick to hide this page. "Publish changes" makes your latest edits live.' },
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
        { label: 'Sections', fields: [{ name: 'layout', label: 'Sections', labels: { singular: 'Section', plural: 'Sections' }, type: 'blocks', blocks: PAGE_BLOCKS }] },
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
