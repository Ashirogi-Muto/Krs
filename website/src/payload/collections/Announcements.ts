import type { CollectionConfig, Where } from 'payload'
import { canUseAdmin, hiddenUnlessAny, createAccess, keyAccess } from '../access/roles'

/** Who writes announcements: admins, President / Event Head, Media & outreach. */

/**
 * AURIX Tournament announcements and bulletins.
 * Managed by staff in the CMS; a participant can read only published announcements meant for everyone or for an
 * event they have claimed a registration for (enforced here too, not only on the portal page).
 */
export const Announcements: CollectionConfig = {
  slug: 'announcements',
  admin: {
    group: 'AURIX',
    useAsTitle: 'title',
    description:
      'News for registered participants, shown in the participant portal (Announcements). Choose everyone or specific competitions as the audience.',
    defaultColumns: ['title', 'audienceType', 'published', 'pinned', 'publishedAt'],
    listSearchableFields: ['title', 'body'],
    hidden: hiddenUnlessAny(['announcements.create', 'announcements.edit', 'announcements.delete']),
  },
  access: {
    read: async ({ req }) => {
      const user = req.user
      if (!user) return false
      if (canUseAdmin(user)) return true // staff
      const { docs } = await req.payload.find({
        collection: 'event-registrations',
        overrideAccess: true,
        depth: 0,
        pagination: false,
        where: { participants: { contains: user.id } },
        select: { event: true },
      })
      const eventIds = [...new Set((docs as any[]).map((d) => (typeof d.event === 'object' ? d.event?.id : d.event)).filter(Boolean))]
      const audience: Where[] = [{ audienceType: { equals: 'ALL' } }]
      if (eventIds.length) audience.push({ events: { in: eventIds } })
      return { and: [{ published: { equals: true } }, { or: audience }] } as Where
    },
    // Every CMS user reads announcements (participant-facing); writing them is per access role
    create: createAccess('announcements.create'),
    update: keyAccess('announcements.edit'),
    delete: keyAccess('announcements.delete'),
  },
  fields: [
    {
      name: 'title',
      type: 'text',
      required: true,
    },
    {
      name: 'body',
      type: 'textarea',
      required: true,
      admin: {
        description: 'Announcement bulletin text.',
      },
    },
    {
      name: 'audienceType',
      type: 'select',
      defaultValue: 'ALL',
      required: true,
      options: [
        { label: 'All Participants', value: 'ALL' },
        { label: 'Specific Events Only', value: 'EVENT' },
      ],
      admin: {
        description: 'Whether this bulletin applies to all participants or only registered teams of selected events.',
      },
    },
    {
      name: 'events',
      type: 'relationship',
      relationTo: 'events',
      hasMany: true,
      admin: {
        condition: (data) => data?.audienceType === 'EVENT',
        description: 'Target events if audience is restricted.',
      },
    },
    {
      name: 'publishedAt',
      type: 'date',
      required: true,
      defaultValue: () => new Date().toISOString(),
      admin: {
        date: {
          pickerAppearance: 'dayAndTime',
        },
      },
    },
    {
      name: 'published',
      type: 'checkbox',
      defaultValue: false,
      admin: {
        description: 'Only published announcements appear in the participant portal.',
      },
    },
    {
      name: 'pinned',
      type: 'checkbox',
      defaultValue: false,
      admin: {
        description: 'Pinned bulletins appear at the top of the announcements list.',
      },
    },
  ],
}
