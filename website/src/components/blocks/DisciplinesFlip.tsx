'use client'

import React, { useState } from 'react'

/** One flip card: hover (wide screens), click, Enter or Space turns it over. Both faces are rendered by the server. */
export function FlipCard({ front, back, tilt, attrs }: { front: React.ReactNode; back: React.ReactNode; tilt: string; attrs?: Record<string, string> }) {
  const [flipped, setFlipped] = useState(false)
  return (
    <div className={`group perspective-1000 transition-transform duration-500 ${tilt}`} {...attrs}>
      <div
        role="button"
        tabIndex={0}
        aria-pressed={flipped}
        onClick={(e) => {
          // a click on the link on the back follows the link
          if (!(e.target as HTMLElement).closest('a')) setFlipped((f) => !f)
        }}
        onKeyDown={(e) => {
          if (e.target !== e.currentTarget) return
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault()
            setFlipped((f) => !f)
          }
        }}
        className={`relative w-full min-h-[440px] sm:min-h-[460px] cursor-pointer flip-card-inner rounded-t-lg focus-visible:outline focus-visible:outline-2 focus-visible:outline-krs-cyan ${
          flipped ? 'flip-card-is-flipped' : 'flip-card-hover-flip'
        }`}
      >
        <div className="absolute inset-0 backface-hidden" aria-hidden={flipped}>
          {front}
        </div>
        <div className="absolute inset-0 rotate-y-180 backface-hidden flip-card-back" aria-hidden={!flipped}>
          {back}
        </div>
      </div>
    </div>
  )
}
