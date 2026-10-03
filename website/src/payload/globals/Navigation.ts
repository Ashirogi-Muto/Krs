import type { Field, GlobalConfig } from 'payload'
import { CONTENT_EDITORS, hasRole, hiddenUnless } from '../access/roles'
import { image, linkFields, text, textarea } from '../fields/common'

const menu = (name: string, label: string, description?: string, withStyle = false): Field => ({
  name,
  label,
  type: 'array',
  labels: { singular: 'Link', plural: 'Links' },
  admin: { description },
  fields: linkFields(withStyle),
})

const footerColumns: Field = {
  name: 'footerColumns',
  label: 'Footer columns',
  type: 'array',
  maxRows: 4,
  labels: { singular: 'Column', plural: 'Columns' },
  fields: [
    text('heading', 'Heading', { required: true }),
    {
      name: 'accent',
      type: 'select',
      defaultValue: 'plain',
      options: [
        { label: 'White heading', value: 'plain' },
        { label: 'KRS cyan heading', value: 'krs' },
        { label: 'AURIX orange heading', value: 'aurix' },
      ],
    },
    menu('links', 'Links'),
  ],
}

const siteTab = (key: 'krs' | 'aurix', label: string, extra: Field[]): { label: string; fields: Field[] } => ({
  label,
  fields: [
    {
      name: key,
      type: 'group',
      label: false,
      fields: [
        { type: 'row', fields: [text('brandTitle', 'Brand: title'), text('brandSubtitle', 'Brand: small line')] },
        image('logo', 'Logo (empty = built-in logo)'),
        menu('links', 'Top menu', 'Menu links in order. Links to hidden pages are left out automatically.'),
        menu('ctas', 'Top-right buttons', 'Shown right of the menu (and at the bottom of the phone menu).', true),
        ...extra,
        footerColumns,
        textarea('footerBlurb', 'Footer: short description', 2),
        textarea('footerAddress', 'Footer: address lines', 2),
        text('footerNote', 'Footer: bottom line', {
          admin: { description: 'Use {year}, {name} and {institution}. Empty = built-in line.' },
        }),
        menu('bottomLinks', 'Footer: links in the bottom bar'),
      ],
    },
  ],
})

/**
 * Menus, buttons, logos and footers of both sites. Empty fields keep the built-in wording
 * (src/lib/navigation-defaults.ts). Media & outreach can edit.
 */
export const Navigation: GlobalConfig = {
  slug: 'navigation',
  label: 'Navigation & footer',
  admin: {
    group: 'Website',
    description: 'Top menus, buttons, logos and footers of the KRS and AURIX sites. Changes appear within about a minute.',
    hidden: hiddenUnless(CONTENT_EDITORS),
  },
  access: { read: () => true, update: ({ req: { user } }) => hasRole(user, CONTENT_EDITORS) },
  fields: [
    {
      type: 'tabs',
      tabs: [
        siteTab('krs', 'KRS site', []),
        siteTab('aurix', 'AURIX site', [text('backLabel', 'Link back to KRS (next to the logo)')]),
      ],
    },
  ],
}
