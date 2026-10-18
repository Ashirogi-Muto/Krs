import React from 'react'
import { getAdvertisedCoupon, siteOfferFor } from '@/lib/offers'
import { getEventLabels } from '@/lib/event-labels'
import { fill } from '@/lib/form-texts-defaults'
import { formatINR } from '@/lib/format'
import { getAllEvents, withoutHiddenEvents } from '@/lib/data/events'
import { OfferTicker } from '@/components/aurix/OfferTicker'

/**
 * The running coupon strip for pages that are not one competition (AURIX home, Competitions). Same wording as the event
 * pages. A coupon for one competition names it and links to its page, and only while its registration is open.
 */
export async function SiteOfferTicker() {
  const [ad, L] = await Promise.all([getAdvertisedCoupon(), getEventLabels()])
  const offer = siteOfferFor(ad)
  if (!offer) return null
  const headline = offer.percent ? fill(L.offerHeadlinePercent, { percent: offer.percent }) : fill(L.offerHeadlineAmount, { amount: formatINR(offer.amount || 0) })
  if (!offer.onlyEvent) return <OfferTicker code={offer.code} text={fill(L.tickerText, { headline })} after={L.tickerAfter} />
  const event = (await withoutHiddenEvents(await getAllEvents())).find((e) => String(e.id) === offer.onlyEvent)
  if (!event || event.comingSoon || event.status !== 'REGISTRATION_OPEN') return null
  return <OfferTicker code={offer.code} text={fill(L.tickerTextOne, { headline, event: event.title })} after={L.tickerAfter} href={`/aurix/${event.slug}`} />
}
