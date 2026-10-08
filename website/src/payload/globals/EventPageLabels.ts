import type { GlobalConfig } from 'payload'
import { previewUrl } from '../../lib/preview-targets'
import { CONTENT_EDITORS, EVENT_EDITORS, hasRole, hiddenUnless } from '../access/roles'
import { EVENT_LABEL_GROUPS } from '../../lib/event-labels-defaults'
import { builtInTextField } from '../fields/textGroups'

const EDITORS = [...new Set([...CONTENT_EDITORS, ...EVENT_EDITORS])]

/** Wording of the competition page template (/aurix/<event>). Fields start with the built-in text; cleared = built-in text. */
export const EventPageLabels: GlobalConfig = {
  slug: 'event-page-labels',
  label: 'Event pages',
  admin: {
    livePreview: { url: () => previewUrl({ global: 'event-page-labels' }) }, // side panel with a sample page; refreshes on Save
    group: 'AURIX',
    description:
      'Headings, labels and buttons shared by every competition page. Fees, rules, rounds and FAQs are edited per competition in Events. Each field shows what the site uses now; edit it to change the text, or clear it to go back to the built-in wording.',
    hidden: hiddenUnless(EDITORS),
  },
  access: { read: () => true, update: ({ req: { user } }) => hasRole(user, EDITORS) },
  fields: [
    {
      type: 'tabs',
      tabs: EVENT_LABEL_GROUPS.map((g) => ({
        label: g.tab,
        fields: g.fields.map(([name, label, def]) => builtInTextField(name, label, def)),
      })),
    },
  ],
}
