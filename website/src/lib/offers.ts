import { cache } from 'react'
import { getPayload } from 'payload'
import config from '@payload-config'
import type { AdvertisedCoupon } from './offer-rules'
import { logger } from './logger'

/**
 * The registration offer on the competition pages (owner, 17 Oct 2026: "AURIX20, 20% off"): the coupon chosen in
 * AURIX → Coupon limits → "Coupon shown on the competition pages". It is shown only where checkout would accept it right
 * now (same rules: active, started, not expired, not used up, covers this competition), so it disappears by itself.
 */
export { offerFor, type AdvertisedCoupon, type Offer } from './offer-rules'

/** The advertised coupon and how many active teams use it (null = none chosen or unavailable). Once per request. */
export const getAdvertisedCoupon = cache(async (): Promise<{ coupon: AdvertisedCoupon; uses: number } | null> => {
  try {
    const payload = await getPayload({ config })
    const settings: any = await payload.findGlobal({ slug: 'coupon-settings', depth: 0, overrideAccess: true })
    const id = typeof settings?.advertisedCoupon === 'object' ? settings?.advertisedCoupon?.id : settings?.advertisedCoupon
    if (!id) return null
    const c: any = await payload.findByID({ collection: 'coupons', id, depth: 0, overrideAccess: true }).catch(() => null)
    if (!c?.code) return null
    const { totalDocs } = await payload.count({
      collection: 'event-registrations',
      where: { and: [{ coupon: { equals: c.id } }, { status: { in: ['PENDING', 'CONFIRMED'] } }] },
      overrideAccess: true,
    })
    return {
      coupon: {
        id: c.id,
        code: String(c.code),
        active: c.active,
        type: c.type,
        percent: c.percent ?? null,
        amount: c.amount ?? null,
        startsAt: c.startsAt ?? null,
        expiresAt: c.expiresAt ?? null,
        usageLimit: c.usageLimit ?? null,
        events: c.events,
        discountCap: c.discountCap ?? null,
        percentCap: c.percentCap ?? null,
      },
      uses: totalDocs,
    }
  } catch (err: any) {
    logger.warn(`Advertised coupon unavailable: ${err?.message || err}`)
    return null
  }
})
