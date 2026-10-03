import type { Block, Field } from 'payload'
import { buttons, href, icon, image, sectionHeading, text, textarea, theme } from '../fields/common'

/**
 * Page sections editors can add, remove and reorder in "Pages" (CMS → Website → Pages).
 * Every block renders in src/components/blocks/*; data blocks (events, projects, …) read their records live.
 * Add a block here AND in src/components/blocks/RenderBlocks.tsx.
 */

/** Settings every block has: hide with a page, and an id for #links. */
const meta: Field = {
  type: 'collapsible',
  label: 'Section settings',
  admin: { initCollapsed: true },
  fields: [
    {
      type: 'row',
      fields: [
        text('visibleIf', 'Show only while this page is visible', {
          admin: { description: 'e.g. /join — the section disappears when that page is hidden in Site settings' },
        }),
        text('anchor', 'Anchor id', { admin: { description: 'For links like #about (letters, digits, dashes)' } }),
      ],
    },
  ],
}

const listLink: Field[] = [
  { type: 'row', fields: [text('linkLabel', '"See all" link: label'), href('linkHref', '"See all" link: target')] },
]

const limit = (def: number, max = 12): Field => ({
  name: 'limit',
  label: 'How many to show',
  type: 'number',
  defaultValue: def,
  min: 1,
  max,
})

export const HeroBlock: Block = {
  slug: 'hero',
  labels: { singular: 'Hero (big title)', plural: 'Heroes' },
  fields: [
    theme(),
    text('eyebrow', 'Badge above the title'),
    { type: 'row', fields: [text('title', 'Title'), text('titleAccent', 'Title: highlighted part (new line)')] },
    {
      name: 'tagline',
      label: 'Tagline words',
      type: 'array',
      admin: { description: 'Shown in one line with dots between them' },
      fields: [text('item', 'Word or phrase', { required: true })],
    },
    textarea('intro', 'Intro', 3),
    { name: 'showCountdown', label: 'Show countdown to the first AURIX event', type: 'checkbox' },
    text('countdownLabel', 'Countdown label'),
    buttons(),
    meta,
  ],
}

export const TextChipsBlock: Block = {
  slug: 'textChips',
  labels: { singular: 'Text + tag list', plural: 'Text + tag lists' },
  fields: [
    ...sectionHeading(),
    textarea('body', 'Text', 6),
    { type: 'row', fields: [text('linkLabel', 'Link: label'), href('linkHref', 'Link: target')] },
    text('chipsTitle', 'Tag list: title'),
    { name: 'chips', label: 'Tags', type: 'array', fields: [text('item', 'Tag', { required: true })] },
    meta,
  ],
}

export const CalloutBlock: Block = {
  slug: 'callout',
  labels: { singular: 'Highlight box', plural: 'Highlight boxes' },
  fields: [theme(), ...sectionHeading(), buttons(), meta],
}

export const CardGridBlock: Block = {
  slug: 'cardGrid',
  labels: { singular: 'Cards grid', plural: 'Cards grids' },
  fields: [
    ...sectionHeading(),
    {
      name: 'columns',
      type: 'select',
      defaultValue: '4',
      options: ['2', '3', '4'].map((v) => ({ label: `${v} per row`, value: v })),
    },
    {
      name: 'cards',
      type: 'array',
      labels: { singular: 'Card', plural: 'Cards' },
      fields: [
        { type: 'row', fields: [icon(), text('title', 'Title', { required: true })] },
        textarea('text', 'Text', 3),
        { type: 'row', fields: [text('linkLabel', 'Link: label'), href('linkHref', 'Link: target')] },
      ],
    },
    meta,
  ],
}

export const FeaturedProjectBlock: Block = {
  slug: 'featuredProject',
  labels: { singular: 'Featured project', plural: 'Featured projects' },
  fields: [
    text('eyebrow', 'Small line above the title'),
    {
      name: 'project',
      type: 'relationship',
      relationTo: 'projects',
      admin: { description: 'Empty = the project marked "featured" (or the first project)' },
    },
    {
      type: 'row',
      fields: [text('statusLabel', 'Label: status'), text('benchmarkLabel', 'Label: results box')],
    },
    {
      type: 'row',
      fields: [text('hardwareTitle', 'Hardware list title'), text('softwareTitle', 'Software list title')],
    },
    text('buttonLabel', 'Button label'),
    meta,
  ],
}

export const EventCardsBlock: Block = {
  slug: 'eventCards',
  labels: { singular: 'Competition cards', plural: 'Competition cards' },
  fields: [
    ...sectionHeading(),
    ...listLink,
    {
      type: 'row',
      fields: [
        limit(3, 10),
        { name: 'featuredOnly', label: 'Only featured competitions', type: 'checkbox' },
        text('buttonLabel', 'Card button label'),
      ],
    },
    meta,
  ],
}

export const ResourceCardsBlock: Block = {
  slug: 'resourceCards',
  labels: { singular: 'Learning resources', plural: 'Learning resources' },
  fields: [...sectionHeading(), ...listLink, { type: 'row', fields: [limit(3), text('byLabel', 'Word before author')] }, meta],
}

export const BlogCardsBlock: Block = {
  slug: 'blogCards',
  labels: { singular: 'Blog posts', plural: 'Blog posts' },
  fields: [...sectionHeading(), ...listLink, { type: 'row', fields: [limit(2), text('readLabel', 'Reading time suffix')] }, meta],
}

export const CtaBlock: Block = {
  slug: 'cta',
  labels: { singular: 'Call to action', plural: 'Calls to action' },
  fields: [theme(), ...sectionHeading(), buttons('buttons', 'Buttons', 2), meta],
}

export const RichTextBlock: Block = {
  slug: 'richText',
  labels: { singular: 'Free text', plural: 'Free texts' },
  fields: [
    ...sectionHeading(),
    { name: 'content', type: 'richText', label: 'Text' },
    {
      name: 'width',
      type: 'select',
      defaultValue: 'narrow',
      options: [
        { label: 'Narrow (reading width)', value: 'narrow' },
        { label: 'Wide', value: 'wide' },
      ],
    },
    meta,
  ],
}

export const ImageTextBlock: Block = {
  slug: 'imageText',
  labels: { singular: 'Image + text', plural: 'Image + text' },
  fields: [
    ...sectionHeading(),
    textarea('body', 'Text', 6),
    image('image', 'Image'),
    {
      name: 'imagePosition',
      type: 'select',
      defaultValue: 'right',
      options: [
        { label: 'Image right', value: 'right' },
        { label: 'Image left', value: 'left' },
      ],
    },
    buttons(),
    meta,
  ],
}

export const PAGE_BLOCKS: Block[] = [
  HeroBlock,
  TextChipsBlock,
  CalloutBlock,
  CardGridBlock,
  ImageTextBlock,
  RichTextBlock,
  CtaBlock,
  FeaturedProjectBlock,
  EventCardsBlock,
  ResourceCardsBlock,
  BlogCardsBlock,
]
