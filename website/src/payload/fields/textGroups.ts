import type { Field, Tab } from 'payload'
import { safeHref } from './common'

type TextGroup = { readonly key: string; readonly tab: string; readonly fields: readonly (readonly [string, string, string])[] }

/**
 * One CMS tab per group of wording; each field shows its built-in text as the grey placeholder (empty field =
 * built-in text). Used by "Labels & messages" and "Participant portal".
 */
export const textGroupTabs = (groups: readonly TextGroup[]): Tab[] =>
  groups.map((g) => ({
    label: g.tab,
    fields: [
      {
        name: g.key,
        type: 'group',
        label: false,
        fields: g.fields.map(
          ([name, label, def]) =>
            ({
              name,
              label,
              type: def.length > 80 ? 'textarea' : 'text',
              admin: { placeholder: def },
              // Link fields go through the same check as every other CMS link (no javascript: URLs)
              ...(name.endsWith('Href') ? { validate: safeHref } : {}),
            }) as Field,
        ),
      },
    ],
  }))
