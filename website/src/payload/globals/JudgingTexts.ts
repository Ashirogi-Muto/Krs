import type { GlobalConfig } from 'payload'
import { hiddenUnlessAny, keyAllowed } from '../access/roles'
import { JUDGING_TEXT_GROUPS } from '../../lib/judging-texts-defaults'
import { textGroupTabs } from '../fields/textGroups'

/**
 * Wording of judging (owner, 20 Oct 2026): judge portal (/judge), results desk (/judging) and their messages. Same
 * editors as "Staff & admin texts" (its own global: that row is full). Fields start with the built-in text; cleared = built-in.
 */
export const JudgingTexts: GlobalConfig = {
  slug: 'judging-texts',
  label: 'Judging texts',
  admin: {
    group: 'Website',
    description:
      'Wording of the judge portal (/judge), the judging results desk (/judging) and their messages. Each field shows what the site uses now; edit it to change the text, or clear it to go back to the built-in wording.',
    hidden: hiddenUnlessAny(['globals.staffTexts']),
  },
  access: { read: () => true, update: keyAllowed('globals.staffTexts') },
  fields: [{ type: 'tabs', tabs: textGroupTabs(JUDGING_TEXT_GROUPS) }],
}
