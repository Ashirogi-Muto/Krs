import type { GlobalConfig } from 'payload'
import { hiddenUnlessAny, keyAllowed } from '../access/roles'
import { PORTAL_TEXT_GROUPS } from '../../lib/portal-texts-defaults'
import { textGroupTabs } from '../fields/textGroups'

/** Wording of every participant portal page. Fields start with the built-in text; cleared = built-in text. Media & outreach edit. */
export const PortalTexts: GlobalConfig = {
  slug: 'portal-texts',
  label: 'Participant portal',
  admin: {
    group: 'Website',
    description:
      'Titles, buttons, labels and messages of the AURIX participant portal (/aurix/portal), one tab per page. Each field shows what the portal uses now; edit it to change the text, or clear it to go back to the built-in wording.',
    hidden: hiddenUnlessAny(['globals.portalTexts']),
  },
  access: { read: () => true, update: keyAllowed('globals.portalTexts') },
  fields: [{ type: 'tabs', tabs: textGroupTabs(PORTAL_TEXT_GROUPS) }],
}
