import type { GlobalConfig } from 'payload'
import { CONTENT_EDITORS, hasRole, hiddenUnless } from '../access/roles'
import { FORM_TEXT_GROUPS } from '../../lib/form-texts-defaults'

/** Wording of the registration form, status lookup and 404 page. Empty field = built-in text (shown as placeholder). */
export const FormTexts: GlobalConfig = {
  slug: 'form-texts',
  label: 'Forms & messages',
  admin: {
    group: 'Website',
    description: 'Labels, buttons and messages of the AURIX registration form, the status lookup and the 404 page.',
    hidden: hiddenUnless(CONTENT_EDITORS),
  },
  access: { read: () => true, update: ({ req: { user } }) => hasRole(user, CONTENT_EDITORS) },
  fields: [
    {
      type: 'tabs',
      tabs: FORM_TEXT_GROUPS.map((g) => ({
        label: g.tab,
        fields: [
          {
            name: g.key,
            type: 'group' as const,
            label: false as const,
            fields: g.fields.map(([name, label, def]) => ({
              name,
              label,
              type: (def.length > 80 ? 'textarea' : 'text') as 'text',
              admin: { placeholder: def },
            })),
          },
        ],
      })),
    },
  ],
}
