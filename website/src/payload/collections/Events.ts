import type { CollectionConfig, Field } from 'payload'
import { previewUrl } from '../../lib/preview-targets'
import { EVENT_EDITORS, REG_MANAGERS, adminsOnly, fieldRoles, hasRole, hiddenUnless, superAdminOnly } from '../access/roles'

/** Registration, money and publishing settings: admins and the Event Head only (not Media & outreach). */
const LOCKED = new Set([
  'slug', 'status', 'startDate', 'endDate', 'registrationOpen', 'registrationClose', 'registrationFee', 'currency',
  'minTeamSize', 'maxTeamSize', 'operatorCount', 'comingSoon', 'registrationUrl', 'prizePool', 'paymentEventLabel',
  'requiresPayment', 'requiresSubmission', 'requiresJudging', 'resultsPublished',
])
const lockedUpdate = fieldRoles(['EVENT_HEAD'])
const lockFields = (fields: Field[]): Field[] =>
  fields.map((f) =>
    'name' in f && LOCKED.has(f.name) ? ({ ...f, access: { ...(f as any).access, update: lockedUpdate } } as Field) : f
  )

/**
 * The edit screen's tabs (display only: tabs without a name keep every field where it is in the database).
 * Every field must be in exactly one tab (checked when the config loads).
 */
export const EVENT_TABS: { label: string; description?: string; fields: string[] }[] = [
  { label: 'Basics', fields: ['title', 'shortName', 'slug', 'edition', 'series', 'eventType', 'status', 'featured', 'shortDescription', 'description'] },
  { label: 'Dates & place', fields: ['startDate', 'endDate', 'timezone', 'registrationOpen', 'registrationClose', 'venue', 'location'] },
  {
    label: 'Registration & fee',
    description: 'Fee, team size and who may register. Locked fields: admins and the Event Head only.',
    fields: ['registrationFee', 'currency', 'paymentEventLabel', 'requiresPayment', 'minTeamSize', 'maxTeamSize', 'operatorCount', 'participantRequirements', 'registrationUrl'],
  },
  { label: 'Prizes, rules & rounds', fields: ['prizePool', 'specsSummary', 'tracks', 'rounds', 'rulesSections', 'judgingCriteria', 'requiresSubmission', 'requiresJudging'] },
  {
    label: 'Notice & coming soon',
    description: 'The notice box on the competition page, and the "coming soon" mode that hides fees, rules and formats.',
    fields: ['noticeTitle', 'specialNotice', 'comingSoon', 'comingSoonMessage'],
  },
  { label: 'Schedule & FAQs', fields: ['schedule', 'faqs'] },
  { label: 'Results & media', fields: ['resultsPublished', 'mediaGalleryUrl'] },
  { label: 'Search & sharing', fields: ['seo'] },
]

const inTabs = (fields: Field[]): Field[] => {
  const byName = new Map(fields.map((f) => [(f as any).name as string, f]))
  const placed = EVENT_TABS.flatMap((t) => t.fields)
  const missing = [...byName.keys()].filter((n) => !placed.includes(n))
  const twice = placed.filter((n, i) => placed.indexOf(n) !== i)
  if (missing.length || twice.length) throw new Error(`Events tabs: not placed ${missing.join(', ')}; twice ${twice.join(', ')}`)
  return [
    {
      type: 'tabs',
      tabs: EVENT_TABS.map((t) => ({
        label: t.label,
        ...(t.description ? { description: t.description } : {}),
        fields: t.fields.map((n) => {
          const f = byName.get(n)
          if (!f) throw new Error(`Events: unknown field "${n}" in EVENT_TABS`)
          return f
        }),
      })),
    },
  ]
}

/**
 * Coming-soon competitions show only their name and dates on the site (lib/data/events applyComingSoon). The public REST
 * API must not reveal more (audit L7): for anyone who isn't an event editor, the same fields are blanked on read.
 * Server code (local API) is unaffected; it applies the same rule itself.
 */
export const hideComingSoonDetails = ({ doc, req }: { doc: any; req: { payloadAPI?: string; user?: unknown } }) => {
  if (!doc?.comingSoon || req.payloadAPI === 'local' || hasRole(req.user as any, [...REG_MANAGERS, ...EVENT_EDITORS])) return doc
  const message = doc.comingSoonMessage || null
  return {
    ...doc,
    shortDescription: message,
    description: message,
    registrationFee: null,
    minTeamSize: null,
    maxTeamSize: null,
    operatorCount: null,
    participantRequirements: null,
    specialNotice: null,
    noticeTitle: null,
    registrationUrl: null,
    specsSummary: null,
    paymentEventLabel: null,
    tracks: [],
    rounds: [],
    judgingCriteria: [],
    rulesSections: [],
    schedule: [],
    faqs: [],
  }
}

