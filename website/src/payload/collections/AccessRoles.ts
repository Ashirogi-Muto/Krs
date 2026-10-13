import { APIError, type Access, type CollectionConfig, type Where } from 'payload'
import { isAdmin, isSuperAdmin } from '../access/roles'
import {
  ADMIN_GRANTED_ONLY,
  CATALOGUE,
  DOC_LIMIT_COLLECTIONS,
  ITEMS,
  KEYS,
  can,
  roleWithin,
  superGrantedKey,
  type RoleDoc,
} from '../access/permissions'
import { logger } from '../../lib/logger'

/**
 * Access roles (owner, 8 Oct 2026; docs/ACCESS_ROLES_PLAN.md): what team members may see and do in the CMS.
 * A person's rights = the union of the roles listing them under "People with this role". Managed by admins and by
 * team leads (accounts holding "Manage access roles"), who may only grant what they hold themselves, never
 * "Manage access roles", never to themselves and never on a role they hold. Roles holding a Super Admin key
 * (SUPER_GRANTED_ONLY, permanent deletions) are created, edited and staffed by the Super Admin only. Every change goes
 * to the audit log.
 */
const managers: Access = ({ req: { user } }) => isAdmin(user as any) || can(user as any, 'accessRoles.manage')

const idOf = (v: unknown): string | null => (v && typeof v === 'object' ? idOf((v as any).value ?? (v as any).id) : v === null || v === undefined ? null : String(v))
const ids = (v: unknown) => (Array.isArray(v) ? v.map(idOf).filter((x): x is string => Boolean(x)) : [])
const keysOf = (v: unknown) => (Array.isArray(v) ? v.map(String) : [])

const COLLECTION_LABELS: Record<string, string> = Object.fromEntries(
  CATALOGUE.flatMap((s) => s.items.filter((i) => i.collection).map((i) => [i.collection!, s.label])),
)

const texts = async (req: any) => {
  const { getStaffTexts } = await import('../../lib/staff-texts')
  return (await getStaffTexts(req.payload)).accessRoles
}
const fill = (t: string, v: Record<string, string>) => t.replace(/\{(\w+)\}/g, (m, k) => (k in v ? v[k] : m))
const refuse = (message: string) => new APIError(message, 403, undefined, true)
const keyLabel = (key: string) => {
  const section = CATALOGUE.find((s) => s.items.some((i) => i.key === key))
  return section ? `${section.label}: ${ITEMS[key].label}` : key
}

