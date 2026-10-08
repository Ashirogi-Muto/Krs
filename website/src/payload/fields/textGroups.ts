import type { Field, Tab } from 'payload'
import { safeHref } from './common'

type TextGroup = { readonly key: string; readonly tab: string; readonly fields: readonly (readonly [string, string, string])[] }

/**
 * A wording field whose built-in text shows as the field's value from the start (also before the CMS screen was
 * ever saved): an empty or cleared field reads back as the built-in text, so editors always see what the site shows.
 */
export const builtInTextField = (name: string, label: string, def: string): Field =>
  ({
    name,
    label,
    type: def.length > 80 ? 'textarea' : 'text',
    defaultValue: def,
    admin: { placeholder: def },
    hooks: { afterRead: [({ value }: { value?: unknown }) => (typeof value === 'string' && value.trim() ? value : def)] },
    // Link fields go through the same check as every other CMS link (no javascript: URLs)
    ...(name.endsWith('Href') ? { validate: safeHref } : {}),
  }) as Field

/** One CMS tab per group of wording. Used by "Labels & messages", "Participant portal" and "Staff & admin texts". */
export const textGroupTabs = (groups: readonly TextGroup[]): Tab[] =>
  groups.map((g) => ({
    label: g.tab,
    fields: [
      {
        name: g.key,
        type: 'group',
        label: false,
        fields: g.fields.map(([name, label, def]) => builtInTextField(name, label, def)),
      },
    ],
  }))
