import type { GlobalConfig } from 'payload'
import { CONTENT_EDITORS, hasRole, hiddenUnless } from '../access/roles'
import { PORTAL_TEXT_GROUPS } from '../../lib/portal-texts-defaults'
import { textGroupTabs } from '../fields/textGroups'

/** Wording of every participant portal page. Empty field = built-in text (shown in grey). Media & outreach edit. */
export const PortalTexts: GlobalConfig = {
  slug: 'portal-texts',
  label: 'Participant portal',
  admin: {
    group: 'Website',
    description:
      'Titles, buttons, labels and messages of the AURIX participant portal (/aurix/portal), one tab per page. Grey text in an empty field is what the portal shows now; type to replace it, clear the field to go back to it.',
    hidden: hiddenUnless(CONTENT_EDITORS),
  },
  access: { read: () => true, update: ({ req: { user } }) => hasRole(user, CONTENT_EDITORS) },
  fields: [{ type: 'tabs', tabs: textGroupTabs(PORTAL_TEXT_GROUPS) }],
}