export const AccessRoles: CollectionConfig = {
  slug: 'access-roles',
  labels: { singular: 'Access role', plural: 'Access roles' },
  admin: {
    group: 'Accounts',
    useAsTitle: 'name',
    defaultColumns: ['name', 'description', 'eventLimit', 'updatedAt'],
    description:
      'What team members may see and do in the CMS. Tick the permissions, optionally limit them to some events or documents, and add the people. Changes apply on their next click.',
    hidden: ({ user }) => !(isAdmin(user as any) || can(user as any, 'accessRoles.manage')),
  },
  // What is loaded with a person's account on every request (no member lists)
  defaultPopulate: { name: true, permissions: true, eventLimit: true, events: true, limitedCollections: true, documents: true },
  access: { read: managers, create: managers, update: managers, delete: managers },
  hooks: {
    beforeChange: [
      async ({ data, originalDoc, operation, req }) => {
        const editor = req.user as any
        if (!editor) return data // server code (seeding, migrations)
        const T = await texts(req)
        const merged: RoleDoc & { members?: unknown; preset?: unknown } = { ...(originalDoc || {}), ...(data || {}) }
        const keys = keysOf(merged.permissions)
        const unknown = keys.filter((k) => !ITEMS[k])
        if (unknown.length) throw refuse(fill(T.errUnknown, { key: unknown[0] }))
        // "Create" can't be limited to chosen documents (a new document is outside the limit)
        const limited = keysOf(merged.limitedCollections)
        for (const k of keys) {
          const item = ITEMS[k]
          if (item.kind === 'create' && item.collection && limited.includes(item.collection)) {
            throw refuse(fill(T.errCreateLimited, { page: COLLECTION_LABELS[item.collection] || item.collection }))
          }
        }
        // A team lead never edits a role they hold (checked first: such a role lists them as a member)
        if (!isAdmin(editor) && operation === 'update' && ids(originalDoc?.members).includes(String(editor.id))) throw refuse(T.errOwnRole)
        // Only team member accounts get roles; nobody adds themselves
        const members = ids(merged.members)
        if (members.includes(String(editor.id))) throw refuse(T.errSelf)
        if (members.length) {
          const { docs } = await req.payload.find({
            collection: 'users',
            where: { and: [{ id: { in: members.map(Number) } }, { role: { not_equals: 'STAFF' } }] },
            limit: 1,
            depth: 0,
            overrideAccess: true,
            req,
          })
          if (docs.length) throw refuse(T.errNotTeam)
        }
        // The Super Admin's permanent-deletion keys: only the Super Admin creates, edits or staffs such a role
        if (!isSuperAdmin(editor)) {
          const key = superGrantedKey(merged) || superGrantedKey(originalDoc as RoleDoc)
          if (key) throw refuse(fill(T.errSuperOnly, { key: keyLabel(key) }))
        }
        if (!isAdmin(editor)) {
          if (data && 'preset' in data && Boolean(data.preset) !== Boolean(originalDoc?.preset)) throw refuse(T.errPreset)
          if (keys.some((k) => ADMIN_GRANTED_ONLY.has(k))) throw refuse(T.errAdminOnly)
          if (operation === 'update' && originalDoc) {
            // A role granting more than they hold is out of reach
            const before = roleWithin(editor, originalDoc as RoleDoc)
            if (!before.ok) throw refuse(fill(T.errNotWithin, { key: keyLabel(before.key) }))
          }
          const after = roleWithin(editor, merged)
          if (!after.ok) throw refuse(fill(ITEMS[after.key] && ADMIN_GRANTED_ONLY.has(after.key) ? T.errAdminOnly : T.errNotWithin, { key: keyLabel(after.key) }))
        }
        if (operation === 'create' && data) data.createdBy = editor.id
        return data
      },
    ],
    afterChange: [
      ({ doc, previousDoc, operation, req }) => {
        const actor = String((req.user as any)?.email || 'system')
        const before = keysOf(previousDoc?.permissions)
        const after = keysOf(doc.permissions)
        const m0 = ids(previousDoc?.members)
        const m1 = ids(doc.members)
        logger.audit(actor, operation === 'create' ? 'ACCESS_ROLE_CREATED' : 'ACCESS_ROLE_UPDATED', 'AccessRole', `${doc.id}:${doc.name}`, {
          added: after.filter((k) => !before.includes(k)),
          removed: before.filter((k) => !after.includes(k)),
          eventLimit: previousDoc?.eventLimit === doc.eventLimit ? doc.eventLimit : `${previousDoc?.eventLimit ?? '-'} -> ${doc.eventLimit}`,
          events: ids(doc.events),
          limitedCollections: keysOf(doc.limitedCollections),
          documents: (Array.isArray(doc.documents) ? doc.documents : []).map((d: any) => `${d?.relationTo}:${idOf(d)}`),
          membersAdded: m1.filter((x) => !m0.includes(x)),
          membersRemoved: m0.filter((x) => !m1.includes(x)),
        })
      },
    ],
    beforeDelete: [
      async ({ id, req }) => {
        const editor = req.user as any
        if (!editor || isAdmin(editor)) return
        const T = await texts(req)
        const role: any = await req.payload.findByID({ collection: 'access-roles', id, depth: 0, overrideAccess: true, req })
        if (ids(role?.members).includes(String(editor.id))) throw refuse(T.errOwnRole)
        const within = roleWithin(editor, role)
        if (!within.ok) throw refuse(fill(T.errNotWithin, { key: keyLabel(within.key) }))
        if (ids(role?.members).length) throw refuse(T.errInUse)
      },
    ],
  },
  fields: [
    { name: 'name', type: 'text', required: true, unique: true, maxLength: 80 },
    { name: 'description', type: 'textarea', maxLength: 500 },
    {
      name: 'permissions',
      type: 'select',
      hasMany: true,
      options: KEYS.map((k) => ({ label: keyLabel(k), value: k })),
      admin: { components: { Field: '@/payload/components/PermissionMatrix#PermissionMatrix' } },
    },
    {
      type: 'row',
      fields: [
        {
          name: 'eventLimit',
          label: 'Events these permissions apply to',
          type: 'select',
          defaultValue: 'all',
          required: true,
          options: [
            { label: 'All events', value: 'all' },
            { label: "The events assigned on each person's account", value: 'assigned' },
            { label: 'Only the events chosen here', value: 'chosen' },
          ],
          admin: { description: 'Registrations, student IDs, submissions, events, check-in, exports and dashboard panels.' },
        },
        {
          name: 'events',
          type: 'relationship',
          relationTo: 'events',
          hasMany: true,
          admin: { condition: (data: any) => data?.eventLimit === 'chosen' },
        },
      ],
    },
    {
      name: 'limitedCollections',
      label: 'Limit these pages to chosen documents',
      type: 'select',
      hasMany: true,
      options: DOC_LIMIT_COLLECTIONS.map((c) => ({ label: COLLECTION_LABELS[c] || c, value: c })),
      admin: { description: 'For each page picked here, the permissions apply only to the documents chosen below ("Create" is then not possible on it).' },
    },
    {
      name: 'documents',
      label: 'Chosen documents',
      type: 'relationship',
      relationTo: [...DOC_LIMIT_COLLECTIONS],
      hasMany: true,
      admin: { condition: (data: any) => Array.isArray(data?.limitedCollections) && data.limitedCollections.length > 0 },
    },
    {
      name: 'members',
      label: 'People with this role',
      type: 'relationship',
      relationTo: 'users',
      hasMany: true,
      // Team member accounts only, never yourself (also enforced on save)
      filterOptions: ({ user }) => ({ and: [{ role: { equals: 'STAFF' } }, { id: { not_equals: (user as any)?.id ?? 0 } }] }) as Where,
      admin: { description: 'Team member accounts that get these permissions.' },
    },
    {
      type: 'row',
      fields: [
        { name: 'preset', type: 'checkbox', defaultValue: false, admin: { readOnly: true, description: 'Created from one of the fixed roles used until 8 Oct 2026.' } },
        { name: 'createdBy', type: 'relationship', relationTo: 'users', admin: { readOnly: true } },
      ],
    },
  ],
}
