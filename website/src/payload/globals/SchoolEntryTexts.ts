import type { GlobalConfig } from 'payload'
import { hiddenUnlessAny, keyAllowed } from '../access/roles'
import { SCHOOL_TEXT_GROUPS } from '../../lib/school-texts-defaults'
import { textGroupTabs } from '../fields/textGroups'

/**
 * Wording of the free school entry (owner, 18 Oct 2026). Same editors as "Labels & messages" (its own global because
 * that one's database row is full, see lib/school-texts-defaults.ts). Fields start with the built-in text; cleared = built-in.
 */
export const SchoolEntryTexts: GlobalConfig = {
  slug: 'school-entry-texts',
  label: 'School entry (free)',
  admin: {
    group: 'Website',
    description:
      'Wording of the free registration for school students: the checkbox and help on the registration form, the messages after registering, the status page line and the registration email. Each field shows what the site uses now; edit it to change the text, or clear it to go back to the built-in wording.',
    hidden: hiddenUnlessAny(['globals.formTexts']),
  },
  access: { read: () => true, update: keyAllowed('globals.formTexts') },
  fields: [{ type: 'tabs', tabs: textGroupTabs(SCHOOL_TEXT_GROUPS) }],
}
