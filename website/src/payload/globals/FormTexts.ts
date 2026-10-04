import type { GlobalConfig } from 'payload'
import { CONTENT_EDITORS, hasRole, hiddenUnless } from '../access/roles'
import { FORM_TEXT_GROUPS } from '../../lib/form-texts-defaults'
import { textGroupTabs } from '../fields/textGroups'

/** Wording of the registration form, status lookup and 404 page. Empty field = built-in text (shown as placeholder). */
export const FormTexts: GlobalConfig = {
  slug: 'form-texts',
  label: 'Labels & messages',
  admin: {
    group: 'Website',
    description:
      'Labels, buttons and messages of the forms (registration, status, sign-in), the project / learning / blog detail pages and the 404 page. Grey text in an empty field is what the site shows now; type to replace it, clear the field to go back to it.',
    hidden: hiddenUnless(CONTENT_EDITORS),
  },
  access: { read: () => true, update: ({ req: { user } }) => hasRole(user, CONTENT_EDITORS) },
  fields: [
    { type: 'tabs', tabs: textGroupTabs(FORM_TEXT_GROUPS) },
  ],
}
