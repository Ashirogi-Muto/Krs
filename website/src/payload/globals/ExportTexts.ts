import type { GlobalConfig } from 'payload'
import { hiddenUnlessAny, keyAllowed } from '../access/roles'
import { EXPORT_TEXT_GROUPS } from '../../lib/export-texts-defaults'
import { textGroupTabs } from '../fields/textGroups'

/** Wording of the registration export bar and the team-members CSV (owner, 21 Oct 2026). Same editors as Staff & admin texts. */
export const ExportTexts: GlobalConfig = {
  slug: 'export-texts',
  label: 'Export texts',
  admin: {
    group: 'Website',
    description:
      'Wording of the CSV export buttons on Event registrations and of the team-members CSV. Each field shows what the site uses now; edit it to change the text, or clear it to go back to the built-in wording.',
    hidden: hiddenUnlessAny(['globals.staffTexts']),
  },
  access: { read: ({ req: { user } }) => Boolean(user), update: keyAllowed('globals.staffTexts') },
  fields: [{ type: 'tabs', tabs: textGroupTabs(EXPORT_TEXT_GROUPS) }],
}
