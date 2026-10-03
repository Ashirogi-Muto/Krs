import type { GlobalConfig } from 'payload'
import { CONTENT_EDITORS, EVENT_EDITORS, hasRole, hiddenUnless } from '../access/roles'
import { EVENT_LABEL_GROUPS } from '../../lib/event-labels-defaults'

const EDITORS = [...new Set([...CONTENT_EDITORS, ...EVENT_EDITORS])]

/** Wording of the competition page template (/aurix/<event>). Empty field = built-in text. */
export const EventPageLabels: GlobalConfig = {
  slug: 'event-page-labels',
  label: 'Event pages',
  admin: {
    group: 'Website',
    description:
      'Headings, labels and buttons shared by every competition page. Fees, rules, rounds and FAQs are edited per competition in Events.',
    hidden: hiddenUnless(EDITORS),
  },
  access: { read: () => true, update: ({ req: { user } }) => hasRole(user, EDITORS) },
  fields: [
    {
      type: 'tabs',
      tabs: EVENT_LABEL_GROUPS.map((g) => ({
        label: g.tab,
        fields: g.fields.map(([name, label, def]) => ({
          name,
          label,
          type: (def.length > 80 ? 'textarea' : 'text') as 'text',
          admin: { placeholder: def },
        })),
      })),
    },
  ],
}
