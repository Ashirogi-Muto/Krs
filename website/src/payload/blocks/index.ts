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
    image('image', 'Logo / image above the badge'),
    {
      name: 'builtinImage',
      label: 'Built-in image (used when no image is uploaded)',
      type: 'select',
      options: [{ label: 'AURIX full logo', value: 'aurix-logo-full' }],
    },
    {
      name: 'tagline',
      label: 'Tagline words',
      type: 'array',
      admin: { description: 'Shown in one line with dots between them. {dates} = AURIX dates, {prizePool} = total prize pool (both from Events).' },
      fields: [
        {
          type: 'row',
          fields: [text('item', 'Word or phrase', { required: true }), { name: 'highlight', type: 'checkbox', label: 'Highlight' }],
        },
      ],
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
    text('feeSuffix', 'Text after the fee', { admin: { description: 'e.g. " / team" (empty = nothing)' } }),
    {
      type: 'row',
      fields: [
        {
          name: 'variant',
          type: 'select',
          defaultValue: 'compact',
          options: [
            { label: 'Compact cards', value: 'compact' },
            { label: 'Large cards', value: 'large' },
          ],
        },
        { name: 'showPrizePool', label: 'Show prize pool', type: 'checkbox' },
        text('prizeLabel', 'Prize pool label'),
      ],
    },
    { type: 'row', fields: [text('teamPrefix', 'Text before team size (e.g. "Team: ")'), text('teamFallback', 'Team text when no size is set')] },
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

const pills = (name = 'pills', label = 'Category pills'): Field => ({
  name,
  label,
  type: 'array',
  admin: { description: 'Shown above the list. The first one is highlighted.' },
  fields: [text('item', 'Label', { required: true })],
})

export const PageHeaderBlock: Block = {
  slug: 'pageHeader',
  labels: { singular: 'Page title', plural: 'Page titles' },
  fields: [
    theme(),
    text('eyebrow', 'Small line above the title'),
    text('title', 'Title (the page heading)'),
    textarea('intro', 'Intro', 3),
    {
      type: 'row',
      fields: [
        text('introLinkLabel', 'Link after the intro: label'),
        href('introLinkHref', 'Link after the intro: target'),
        text('introAfter', 'Text after the link (e.g. ".")'),
      ],
    },
    {
      name: 'align',
      type: 'select',
      defaultValue: 'left',
      options: [
        { label: 'Left', value: 'left' },
        { label: 'Centered', value: 'center' },
      ],
    },
    meta,
  ],
}

export const PillsBlock: Block = {
  slug: 'pills',
  labels: { singular: 'Tag pills', plural: 'Tag pills' },
  fields: [pills('pills', 'Pills'), meta],
}

export const ProjectGridBlock: Block = {
  slug: 'projectGrid',
  labels: { singular: 'All projects', plural: 'All projects' },
  fields: [...sectionHeading(), text('buttonLabel', 'Card link label'), meta],
}

export const ResourceGridBlock: Block = {
  slug: 'resourceGrid',
  labels: { singular: 'All learning resources', plural: 'All learning resources' },
  fields: [...sectionHeading(), pills(), meta],
}

export const BlogGridBlock: Block = {
  slug: 'blogGrid',
  labels: { singular: 'All blog posts', plural: 'All blog posts' },
  fields: [
    ...sectionHeading(),
    pills(),
    { type: 'row', fields: [text('readLabel', 'Reading time suffix'), text('readMoreLabel', 'Card link label')] },
    meta,
  ],
}

export const GalleryGridBlock: Block = {
  slug: 'galleryGrid',
  labels: { singular: 'Gallery photos', plural: 'Gallery photos' },
  fields: [
    ...sectionHeading(),
    {
      name: 'showFilter',
      label: 'Show category filter',
      type: 'checkbox',
      defaultValue: true,
      admin: { description: 'Categories come from the gallery entries (Gallery → category).' },
    },
    text('allLabel', 'Filter: "all" label'),
    {
      name: 'categories',
      label: 'Filter categories (in this order)',
      type: 'array',
      admin: { description: 'Must match the gallery categories. Empty = all categories used by gallery entries.' },
      fields: [text('item', 'Category', { required: true })],
    },
    text('emptyText', 'Text when a category has no photos'),
    // Not shown since the gallery became a photo grid (7 Oct 2026); kept so saved values and columns stay
    {
      type: 'row',
      admin: { condition: () => false },
      fields: [text('photoLabel', 'Link label: photos'), text('videoLabel', 'Link label: videos')],
    },
    meta,
  ],
}

export const EventBannerBlock: Block = {
  slug: 'eventBanner',
  labels: { singular: 'AURIX banner', plural: 'AURIX banners' },
  fields: [
    text('badge', 'Badge'),
    text('title', 'Title'),
    textarea('text', 'Text', 3),
    {
      type: 'row',
      fields: [
        { name: 'showDates', label: 'Show AURIX dates (from Events)', type: 'checkbox', defaultValue: true },
        text('venue', 'Venue chip'),
      ],
    },
    buttons(),
    meta,
  ],
}

export const TeamGridBlock: Block = {
  slug: 'teamGrid',
  labels: { singular: 'Team members', plural: 'Team members' },
  fields: [
    ...sectionHeading(),
    {
      name: 'groups',
      label: 'Groups (in this order)',
      type: 'array',
      admin: { description: 'Members come from People; a group without members is not shown.' },
      fields: [
        {
          type: 'row',
          fields: [
            {
              name: 'group',
              type: 'select',
              required: true,
              options: [
                { label: 'Faculty Coordination', value: 'FACULTY' },
                { label: 'Core Leadership', value: 'LEADERSHIP' },
                { label: 'Robotics & Hardware', value: 'ROBOTICS' },
                { label: 'Software & AI', value: 'SOFTWARE_AI' },
                { label: 'Electronics & PCB', value: 'ELECTRONICS' },
                { label: 'Mechanical & CAD', value: 'MECHANICAL' },
                { label: 'Media & Operations', value: 'MEDIA' },
              ],
            },
            text('title', 'Heading', { required: true }),
          ],
        },
      ],
    },
    {
      type: 'row',
      fields: [text('memberSingular', 'Count word (1)'), text('memberPlural', 'Count word (2+)'), text('sinceLabel', 'Word before start year')],
    },
    {
      type: 'row',
      fields: [text('statusLabel', 'Status label'), text('activeLabel', 'Active'), text('alumniLabel', 'Alumni'), text('footerText', 'Card footer text')],
    },
    meta,
  ],
}

export const TimelineBlock: Block = {
  slug: 'timeline',
  labels: { singular: 'Timeline', plural: 'Timelines' },
  fields: [
    ...sectionHeading(),
    {
      name: 'items',
      type: 'array',
      labels: { singular: 'Milestone', plural: 'Milestones' },
      admin: { description: 'Shown in this order. Only list milestones that really happened.' },
      fields: [
        { type: 'row', fields: [text('year', 'Year / date'), text('title', 'Title', { required: true })] },
        textarea('description', 'Description', 2),
      ],
    },
    meta,
  ],
}

export const NoticeBlock: Block = {
  slug: 'notice',
  labels: { singular: 'Notice box', plural: 'Notice boxes' },
  fields: [
    { type: 'row', fields: [icon(), text('label', 'Small line')] },
    text('title', 'Title'),
    textarea('text', 'Text', 4),
    meta,
  ],
}

const contactItems: Field = {
  name: 'contactItems',
  label: 'Contact details (left column)',
  type: 'array',
  labels: { singular: 'Detail', plural: 'Details' },
  fields: [
    { type: 'row', fields: [icon(), text('title', 'Title', { required: true })] },
    textarea('text', 'Text (new line = line break)', 4),
    text('highlight', 'Highlighted line (e.g. an email address)'),
  ],
}

export const FormBlock: Block = {
  slug: 'form',
  labels: { singular: 'Form', plural: 'Forms' },
  fields: [
    ...sectionHeading(),
    text('formName', 'Form name (shown on submissions in the CMS)', { required: true }),
    {
      name: 'fields',
      label: 'Fields',
      type: 'array',
      minRows: 1,
      maxRows: 20,
      labels: { singular: 'Field', plural: 'Fields' },
      fields: [
        {
          type: 'row',
          fields: [
            text('label', 'Label', { required: true }),
            {
              name: 'type',
              type: 'select',
              required: true,
              defaultValue: 'text',
              options: [
                { label: 'Short text', value: 'text' },
                { label: 'Email', value: 'email' },
                { label: 'Phone', value: 'tel' },
                { label: 'Long text', value: 'textarea' },
                { label: 'Dropdown', value: 'select' },
              ],
            },
            { name: 'required', type: 'checkbox', label: 'Required' },
            { name: 'halfWidth', type: 'checkbox', label: 'Half width' },
          ],
        },
        text('placeholder', 'Placeholder'),
        {
          name: 'options',
          label: 'Dropdown choices',
          type: 'array',
          admin: { condition: (_: any, sib: any) => sib?.type === 'select' },
          fields: [text('item', 'Choice', { required: true })],
        },
      ],
    },
    { type: 'row', fields: [text('submitLabel', 'Button label'), text('sendingLabel', 'Button label while sending')] },
    { type: 'row', fields: [text('successTitle', 'Thank-you title'), textarea('successText', 'Thank-you text', 2)] },
    contactItems,
    meta,
  ],
}

export const StepsBlock: Block = {
  slug: 'steps',
  labels: { singular: 'Numbered steps', plural: 'Numbered steps' },
  fields: [
    theme(),
    ...sectionHeading(),
    {
      name: 'steps',
      type: 'array',
      maxRows: 8,
      labels: { singular: 'Step', plural: 'Steps' },
      admin: { description: 'Use {dates} to insert the AURIX dates from Events.' },
      fields: [text('title', 'Title', { required: true }), textarea('text', 'Text', 2)],
    },
    meta,
  ],
}

export const ComparisonTableBlock: Block = {
  slug: 'comparisonTable',
  labels: { singular: 'Competition comparison table', plural: 'Competition comparison tables' },
  fields: [
    ...sectionHeading(),
    {
      type: 'collapsible',
      label: 'Column headings',
      fields: [
        { type: 'row', fields: [text('colName', 'Competition'), text('colTeam', 'Team'), text('colFee', 'Fee')] },
        { type: 'row', fields: [text('colPrize', 'Prize pool'), text('colSpecs', 'Constraints'), text('colDates', 'Dates')] },
      ],
    },
    meta,
  ],
}

export const EventFaqsBlock: Block = {
  slug: 'eventFaqs',
  labels: { singular: 'FAQs of all competitions', plural: 'FAQs of all competitions' },
  fields: [...sectionHeading(), text('titleSuffix', 'Text after each competition name (e.g. " FAQ")'), meta],
}

export const EventRulebooksBlock: Block = {
  slug: 'eventRulebooks',
  labels: { singular: 'Rulebooks of all competitions', plural: 'Rulebooks of all competitions' },
  fields: [
    ...sectionHeading(),
    { type: 'row', fields: [text('badgePrefix', 'Badge before the event type'), text('buttonLabel', 'Button label')] },
    {
      type: 'row',
      fields: [text('feeLabel', 'Label: fee'), text('teamLabel', 'Label: team size'), text('datesLabel', 'Label: dates')],
    },
    {
      type: 'row',
      fields: [text('versionLabel', 'Label: version'), text('versionValue', 'Version text'), text('unpricedLabel', 'Text when no fee')],
    },
    { type: 'row', fields: [text('noticeLabel', 'Notice label'), text('teamFallback', 'Team text when no size is set')] },
    meta,
  ],
}

export const ScheduleBlock: Block = {
  slug: 'schedule',
  labels: { singular: 'AURIX schedule', plural: 'AURIX schedules' },
  fields: [
    ...sectionHeading(),
    textarea('emptyText', 'Text before the event dates (while no timings are set in "AURIX schedule")', 2),
    meta,
  ],
}

export const ResultsBlock: Block = {
  slug: 'results',
  labels: { singular: 'Competition results', plural: 'Competition results' },
  fields: [
    ...sectionHeading(),
    {
      type: 'collapsible',
      label: 'While no results are published',
      fields: [
        text('pendingBadge', 'Small line'),
        text('pendingTitle', 'Title'),
        textarea('pendingText', 'Text', 2),
        buttons('pendingButtons', 'Buttons', 3),
      ],
    },
    meta,
  ],
}

export const StatusLookupBlock: Block = {
  slug: 'statusLookup',
  labels: { singular: 'Registration status lookup', plural: 'Registration status lookups' },
  fields: [meta],
}

export const RegistrationFormBlock: Block = {
  slug: 'registrationForm',
  labels: { singular: 'AURIX registration form', plural: 'AURIX registration forms' },
  fields: [textarea('closedText', 'Text when no competition is open for registration', 2), meta],
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
  PageHeaderBlock,
  PillsBlock,
  ProjectGridBlock,
  ResourceGridBlock,
  BlogGridBlock,
  GalleryGridBlock,
  EventBannerBlock,
  TeamGridBlock,
  TimelineBlock,
  NoticeBlock,
  FormBlock,
  StepsBlock,
  ComparisonTableBlock,
  EventFaqsBlock,
  EventRulebooksBlock,
  ScheduleBlock,
  ResultsBlock,
  StatusLookupBlock,
  RegistrationFormBlock,
]
