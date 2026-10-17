'use client'

import React, { useEffect, useState } from 'react'
import Link from 'next/link'
import { Check, Copy, Sparkles, X } from 'lucide-react'

const KEY = 'aurix-offer-popup-seen'

/** Wording of the pop-up (CMS: Event pages → Offer, contact & prize). */
export type OfferPopupWords = { badge: string; text: string; copy: string; copied: string; register: string; footer: string; label: string; close: string }

/** Premium coupon dialog, shown once per browser session shortly after the page opens. */
export function OfferPopup({ code, headline, registerHref, words }: { code: string; headline: string; registerHref: string; words: OfferPopupWords }) {
  const [open, setOpen] = useState(false)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    try {
      if (sessionStorage.getItem(KEY)) return
    } catch {}
    const t = setTimeout(() => setOpen(true), 1200)
    return () => clearTimeout(t)
  }, [])

  const close = () => {
    setOpen(false)
    try {
      sessionStorage.setItem(KEY, '1')
    } catch {}
  }
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && close()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open])

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(code)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {}
  }

  if (!open) return null
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 aurix-pop-fade" onClick={close}>
      <div className="absolute inset-0 bg-black/80" />
      <div
        role="dialog"
        aria-modal="true"
        aria-label={words.label}
        onClick={(e) => e.stopPropagation()}
        className="aurix-pop-card relative w-full max-w-md rounded-3xl p-px bg-gradient-to-br from-aurix-gold via-aurix-orange to-aurix-red shadow-[0_0_40px_-10px_rgba(249,115,22,0.5)]"
      >
        <div className="relative overflow-hidden rounded-[calc(1.5rem-1px)] bg-aurix-dark px-6 sm:px-8 py-10 text-center">
          <div className="pointer-events-none absolute -top-24 left-1/2 -translate-x-1/2 h-56 w-56 rounded-full bg-[radial-gradient(circle,rgba(249,115,22,0.3),transparent_70%)]" />
          <button onClick={close} aria-label={words.close} className="absolute top-4 right-4 p-1.5 rounded-full text-slate-400 hover:text-white hover:bg-white/10 transition-colors">
            <X className="w-5 h-5" />
          </button>
          <div className="relative space-y-5">
            <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-aurix-gold/40 bg-aurix-gold/10 text-aurix-gold text-[11px] font-mono font-bold uppercase tracking-[0.2em]">
              <Sparkles className="w-3.5 h-3.5" /> {words.badge}
            </span>
            <h2 className="font-display font-extrabold text-6xl sm:text-7xl leading-none bg-gradient-to-b from-white to-aurix-gold bg-clip-text text-transparent">
              {headline}
            </h2>
            <p className="text-slate-300 text-sm leading-relaxed">{words.text}</p>
            <button onClick={copy} className="w-full flex items-center justify-between gap-3 rounded-xl border border-dashed border-aurix-gold/60 bg-white/5 px-5 py-4 hover:bg-white/10 transition-colors">
              <span className="font-mono text-2xl font-bold tracking-[0.25em] text-white">{code}</span>
              <span className="inline-flex items-center gap-1.5 text-xs font-mono uppercase text-aurix-gold">
                {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                {copied ? words.copied : words.copy}
              </span>
            </button>
            <Link href={registerHref} onClick={close} className="block w-full rounded-xl bg-aurix-orange py-3.5 text-black font-mono text-xs font-bold uppercase tracking-wider hover:bg-orange-400 transition-colors shadow-lg shadow-aurix-orange/30">
              {words.register}
            </Link>
            <p className="text-[11px] font-mono text-slate-500 uppercase tracking-wider">{words.footer}</p>
          </div>
        </div>
      </div>
    </div>
  )
}
