import type { GlobalConfig } from 'payload'
import { EVENT_EDITORS, hasRole } from '../access/roles'

/**
 * The AURIX master timeline shown on /aurix/schedule: days, each with timed items.
 * Edited by admins, the Event Head and Media & outreach. Empty = the page lists only the official event dates.
 */
export const AurixSchedule: GlobalConfig = {
  slug: 'aurix-schedule',
  label: 'AURIX Schedule',
  admin: {
    group: 'Website',
    description: 'Day-by-day timeline for /aurix/schedule. Leave empty until the schedule is confirmed.',
    hidden: ({ user }) => !hasRole(user, EVENT_EDITORS),
  },
  access: {
    read: () => true,
    update: ({ req: { user } }) => hasRole(user, EVENT_EDITORS),
  },
  fields: [
    { name: 'intro', type: 'textarea', admin: { description: 'Optional text under the page title.' } },
    {
      name: 'days',
      type: 'array',
      labels: { singular: 'Day', plural: 'Days' },
      admin: { initCollapsed: false },
      fields: [
        {
          type: 'row',
          fields: [
            { name: 'date', type: 'date', required: true, admin: { date: { pickerAppearance: 'dayOnly', displayFormat: 'd MMM yyyy' } } },
            { name: 'title', type: 'text', admin: { description: 'e.g. "Day 1 — Arena matches"' } },
          ],
        },
        {
          name: 'items',
          type: 'array',
          labels: { singular: 'Item', plural: 'Items' },
          fields: [
            {
              type: 'row',
              fields: [
                { name: 'time', type: 'text', required: true, admin: { description: 'e.g. "09:30 – 10:00"' } },
                { name: 'title', type: 'text', required: true },
              ],
            },
            {
              type: 'row',
              fields: [
                { name: 'event', type: 'relationship', relationTo: 'events', admin: { description: 'Leave empty for all participants.' } },
                { name: 'label', type: 'text', admin: { description: 'Tag shown instead of the event name (e.g. "All competitions").' } },
                { name: 'location', type: 'text' },
              ],
            },
            { name: 'description', type: 'textarea' },
          ],
        },
      ],
    },
  ],
}
