import type { GlobalConfig } from 'payload'
import { previewUrl } from '../../lib/preview-targets'
import { hiddenUnlessAny, keyAllowed } from '../access/roles'
import { FORM_TEXT_GROUPS } from '../../lib/form-texts-defaults'
import { textGroupTabs } from '../fields/textGroups'

/** Wording of the registration form, status lookup and 404 page. Fields start with the built-in text; cleared = built-in text. */
export const FormTexts: GlobalConfig = {
  slug: 'form-texts',
  label: 'Labels & messages',
  admin: {
    livePreview: { url: () => previewUrl({ global: 'form-texts' }) }, // side panel with a sample page; refreshes on Save
    group: 'Website',
    description:
      'Labels, buttons and messages of the forms (registration, status, sign-in, account screens), the project / learning / blog detail pages, the 404 page, and small texts used across the whole site (Whole site tab: skip link, privacy/terms line, link-preview image, "coming soon"). Each field shows what the site uses now; edit it to change the text, or clear it to go back to the built-in wording.',
    hidden: hiddenUnlessAny(['globals.formTexts']),
  },
  access: { read: () => true, update: keyAllowed('globals.formTexts') },
  fields: [
    { type: 'tabs', tabs: textGroupTabs(FORM_TEXT_GROUPS) },
  ],
}
