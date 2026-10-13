import type { GlobalConfig } from 'payload'
import { hiddenUnlessAny, keyAllowed } from '../access/roles'
import { STAFF_TEXT_GROUPS } from '../../lib/staff-texts-defaults'
import { textGroupTabs } from '../fields/textGroups'

/** Wording of the staff tools and the custom CMS screens. Fields start with the built-in text; cleared = built-in text. Admins only. */
export const StaffTexts: GlobalConfig = {
  slug: 'staff-texts',
  label: 'Staff & admin texts',
  admin: {
    group: 'Website',
    description:
      'Wording of the staff tools (check-in desk, payment matching, data retention) and the custom CMS screens (dashboard panels, Participants / Team accounts, Page visibility). Each field shows what the site uses now; edit it to change the text, or clear it to go back to the built-in wording.',
    hidden: hiddenUnlessAny(['globals.staffTexts']),
  },
  access: { read: ({ req: { user } }) => Boolean(user), update: keyAllowed('globals.staffTexts') },
  fields: [{ type: 'tabs', tabs: textGroupTabs(STAFF_TEXT_GROUPS) }],
}
