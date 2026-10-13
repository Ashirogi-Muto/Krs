import type { Access, PayloadRequest } from 'payload'
import { grantOf, isAdminUser, rolesOf, type Grant } from './permissions'
import { couponEventIds, couponLimit, type CouponLike, type Limit } from '../../lib/coupon-rules'

/**
 * Coupons (owner, 13 Oct 2026): fine-grained access from the access roles. Every coupon key is limited by events: a
 * role for chosen competitions covers only coupons that are valid for those competitions alone (a coupon for every
 * competition needs the key for all events). "…Own" keys cover only the coupons the person created.
 */
type MaybeUser = Record<string, any> | null | undefined
export type CouponKey = 'coupons.view' | 'coupons.create' | 'coupons.edit' | 'coupons.editOwn' | 'coupons.delete' | 'coupons.deleteOwn' | 'coupons.usage'
export const COUPON_EDIT_KEYS: CouponKey[] = ['coupons.edit', 'coupons.editOwn']
export const COUPON_DELETE_KEYS: CouponKey[] = ['coupons.delete', 'coupons.deleteOwn']
export const COUPON_READ_KEYS: CouponKey[] = ['coupons.view', 'coupons.create', ...COUPON_EDIT_KEYS, ...COUPON_DELETE_KEYS, 'coupons.usage']
const OWN = new Set<CouponKey>(['coupons.editOwn', 'coupons.deleteOwn'])

const idOf = (v: unknown): string | null => (v && typeof v === 'object' ? idOf((v as any).id ?? (v as any).value) : v === null || v === undefined ? null : String(v))

/** Does a grant cover a coupon limited to `eventIds` (empty = every competition)? */
export const grantCovers = (g: Grant | null, eventIds: string[]) => Boolean(g && (g.all || (eventIds.length > 0 && eventIds.every((id) => g.ids.has(id)))))

/** May `user` use `key` on this coupon (events and, for "…Own" keys, its creator)? */
export function canOnCoupon(user: MaybeUser, key: CouponKey, coupon: CouponLike & { createdBy?: unknown }): boolean {
  if (isAdminUser(user)) return grantOf(user, key) !== null
  if (!grantCovers(grantOf(user, key), couponEventIds(coupon))) return false
  return !OWN.has(key) || (coupon.createdBy !== undefined && idOf(coupon.createdBy) === String(user?.id))
}

/** Collection access for any of `keys`: true for unlimited grants, else the ids of the coupons covered. */
export const couponAccess =
  (keys: CouponKey[]): Access =>
  async ({ req }) => {
    const user = req.user as MaybeUser
    if (!user) return false
    if (isAdminUser(user)) return true
    const held = keys.filter((k) => grantOf(user, k))
    if (!held.length) return false
    if (held.some((k) => grantOf(user, k)?.all && !OWN.has(k))) return true
    const { docs } = await req.payload.find({ collection: 'coupons' as any, depth: 0, limit: 2000, pagination: false, overrideAccess: true, select: { events: true, createdBy: true } as any, req })
    const ids = (docs as any[]).filter((c) => held.some((k) => canOnCoupon(user, k, c))).map((c) => c.id)
    return { id: { in: ids.length ? ids : [-1] } }
  }

/** The coupon limit of the person making or changing a coupon: ₹ and/or % per team, null = none (admins), or no site limit yet. */
export async function couponLimitFor(req: PayloadRequest): Promise<Limit | null | 'NO_SITE_LIMIT'> {
  const user = req.user as MaybeUser
  const admin = isAdminUser(user)
  if (admin) return null
  const settings: any = await req.payload.findGlobal({ slug: 'coupon-settings' as any, depth: 0, overrideAccess: true, req }).catch(() => null)
  const roles = rolesOf(user)
    .filter((r) => Array.isArray(r.permissions) && (r.permissions as string[]).some((k) => k === 'coupons.create' || COUPON_EDIT_KEYS.includes(k as CouponKey)))
    .map((r) => (r as any).couponMaxDiscount)
  return couponLimit({ isAdmin: false, site: Number(settings?.maxDiscount) || null, sitePercent: Number(settings?.maxPercent) || null, person: user?.couponMaxDiscount ?? null, roles })
}
