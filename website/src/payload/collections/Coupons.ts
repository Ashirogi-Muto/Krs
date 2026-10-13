import { APIError, type CollectionConfig } from 'payload'
import { isAdmin } from '../access/roles'
import { can, grantOf } from '../access/permissions'
import { COUPON_DELETE_KEYS, COUPON_EDIT_KEYS, COUPON_READ_KEYS, canOnCoupon, couponAccess, couponLimitFor, grantCovers } from '../access/coupons'
import { COUPON_CODE_RE, couponEventIds, couponState, maxDiscountOf, maxPercentOf, normalizeCode } from '../../lib/coupon-rules'
import { logger } from '../../lib/logger'

/**
 * Discount coupons (owner, 13 Oct 2026). Teams apply one on the checkout step (/aurix/pay/<code>) before going to the
 * payment page; the discount lowers the registration's amount due, so payment matching expects the discounted amount.
 * Who may do what: CMS → Accounts → Access roles → Coupons (admins: everything). Staff stay within their coupon limit
 * (AURIX → Coupon limits, the person's and their role's limit). Wording of refusals: Staff & admin texts → Coupons.
 */
const texts = async (req: any) => {
  const { getStaffTexts } = await import('../../lib/staff-texts')
  return (await getStaffTexts(req.payload)).coupons
}
const fill = (t: string, v: Record<string, string | number>) => t.replace(/\{(\w+)\}/g, (m, k) => (k in v ? String(v[k]) : m))
const refuse = (message: string) => new APIError(message, 403, undefined, true)
const invalid = (message: string) => new APIError(message, 400, undefined, true)

/** Active teams (pending or confirmed) using each coupon. */
export async function couponUses(payload: any, ids: (number | string)[], req?: any): Promise<Map<string, number>> {
  const out = new Map<string, number>()
  if (!ids.length) return out
  const { docs } = await payload.find({
    collection: 'event-registrations',
    where: { and: [{ coupon: { in: ids } }, { status: { in: ['PENDING', 'CONFIRMED'] } }] },
    depth: 0,
    limit: 5000,
    pagination: false,
    overrideAccess: true,
    select: { coupon: true },
    ...(req ? { req } : {}),
  })
  for (const r of docs as any[]) {
    const id = String(typeof r.coupon === 'object' ? r.coupon?.id : r.coupon)
    out.set(id, (out.get(id) || 0) + 1)
  }
  return out
}

/** The teams that applied a coupon (any status), for "See which teams used a coupon". */
export async function couponTeams(payload: any, id: number | string, req?: any) {
  const { docs } = await payload.find({
    collection: 'event-registrations',
    where: { coupon: { equals: id } },
    depth: 1,
    limit: 500,
    pagination: false,
    overrideAccess: true,
    select: { registrationCode: true, teamName: true, event: true, status: true, paymentStatus: true, discountAmount: true, amountDue: true, couponAppliedAt: true },
    ...(req ? { req } : {}),
  })
  return (docs as any[]).map((r) => ({
    code: r.registrationCode,
    team: r.teamName,
    event: typeof r.event === 'object' ? r.event?.title : r.event,
    status: r.status,
    payment: r.paymentStatus,
    discount: r.discountAmount ?? null,
    pays: r.amountDue ?? null,
    appliedAt: r.couponAppliedAt ?? null,
  }))
}

