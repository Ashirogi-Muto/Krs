import type { Access, CollectionConfig, FieldHook } from 'payload'
import { CONTENT_EDITORS, hasRole, hiddenUnless } from '../access/roles'

const SITE = () => (process.env.NEXT_PUBLIC_SITE_URL || 'https://kalamroboticssociety.com').replace(/\/$/, '')

/** Display-only: the public short URL for this link. */
const shortUrlHook: FieldHook = ({ data }) =>
  data?.slug ? `https://go.kalamroboticssociety.com/${data.slug}` : ''

/** Display-only: where this link sends people right now (mirrors lib/shortLinks.ts). */
const resolvesToHook: FieldHook = async ({ data, req }) => {
  if (!data) return ''
  if (data.active === false) return `(disabled) → ${SITE()}/aurix`
  if (data.destinationType === 'EVENT' && data.event) {
    const id = typeof data.event === 'object' ? data.event.id : data.event
    const event: any =
      typeof data.event === 'object' && data.event.slug
        ? data.event
        : await req.payload.findByID({ collection: 'events', id, depth: 0, overrideAccess: true, req }).catch(() => null)
    if (!event?.slug) return `${SITE()}/aurix (event not found)`
    return data.eventTarget === 'REGISTER'
      ? `${SITE()}/aurix/register?event=${event.slug}`
      : `${SITE()}/aurix/${event.slug}`
  }
  if (data.destinationType === 'PATH' && typeof data.path === 'string' && data.path.startsWith('/')) return `${SITE()}${data.path}`
  if (data.destinationType === 'URL' && typeof data.url === 'string' && /^https?:\/\//i.test(data.url)) return data.url
  return `${SITE()}/aurix (destination incomplete)`
}

// Admins and Media & outreach manage short links
const isStaff: Access = ({ req: { user } }) => hasRole(user, CONTENT_EDITORS)

/**
 * Permanent short links: go.kalamroboticssociety.com/<slug> (and /go/<slug> on the main site).
 * Point a link at an event (it follows the event even if the event's URL changes), a site page,
 * or any external URL. Redirects are temporary (302), so edits take effect immediately.
 */
export const ShortLinks: CollectionConfig = {
  slug: 'short-links',
  labels: { singular: 'Short link', plural: 'Short links' },
  admin: {
    useAsTitle: 'slug',
    defaultColumns: ['slug', 'shortUrl', 'resolvesTo', 'active', 'clicks'],
    listSearchableFields: ['slug', 'url', 'path', 'notes'],
    hidden: hiddenUnless(CONTENT_EDITORS),
    description:
      'Permanent short links (https://go.kalamroboticssociety.com/<slug>). To send a link somewhere else, change its Destination: pick an event, a page on this site, or paste any URL. Changes apply immediately.',
  },
  access: {
    read: isStaff,
    create: isStaff,
    update: isStaff,
    delete: isStaff,
  },
  fields: [
    {
      name: 'shortUrl',
      label: 'Short URL',
      type: 'text',
      virtual: true,
      admin: { readOnly: true, description: 'Share/print this link.' },
      hooks: { afterRead: [shortUrlHook] },
    },
    {
      name: 'resolvesTo',
      label: 'Currently redirects to',
      type: 'text',
      virtual: true,
      admin: { readOnly: true, description: 'Updates after you save.' },
      hooks: { afterRead: [resolvesToHook] },
    },
    {
      name: 'slug',
      type: 'text',
      required: true,
      unique: true,
      index: true,
      admin: { description: 'Lowercase letters, numbers and dashes, e.g. "soccer" or "soccer-register".' },
      validate: (value: unknown) =>
        typeof value === 'string' && /^[a-z0-9]+(-[a-z0-9]+)*$/.test(value)
          ? true
          : 'Use lowercase letters, numbers and single dashes only.',
    },
    {
      name: 'destinationType',
      type: 'select',
      required: true,
      defaultValue: 'EVENT',
      label: 'Destination',
      admin: {
        description:
          'Event: follows the event even if its page address changes. Page on this site: e.g. /aurix/register. Any URL: paste a full link (Google Form, Drive, Instagram, or any page).',
      },
      options: [
        { label: 'Event page', value: 'EVENT' },
        { label: 'Page on this site', value: 'PATH' },
        { label: 'Any URL', value: 'URL' },
      ],
    },
    {
      name: 'event',
      type: 'relationship',
      relationTo: 'events',
      admin: { condition: (data) => data?.destinationType === 'EVENT' },
    },
    {
      name: 'eventTarget',
      type: 'select',
      defaultValue: 'DETAILS',
      options: [
        { label: 'Event details page', value: 'DETAILS' },
        { label: 'Registration form for this event', value: 'REGISTER' },
      ],
      admin: { condition: (data) => data?.destinationType === 'EVENT' },
    },
    {
      name: 'path',
      type: 'text',
      admin: {
        description: 'Path on this site starting with "/", e.g. /aurix or /aurix/register',
        condition: (data) => data?.destinationType === 'PATH',
      },
    },
    {
      name: 'url',
      type: 'text',
      admin: {
        description: 'Full address starting with https://',
        condition: (data) => data?.destinationType === 'URL',
      },
    },
    { name: 'active', type: 'checkbox', defaultValue: true },
    { name: 'notes', type: 'textarea' },
    { name: 'clicks', type: 'number', defaultValue: 0, admin: { readOnly: true } },
  ],
}
