'use client'

import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'

/**
 * Premium motion for the hackathon page, kept cheap for phones and laptops: a scroll progress bar (one transform per
 * frame) and a cursor spotlight on cards (fine pointers only, so touch devices skip it).
 */
export function HackathonFx() {
  const bar = useRef<HTMLDivElement>(null)
  const [ready, setReady] = useState(false)
  useEffect(() => setReady(true), [])

  useEffect(() => {
    if (!ready) return
    let raf = 0
    const update = () => {
      raf = 0
      const h = document.documentElement
      const max = h.scrollHeight - h.clientHeight
      if (bar.current) bar.current.style.transform = `scaleX(${max > 0 ? Math.min(h.scrollTop / max, 1) : 0})`
    }
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(update)
    }
    update()
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', onScroll)

    const fine = window.matchMedia('(hover: hover) and (pointer: fine)').matches
    let move: ((e: PointerEvent) => void) | null = null
    if (fine) {
      move = (e) => {
        const card = (e.target as HTMLElement | null)?.closest?.('.aurix-fx .aurix-card') as HTMLElement | null
        if (!card) return
        const r = card.getBoundingClientRect()
        card.style.setProperty('--mx', `${e.clientX - r.left}px`)
        card.style.setProperty('--my', `${e.clientY - r.top}px`)
        card.style.setProperty('--rx', `${(0.5 - (e.clientY - r.top) / r.height) * 5}deg`)
        card.style.setProperty('--ry', `${((e.clientX - r.left) / r.width - 0.5) * 6}deg`)
      }
      document.addEventListener('pointermove', move, { passive: true })
    }
    return () => {
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', onScroll)
      if (move) document.removeEventListener('pointermove', move)
      if (raf) cancelAnimationFrame(raf)
    }
  }, [ready])

  // Portal to <body>: a transformed ancestor would otherwise make `fixed` relative to it, not the screen
  if (!ready) return null
  return createPortal(
    <div className="fixed inset-x-0 top-0 z-[200] h-[3px] pointer-events-none" aria-hidden="true">
      <div ref={bar} className="h-full origin-left bg-gradient-to-r from-aurix-orange via-aurix-gold to-aurix-orange" style={{ transform: 'scaleX(0)' }} />
    </div>,
    document.body,
  )
}