export const Coupons: CollectionConfig = {
  slug: 'coupons',
  labels: { singular: 'Coupon', plural: 'Coupons' },
  admin: {
    group: 'AURIX',
    useAsTitle: 'code',
    defaultColumns: ['code', 'state', 'type', 'percent', 'amount', 'uses', 'usageLimit', 'expiresAt'],
    listSearchableFields: ['code', 'note'],
    description:
      'Discount codes teams enter on the payment step before they pay. Status shows whether a code works right now. Teams that already applied a coupon keep their discount when it is changed, switched off or deleted.',
    hidden: ({ user }) => !COUPON_READ_KEYS.some((k) => can(user as any, k)),
  },
  access: {
    read: couponAccess(COUPON_READ_KEYS),
    create: ({ req: { user } }) => can(user as any, 'coupons.create'),
    update: couponAccess(COUPON_EDIT_KEYS),
    delete: couponAccess(COUPON_DELETE_KEYS),
  },
  hooks: {
    beforeValidate: [
      ({ data }) => {
        if (data && 'code' in data) data.code = normalizeCode(data.code)
        return data
      },
    ],
    beforeChange: [
      async ({ data, originalDoc, operation, req }) => {
        const T = await texts(req)
        const merged: any = { ...(originalDoc || {}), ...(data || {}) }
        if (!COUPON_CODE_RE.test(String(merged.code || ''))) throw invalid(T.errCode)
        if (merged.type === 'PERCENT') {
          const p = Number(merged.percent)
          if (!Number.isInteger(p) || p < 1 || p > 99) throw invalid(T.errPercent)
          if (data) data.amount = null
        } else if (merged.type === 'FLAT') {
          const a = Number(merged.amount)
          if (!Number.isInteger(a) || a < 1) throw invalid(T.errFlat)
          if (data) data.percent = null
        } else throw invalid(T.errType)
        if (merged.usageLimit !== null && merged.usageLimit !== undefined && merged.usageLimit !== '' && (!Number.isInteger(Number(merged.usageLimit)) || Number(merged.usageLimit) < 1)) throw invalid(T.errUsage)
        if (merged.startsAt && merged.expiresAt && new Date(merged.startsAt).getTime() >= new Date(merged.expiresAt).getTime()) throw invalid(T.errDates)

        const user = req.user as any
        if (!user) return data // server code
        if (!isAdmin(user)) {
          // Competitions: only those the person's role covers for this action (a coupon for every competition needs
          // the key for all events); "…own" edits only on coupons they created
          const key = operation === 'create' ? 'coupons.create' : null
          const events = couponEventIds(merged)
          const allowed =
            operation === 'create'
              ? grantCovers(grantOf(user, key!), events)
              : COUPON_EDIT_KEYS.some((k) => canOnCoupon(user, k, { ...merged, createdBy: originalDoc?.createdBy }))
          if (!allowed) throw refuse(T.errEvents)
          // Limit: the largest discount one team can get, against the most expensive competition the coupon covers
          const limit = await couponLimitFor(req)
          if (limit === 'NO_SITE_LIMIT') throw refuse(T.errNoSiteLimit)
          const { docs: evs } = await req.payload.find({ collection: 'events', depth: 0, limit: 200, pagination: false, overrideAccess: true, select: { registrationFee: true }, req })
          const fees = new Map((evs as any[]).map((e) => [String(e.id), Number(e.registrationFee) || 0]))
          const max = maxDiscountOf(merged, fees)
          if (limit && limit.amount !== null && max > limit.amount) throw refuse(fill(T.errOverLimit, { max, limit: limit.amount }))
          const pct = maxPercentOf(merged, fees)
          if (limit && limit.percent !== null && pct > limit.percent + 1e-9) throw refuse(fill(T.errOverPercent, { max: Math.ceil(pct), percent: limit.percent }))
          // Never more than the limit in force now, even if a fee changes later
          if (data) {
            data.discountCap = limit ? limit.amount : null
            data.percentCap = limit ? limit.percent : null
          }
        } else if (data) {
          data.discountCap = null
          data.percentCap = null
        }
        if (operation === 'create' && data) data.createdBy = user.id
        return data
      },
    ],
    afterRead: [
      // List/edit screen: how many active teams use it, and whether it works right now
      async ({ doc, req, context }) => {
        if (!doc?.id) return doc
        const cache = ((context as any).couponUses ||= new Map<string, Promise<Map<string, number>>>()) as Map<string, Promise<Map<string, number>>>
        let uses = cache.get(String(doc.id))
        if (!uses) {
          uses = couponUses(req.payload, [doc.id], req)
          cache.set(String(doc.id), uses)
        }
        const n = (await uses).get(String(doc.id)) || 0
        const T = await texts(req)
        const state = couponState(doc, n)
        const usedByTeams = canOnCoupon(req.user as any, 'coupons.usage', doc) ? await couponTeams(req.payload, doc.id, req) : undefined
        return {
          ...doc,
          uses: n,
          ...(usedByTeams ? { usedByTeams } : {}),
          state: ({ ACTIVE: T.stateActive, OFF: T.stateOff, NOT_STARTED: T.stateNotStarted, EXPIRED: T.stateExpired, USED_UP: T.stateUsedUp } as const)[state],
        }
      },
    ],
    afterChange: [
      ({ doc, previousDoc, operation, req }) => {
        logger.audit(String((req.user as any)?.email || 'system'), operation === 'create' ? 'COUPON_CREATED' : 'COUPON_UPDATED', 'Coupon', `${doc.id}:${doc.code}`, {
          type: doc.type,
          percent: doc.percent ?? null,
          amount: doc.amount ?? null,
          active: doc.active,
          usageLimit: doc.usageLimit ?? null,
          startsAt: doc.startsAt ?? null,
          expiresAt: doc.expiresAt ?? null,
          events: couponEventIds(doc),
          before: previousDoc?.id ? { type: previousDoc.type, percent: previousDoc.percent ?? null, amount: previousDoc.amount ?? null, active: previousDoc.active } : null,
        })
      },
    ],
    afterDelete: [({ doc, req }) => logger.audit(String((req.user as any)?.email || 'system'), 'COUPON_DELETED', 'Coupon', `${doc.id}:${doc.code}`)],
  },
  fields: [
    {
      type: 'row',
      fields: [
        {
          name: 'code',
          type: 'text',
          required: true,
          unique: true,
          index: true,
          admin: { description: '3–30 letters, digits or dashes (e.g. IILM-50). Teams type it in any case.' },
        },
        { name: 'active', type: 'checkbox', defaultValue: true, label: 'Active (untick to stop new uses)' },
      ],
    },
    {
      type: 'row',
      fields: [
        {
          name: 'type',
          type: 'select',
          required: true,
          defaultValue: 'PERCENT',
          options: [
            { label: 'Percentage off', value: 'PERCENT' },
            { label: 'Flat amount off (₹)', value: 'FLAT' },
          ],
        },
        { name: 'percent', label: 'Percentage off (1–99)', type: 'number', min: 1, max: 99, admin: { condition: (d: any) => d?.type === 'PERCENT' } },
        { name: 'amount', label: 'Amount off (₹)', type: 'number', min: 1, admin: { condition: (d: any) => d?.type === 'FLAT' } },
      ],
    },
    { type: 'ui', name: 'limitNote', admin: { components: { Field: '@/payload/components/CouponLimitNote#CouponLimitNote' } } },
    {
      type: 'collapsible',
      label: 'Optional controls',
      admin: { initCollapsed: false },
      fields: [
        {
          type: 'row',
          fields: [
            { name: 'startsAt', label: 'Valid from (empty = now)', type: 'date', admin: { date: { pickerAppearance: 'dayAndTime', timeFormat: 'HH:mm' } } },
            { name: 'expiresAt', label: 'Expires at (empty = never)', type: 'date', admin: { date: { pickerAppearance: 'dayAndTime', timeFormat: 'HH:mm' } } },
            { name: 'usageLimit', label: 'Usage limit (teams; empty = no limit)', type: 'number', min: 1 },
          ],
        },
        {
          name: 'events',
          label: 'Only for these competitions (empty = every competition)',
          type: 'relationship',
          relationTo: 'events',
          hasMany: true,
        },
      ],
    },
    { name: 'note', type: 'textarea', label: 'Note (staff only)', admin: { description: 'e.g. who it is for.' } },
    // List columns (computed when read; never stored)
    { name: 'state', label: 'Status', type: 'text', virtual: true, admin: { readOnly: true, position: 'sidebar' } },
    { name: 'uses', label: 'Used by (active teams)', type: 'number', virtual: true, admin: { readOnly: true, position: 'sidebar' } },
    {
      name: 'percentCap',
      label: 'Largest discount per team (% of the fee)',
      type: 'number',
      access: { create: () => false, update: () => false },
      admin: { readOnly: true, position: 'sidebar', description: 'From the site-wide % limit when a team member made or last changed it. Empty = no % limit / made by an admin.' },
    },
    {
      name: 'discountCap',
      label: 'Largest discount per team (₹)',
      type: 'number',
      access: { create: () => false, update: () => false },
      admin: { readOnly: true, position: 'sidebar', description: 'Set from the coupon limit of the team member who made or last changed it. Empty = made by an admin.' },
    },
    { name: 'createdBy', type: 'relationship', relationTo: 'users', access: { create: () => false, update: () => false }, admin: { readOnly: true, position: 'sidebar' } },
    // Teams that applied it (owner: "see which teams used a coupon"): built on the server for people holding that
    // permission for this coupon, whatever their access to registrations (a join field would need both)
    { name: 'usedByTeams', type: 'json', virtual: true, admin: { hidden: true } },
    { type: 'ui', name: 'usageTable', admin: { components: { Field: '@/payload/components/CouponUsage#CouponUsage' } } },
  ],
}
