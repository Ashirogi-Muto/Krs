import type { CollectionConfig } from 'payload'
import { isAdmin, isManager } from '../access/roles'

export const Submissions: CollectionConfig = {
  slug: 'submissions',
  admin: {
    useAsTitle: 'projectTitle',
    defaultColumns: ['projectTitle', 'team', 'event', 'status', 'submittedAt'],
  },
  access: {
    read: ({ req: { user } }) => {
      if (!user) return false
      if (isManager(user) || user.role === 'JUDGE') {
        return true
      }
      return false // Scoped to team in portal endpoints
    },
    create: ({ req: { user } }) => Boolean(user && (isManager(user))),
    // Participant edits go through scoped portal endpoints, not the raw API
    update: ({ req: { user } }) => Boolean(user && (isAdmin(user))),
    delete: ({ req: { user } }) => Boolean(user && user.role === 'SUPER_ADMIN'),
  },
  fields: [
    {
      name: 'team',
      type: 'relationship',
      relationTo: 'teams',
      required: true,
    },
    {
      name: 'event',
      type: 'relationship',
      relationTo: 'events',
      required: true,
    },
    {
      name: 'roundNumber',
      type: 'number',
      required: true,
      defaultValue: 1,
    },
    {
      name: 'projectTitle',
      type: 'text',
      required: true,
    },
    {
      name: 'track',
      type: 'text',
      required: true,
    },
    {
      name: 'problemStatement',
      type: 'textarea',
      required: true,
    },
    {
      name: 'solution',
      type: 'textarea',
      required: true,
    },
    {
      name: 'architecture',
      type: 'textarea',
    },
    {
      name: 'repositoryUrl',
      type: 'text',
    },
    {
      name: 'demoUrl',
      type: 'text',
    },
    {
      name: 'aiUsageDisclosure',
      type: 'group',
      fields: [
        {
          name: 'usedGenerativeAI',
          type: 'checkbox',
          defaultValue: false,
          admin: {
            description: 'Disclose if substantial generative AI assistance was utilized in this submission.',
          },
        },
        {
          name: 'toolsUsed',
          type: 'text',
          admin: {
            description: 'AI tools employed (e.g. Claude, ChatGPT, GitHub Copilot, Cursor).',
          },
        },
        {
          name: 'purposeAndExtent',
          type: 'textarea',
          admin: {
            description: 'Detailed description of the specific tasks, prompts, or code segments developed with AI assistance.',
          },
        },
      ],
    },
    {
      name: 'status',
      type: 'select',
      defaultValue: 'DRAFT',
      options: [
        { label: 'Draft', value: 'DRAFT' },
        { label: 'Submitted', value: 'SUBMITTED' },
        { label: 'Under Review', value: 'UNDER_REVIEW' },
        { label: 'Qualified for Next Round', value: 'QUALIFIED' },
        { label: 'Not Qualified', value: 'NOT_QUALIFIED' },
        { label: 'Finalist', value: 'FINALIST' },
        { label: 'Locked / Evaluated', value: 'LOCKED' },
      ],
    },
    {
      name: 'submittedAt',
      type: 'date',
    },
  ],
}

export const Evaluations: CollectionConfig = {
  slug: 'evaluations',
  admin: {
    defaultColumns: ['team', 'event', 'judge', 'totalScore', 'createdAt'],
  },
  access: {
    read: ({ req: { user } }) => {
      if (!user) return false
      if (isManager(user)) return true
      if (user.role === 'JUDGE') {
        return {
          judge: {
            equals: user.id,
          },
        }
      }
      return false
    },
    create: ({ req: { user } }) => Boolean(user && (user.role === 'JUDGE' || isAdmin(user))),
    update: ({ req: { user } }) => Boolean(user && (isAdmin(user))),
    delete: ({ req: { user } }) => Boolean(user && user.role === 'SUPER_ADMIN'),
  },
  fields: [
    {
      name: 'judge',
      type: 'relationship',
      relationTo: 'users',
      required: true,
    },
    {
      name: 'event',
      type: 'relationship',
      relationTo: 'events',
      required: true,
    },
    {
      name: 'team',
      type: 'relationship',
      relationTo: 'teams',
      required: true,
    },
    {
      name: 'submission',
      type: 'relationship',
      relationTo: 'submissions',
    },
    {
      name: 'criterionScores',
      type: 'array',
      fields: [
        { name: 'criterionName', type: 'text', required: true },
        { name: 'score', type: 'number', required: true },
        { name: 'maxScore', type: 'number', required: true },
      ],
    },
    {
      name: 'totalScore',
      type: 'number',
      required: true,
    },
    {
      name: 'privateFeedback',
      type: 'textarea',
      admin: {
        description: 'Internal judge notes. Never published to participants or public.',
      },
      access: {
        // Enforce strict confidentiality per Domain 02 / Domain 06
        read: ({ req: { user } }) => Boolean(user && (isAdmin(user) || user.role === 'JUDGE')),
      },
    },
    {
      name: 'publicFeedback',
      type: 'textarea',
      admin: {
        description: 'Constructive feedback viewable by the team lead once evaluations are released.',
      },
    },
  ],
}

export const Results: CollectionConfig = {
  slug: 'results',
  admin: {
    defaultColumns: ['event', 'team', 'rank', 'award', 'published'],
  },
  access: {
    read: ({ req: { user } }) => {
      // Results strictly hidden until published=true
      if (user && (isManager(user))) {
        return true
      }
      return {
        published: {
          equals: true,
        },
      }
    },
    create: ({ req: { user } }) => Boolean(user && (isAdmin(user))),
    update: ({ req: { user } }) => Boolean(user && (isAdmin(user))),
    delete: ({ req: { user } }) => Boolean(user && user.role === 'SUPER_ADMIN'),
  },
  fields: [
    {
      name: 'event',
      type: 'relationship',
      relationTo: 'events',
      required: true,
    },
    {
      name: 'team',
      type: 'relationship',
      relationTo: 'teams',
      required: true,
    },
    {
      name: 'rank',
      type: 'number',
      required: true,
    },
    {
      name: 'award',
      type: 'text',
      admin: {
        description: 'e.g. "1st Place Winner", "Best Mechanical Design"',
      },
    },
    {
      name: 'score',
      type: 'number',
    },
    {
      name: 'published',
      type: 'checkbox',
      defaultValue: false,
      admin: {
        description: 'Results are never displayed publicly until checked.',
      },
    },
  ],
}
