import type { GlobalConfig } from 'payload'
import { CONTENT_EDITORS, hasRole, hiddenUnless } from '../access/roles'
import { FORM_TEXT_GROUPS } from '../../lib/form-texts-defaults'
import { textGroupTabs } from '../fields/textGroups'

/** Wording of the registration form, status lookup and 404 page. Fields start with the built-in text; cleared = built-in text. */
export const FormTexts: GlobalConfig = {
  slug: 'form-texts',
  label: 'Labels & messages',
  admin: {
    group: 'Website',
    description:
      'Labels, buttons and messages of the forms (registration, status, sign-in, account screens), the project / learning / blog detail pages, the 404 page, and small texts used across the whole site (Whole site tab: skip link, privacy/terms line, link-preview image, "coming soon"). Each field shows what the site uses now; edit it to change the text, or clear it to go back to the built-in wording.',
    hidden: hiddenUnless(CONTENT_EDITORS),
  },
  access: { read: () => true, update: ({ req: { user } }) => hasRole(user, CONTENT_EDITORS) },
  fields: [
    { type: 'tabs', tabs: textGroupTabs(FORM_TEXT_GROUPS) },
  ],
}
