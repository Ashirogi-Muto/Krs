'use client'

import React from 'react'
import { Ticket } from 'lucide-react'

/** Scrolling "coupon is live" strip. The server only renders it while the coupon is valid. */
export function OfferTicker({ code, headline }: { code: string; headline: string }) {
  const item = (
    <span className="inline-flex items-center gap-3 px-8 text-xs sm:text-sm font-mono font-bold uppercase tracking-wider text-black">
      <Ticket className="w-4 h-4" />
      Coupon live: {headline} with code
      <span className="px-2 py-0.5 rounded bg-black text-aurix-gold">{code}</span>
      <span className="opacity-60">•</span> Limited time
      <span className="opacity-60">•</span>
    </span>
  )
  return (
    <div className="overflow-hidden bg-gradient-to-r from-aurix-orange via-aurix-gold to-aurix-orange py-2" role="status">
      <div className="aurix-marquee flex w-max whitespace-nowrap">
        {[0, 1, 2, 3].map((i) => (
          <React.Fragment key={i}>{item}</React.Fragment>
        ))}
      </div>
    </div>
  )
}
