import { checkApply, type CouponLike } from './coupon-rules'

/** The registration offer on the competition pages: pure rule (lib/offers.ts loads the coupon; tests/aurix-promo.test.ts). */
export type AdvertisedCoupon = CouponLike & { code: string }
export type Offer = { code: string; percent: number | null; discount: number; final: number; expiresAt: string | null }

/**
 * The offer for one competition, or null when the coupon would not work there now. `percent` is set only when the
 * team really gets exactly that % (a capped coupon is shown as its ₹ discount instead, never overstated).
 */
export function offerFor(ad: { coupon: AdvertisedCoupon; uses: number } | null, event: { id: unknown; registrationFee: number | null }, now = new Date()): Offer | null {
  if (!ad || event.registrationFee === null || event.registrationFee === undefined) return null
  const fee = Number(event.registrationFee)
  const check = checkApply(ad.coupon, event.id, fee, ad.uses, now)
  if (!check.ok) return null
  const pct = ad.coupon.type === 'PERCENT' ? Number(ad.coupon.percent || 0) : 0
  const exact = pct > 0 && check.discount === Math.round((fee * pct) / 100)
  return { code: ad.coupon.code, percent: exact ? pct : null, discount: check.discount, final: check.final, expiresAt: ad.coupon.expiresAt || null }
}