export const Events: CollectionConfig = {
  slug: 'events',
  admin: {
    useAsTitle: 'title',
    preview: (doc) => (doc?.slug ? `/aurix/${doc.slug}` : null), // "Preview" button: the competition page
    livePreview: { url: ({ data }) => previewUrl({ collection: 'events', id: data?.id }) }, // side panel; refreshes on Save
    description:
      'One entry per competition: its page /aurix/<slug> (dates, fee, team size, rules, rounds, FAQs, notice box), its card on the AURIX pages and the registration form. Shared headings of the competition pages are in Website → Event pages.',
    defaultColumns: ['title', 'slug', 'edition', 'status', 'registrationFee'],
    listSearchableFields: ['title', 'slug', 'shortName'],
    hidden: hiddenUnless([...REG_MANAGERS, ...EVENT_EDITORS]),
  },
  hooks: { afterRead: [hideComingSoonDetails] },
  access: {
    read: ({ req: { user } }) => {
      // Public can read published/announced events; admins, event heads and media also see drafts
      if (hasRole(user, [...REG_MANAGERS, ...EVENT_EDITORS])) {
        return true
      }
      return {
        status: {
          not_equals: 'DRAFT',
        },
      }
    },
    create: adminsOnly,
    // Media & outreach may edit texts; the fields in LOCKED stay with admins and the Event Head
    update: ({ req: { user } }) => hasRole(user, EVENT_EDITORS),
    delete: superAdminOnly,
  },
  fields: inTabs(lockFields([
    {
      name: 'title',
      type: 'text',
      required: true,
    },
    {
      name: 'shortName',
      type: 'text',
      required: true,
    },
    {
      name: 'slug',
      type: 'text',
      required: true,
      unique: true,
      index: true,
    },
    {
      name: 'edition',
      type: 'text',
      required: true,
      defaultValue: '2026',
    },
    {
      name: 'series',
      type: 'select',
      required: true,
      defaultValue: 'AURIX',
      options: [
        { label: 'AURIX Competition', value: 'AURIX' },
        { label: 'KRS Society Event', value: 'KRS' },
      ],
    },
    {
      name: 'eventType',
      type: 'select',
      required: true,
      options: [
        { label: 'Hackathon', value: 'HACKATHON' },
        { label: 'Robo Soccer', value: 'ROBO_SOCCER' },
        { label: 'Robo Race', value: 'ROBO_RACE' },
        { label: 'Robo Expo', value: 'ROBO_EXPO' },
        { label: 'Robo Ideathon', value: 'ROBO_IDEATHON' },
        { label: 'Technical Workshop', value: 'WORKSHOP' },
        { label: 'Other', value: 'OTHER' },
      ],
    },
    {
      name: 'status',
      type: 'select',
      required: true,
      defaultValue: 'REGISTRATION_OPEN',
      options: [
        { label: 'Draft', value: 'DRAFT' },
        { label: 'Announced', value: 'ANNOUNCED' },
        { label: 'Registration Open', value: 'REGISTRATION_OPEN' },
        { label: 'Registration Closed', value: 'REGISTRATION_CLOSED' },
        { label: 'In Progress', value: 'IN_PROGRESS' },
        { label: 'Judging', value: 'JUDGING' },
        { label: 'Results Pending', value: 'RESULTS_PENDING' },
        { label: 'Results Published', value: 'RESULTS_PUBLISHED' },
        { label: 'Archived', value: 'ARCHIVED' },
      ],
    },
    {
      name: 'shortDescription',
      type: 'textarea',
      required: true,
    },
    {
      name: 'description',
      type: 'textarea',
      required: true,
    },
    {
      name: 'startDate',
      type: 'date',
      required: true,
    },
    {
      name: 'endDate',
      type: 'date',
      required: true,
    },
    {
      name: 'registrationOpen',
      type: 'date',
    },
    {
      name: 'registrationClose',
      type: 'date',
    },
    {
      name: 'venue',
      type: 'text',
      defaultValue: 'IILM University, Greater Noida',
    },
    {
      name: 'location',
      type: 'text',
      defaultValue: 'Greater Noida, Uttar Pradesh, India',
    },
    {
      name: 'registrationFee',
      type: 'number',
      admin: {
        description: 'Fee in INR per team. Leave null if not confirmed in source documents.',
      },
    },
    {
      name: 'currency',
      type: 'text',
      defaultValue: 'INR',
    },
    {
      name: 'minTeamSize',
      type: 'number',
      admin: {
        description: 'Minimum team size. Leave empty if unconfirmed.',
      },
    },
    {
      name: 'maxTeamSize',
      type: 'number',
      admin: {
        description: 'Maximum team size. Leave empty if unconfirmed.',
      },
    },
    {
      name: 'operatorCount',
      type: 'number',
      admin: {
        description: 'Operator count on course/arena (modeled separately from team size, e.g. 1 for Robo Race).',
      },
    },
    {
      name: 'comingSoon',
      type: 'checkbox',
      defaultValue: false,
      admin: {
        description: 'Show a "Coming Soon" page instead of the event details (dates, rules, fees stay hidden).',
      },
    },
    {
      name: 'comingSoonMessage',
      type: 'textarea',
      admin: {
        description: 'Optional text shown on the Coming Soon page.',
        condition: (data) => Boolean(data?.comingSoon),
      },
    },
    {
      name: 'timezone',
      type: 'text',
      defaultValue: 'Asia/Kolkata',
    },
    {
      name: 'participantRequirements',
      type: 'textarea',
      admin: {
        description: 'Eligibility / reporting notes shown on the event page.',
      },
    },
    {
      name: 'registrationUrl',
      type: 'text',
      admin: {
        description: 'Optional external registration link. Leave empty to use the site registration page.',
      },
    },
    {
      name: 'prizePool',
      type: 'number',
      min: 0,
      admin: {
        description: 'Total prize pool for this event in INR (e.g. 30000). Shown on the site and summed into the AURIX total.',
      },
    },
    {
      name: 'specsSummary',
      type: 'text',
      admin: {
        description: 'One-line key specs shown in the AURIX comparison table, e.g. "30 × 30 × 25 cm, max 5 kg, wireless".',
      },
    },
    {
      name: 'paymentEventLabel',
      type: 'text',
      admin: {
        description:
          'Exact text of this event in the Razorpay payment page "Select event" dropdown (copy it exactly, including spaces).',
      },
    },
    {
      name: 'mediaGalleryUrl',
      type: 'text',
      admin: {
        description: 'Link to photos/videos (e.g. a Google Drive folder).',
      },
    },
    {
      // Search engines and link previews (WhatsApp, LinkedIn…); empty = the built-in title and the short description
      name: 'seo',
      type: 'group',
      label: 'Search & sharing',
      fields: [
        { name: 'title', type: 'text', label: 'Browser-tab / search title', admin: { description: 'Empty = the built-in title of this competition page.' } },
        { name: 'description', type: 'textarea', label: 'Search description', maxLength: 300, admin: { description: 'Empty = the short description.' } },
      ],
    },
    {
      name: 'specialNotice',
      type: 'textarea',
      label: 'Notice box text',
      admin: {
        description: 'Orange notice box near the top of the event page, e.g. a registration deadline or "Arena layout is revealed during the event". Empty = no box.',
      },
    },
    {
      name: 'noticeTitle',
      type: 'text',
      label: 'Notice box title',
      admin: {
        description: 'Empty = the shared title (Website → Event pages → "Notice box title").',
        condition: (data) => Boolean(data?.specialNotice),
      },
    },
    {
      name: 'requiresPayment',
      type: 'checkbox',
      defaultValue: false,
    },
    {
      name: 'requiresSubmission',
      type: 'checkbox',
      defaultValue: false,
    },
    {
      name: 'requiresJudging',
      type: 'checkbox',
      defaultValue: false,
    },
    {
      name: 'resultsPublished',
      type: 'checkbox',
      defaultValue: false,
    },
    {
      name: 'featured',
      type: 'checkbox',
      defaultValue: true,
    },
    {
      name: 'tracks',
      type: 'array',
      fields: [
        { name: 'number', type: 'number', required: true },
        { name: 'name', type: 'text', required: true },
        { name: 'mission', type: 'textarea', required: true },
        {
          name: 'examples',
          type: 'array',
          fields: [{ name: 'item', type: 'text' }],
        },
      ],
    },
    {
      name: 'rounds',
      type: 'array',
      fields: [
        { name: 'number', type: 'number', required: true },
        { name: 'name', type: 'text', required: true },
        { name: 'description', type: 'textarea' },
        { name: 'startDate', type: 'date' },
        { name: 'endDate', type: 'date' },
        { name: 'evaluationFormat', type: 'text' },
        {
          name: 'submissionType',
          type: 'select',
          options: [
            { label: 'Proposal / Document', value: 'PROPOSAL' },
            { label: 'Code & Demo Link', value: 'CODE_AND_DEMO' },
            { label: 'Live Presentation', value: 'PRESENTATION' },
            { label: 'In-Person Evaluation', value: 'IN_PERSON_DEMO' },
          ],
        },
      ],
    },
    {
      name: 'judgingCriteria',
      type: 'array',
      fields: [
        { name: 'name', type: 'text', required: true },
        { name: 'description', type: 'textarea' },
        { name: 'maxScore', type: 'number', required: true },
        { name: 'weightPercent', type: 'number' },
      ],
    },
    {
      name: 'rulesSections',
      type: 'array',
      fields: [
        { name: 'title', type: 'text', required: true },
        {
          name: 'rules',
          type: 'array',
          fields: [{ name: 'rule', type: 'text', required: true }],
        },
      ],
    },
    {
      name: 'schedule',
      type: 'array',
      fields: [
        { name: 'timeLabel', type: 'text', required: true },
        { name: 'title', type: 'text', required: true },
        { name: 'description', type: 'textarea' },
        { name: 'location', type: 'text' },
      ],
    },
    {
      name: 'faqs',
      type: 'array',
      fields: [
        { name: 'question', type: 'text', required: true },
        { name: 'answer', type: 'textarea', required: true },
      ],
    },
  ])),
}
