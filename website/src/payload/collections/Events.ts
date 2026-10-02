import type { CollectionConfig } from 'payload'

export const Events: CollectionConfig = {
  slug: 'events',
  admin: {
    useAsTitle: 'title',
    defaultColumns: ['title', 'slug', 'edition', 'status', 'registrationFee'],
  },
  access: {
    read: ({ req: { user } }) => {
      // Public can read published/announced events; admins can read drafts
      if (user && (user.role === 'SUPER_ADMIN' || user.role === 'ADMIN' || user.role === 'ORGANIZER')) {
        return true
      }
      return {
        status: {
          not_equals: 'DRAFT',
        },
      }
    },
    create: ({ req: { user } }) => Boolean(user && (user.role === 'SUPER_ADMIN' || user.role === 'ADMIN')),
    update: ({ req: { user } }) => Boolean(user && (user.role === 'SUPER_ADMIN' || user.role === 'ADMIN' || user.role === 'ORGANIZER')),
    delete: ({ req: { user } }) => Boolean(user && user.role === 'SUPER_ADMIN'),
  },
  fields: [
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
      name: 'specialNotice',
      type: 'textarea',
      admin: {
        description: 'e.g. "Arena layout is revealed during the event"',
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
  ],
}
