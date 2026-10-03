import type { Field, TextFieldSingleValidation } from 'payload'

/**
 * Shared CMS field builders for page blocks, navigation and texts.
 * Every link an editor types goes through `safeHref`: only site paths, anchors, https/http, mailto and tel are
 * accepted, so a `javascript:` (or similar) URL can never reach the page.
 */
export const isSafeHref = (value: string): boolean =>
  /^(\/(?!\/)|#|https?:\/\/|mailto:|tel:)/i.test(value.trim())

export const safeHref: TextFieldSingleValidation = (value) =>
  !value || isSafeHref(String(value)) || 'Use a site path (/team), #anchor, https://…, mailto: or tel: link'

export const text = (name: string, label?: string, opts: Partial<Field> = {}): Field =>
  ({ name, label, type: 'text', ...opts }) as Field

export const textarea = (name: string, label?: string, rows = 3, opts: Partial<Field> = {}): Field =>
  ({ name, label, type: 'textarea', admin: { rows }, ...opts }) as Field

export const href = (name = 'href', label = 'Link', required = false): Field => ({
  name,
  label,
  type: 'text',
  required,
  validate: safeHref,
  admin: { description: 'Site path (/team), #anchor or full https:// link' },
})

/** label + link (+ optional style) — used for buttons, menu items and footer links */
export const linkFields = (withStyle = false): Field[] => [
  { type: 'row', fields: [text('label', 'Label', { required: true }), href('href', 'Link', true)] },
  ...(withStyle
    ? [
        {
          name: 'style',
          type: 'select',
          defaultValue: 'primary',
          options: [
            { label: 'Primary (filled)', value: 'primary' },
            { label: 'Secondary (outline)', value: 'secondary' },
            { label: 'Text link', value: 'link' },
          ],
        } as Field,
      ]
    : []),
]

export const buttons = (name = 'buttons', label = 'Buttons', maxRows = 3): Field => ({
  name,
  label,
  type: 'array',
  maxRows,
  labels: { singular: 'Button', plural: 'Buttons' },
  fields: linkFields(true),
})

export const image = (name = 'image', label = 'Image'): Field => ({
  name,
  label,
  type: 'upload',
  relationTo: 'media',
  admin: { description: 'PNG, JPEG, WebP, GIF or AVIF, up to 2 MB' },
})

/** Curated icon names (lucide) editors can pick for cards and badges. */
export const ICON_OPTIONS = [
  'cpu', 'terminal', 'trophy', 'book-open', 'layers', 'code', 'compass', 'zap', 'flame', 'rocket', 'users',
  'calendar', 'map-pin', 'mail', 'phone', 'award', 'target', 'lightbulb', 'wrench', 'shield', 'globe', 'star',
  'camera', 'graduation-cap', 'bot', 'circuit-board', 'gauge', 'flag', 'heart', 'clock',
] as const

export const icon = (name = 'icon', label = 'Icon'): Field => ({
  name,
  label,
  type: 'select',
  options: ICON_OPTIONS.map((v) => ({ label: v, value: v })),
})

/** Small line + title + intro that most sections start with */
export const sectionHeading = (): Field[] => [
  { type: 'row', fields: [text('eyebrow', 'Small line above the title'), text('title', 'Title')] },
  textarea('intro', 'Intro', 2),
]

export const theme = (): Field => ({
  name: 'theme',
  type: 'select',
  defaultValue: 'krs',
  options: [
    { label: 'KRS (cyan)', value: 'krs' },
    { label: 'AURIX (orange)', value: 'aurix' },
  ],
})
