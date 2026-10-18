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
export { offerFor, siteOfferFor, type AdvertisedCoupon, type Offer, type SiteOffer } from './offer-rules'

/** The site-wide advertised coupon (AURIX → Coupon limits) and how many active teams use it. Once per request. */
export const getAdvertisedCoupon = cache(async (): Promise<{ coupon: AdvertisedCoupon; uses: number } | null> => {
  try {
    const payload = await getPayload({ config })
    const settings: any = await payload.findGlobal({ slug: 'coupon-settings', depth: 0, overrideAccess: true })
    const id = typeof settings?.advertisedCoupon === 'object' ? settings?.advertisedCoupon?.id : settings?.advertisedCoupon
    return id ? await loadCoupon(String(id)) : null
  } catch (err: any) {
    logger.warn(`Advertised coupon unavailable: ${err?.message || err}`)
    return null
  }
})

/**
 * The coupon a competition page advertises: its own (Events → "Coupon shown on this competition's page", owner, 18 Oct
 * 2026: the Hackathon shows SPECIAL50) or else the site-wide one.
 */
export async function getPageCoupon(pageCoupon?: string | null) {
  return pageCoupon ? loadCoupon(pageCoupon) : getAdvertisedCoupon()
}

/** One coupon and its active uses (null = missing). Once per request per coupon. */
const loadCoupon = cache(async (id: string): Promise<{ coupon: AdvertisedCoupon; uses: number } | null> => {
  try {
    const payload = await getPayload({ config })
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
