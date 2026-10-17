'use client'

import React, { useEffect, useRef, useState } from 'react'

/** Rupee amount that counts up once when it scrolls into view (final value is server-rendered for SEO and no-JS). */
export function PrizeCounter({ value, className = '' }: { value: number; className?: string }) {
  const ref = useRef<HTMLParagraphElement>(null)
  const [shown, setShown] = useState(value)

  useEffect(() => {
    const el = ref.current
    // No observer (old browser) or less motion wanted: keep the server-rendered final amount, never a stuck ₹0
    if (!el || typeof IntersectionObserver === 'undefined' || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    setShown(0)
    let raf = 0
    const run = () => {
      const start = performance.now()
      const tick = (now: number) => {
        const p = Math.min((now - start) / 1800, 1)
        setShown(Math.round(value * (1 - Math.pow(1 - p, 4))))
        if (p < 1) raf = requestAnimationFrame(tick)
      }
      raf = requestAnimationFrame(tick)
    }
    const io = new IntersectionObserver(([en]) => {
      if (en.isIntersecting) {
        io.disconnect()
        run()
      }
    }, { threshold: 0.4 })
    io.observe(el)
    return () => {
      io.disconnect()
      cancelAnimationFrame(raf)
    }
  }, [value])

  return (
    <p ref={ref} className={className} aria-label={`₹${value.toLocaleString('en-IN')}`}>
      <span aria-hidden="true">₹{shown.toLocaleString('en-IN')}</span>
    </p>
  )
}
