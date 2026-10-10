'use client'

import React, { useEffect, useRef, useState } from 'react'

export type ReceiptPopupTexts = { popTitle: string; popText: string; popWhere: string; popContinue: string; popCancel: string }

/**
 * Every on-site "Proceed to payment" button (owner, 10 Oct 2026): first a warning that the receipt (PDF or screenshot)
 * must be downloaded and uploaded after paying; "continue" then opens the payment page as the button did before.
 */
export function PayWithReceiptNotice({
  href,
  className,
  newTab = false,
  t,
  children,
}: {
  href: string
  className?: string
  newTab?: boolean
  t: ReceiptPopupTexts
  children: React.ReactNode
}) {
  const [open, setOpen] = useState(false)
  const continueRef = useRef<HTMLAnchorElement>(null)
  useEffect(() => {
    if (!open) return
    continueRef.current?.focus()
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false)
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open])
  const where = t.popWhere.split('{link}')
  const link = typeof window === 'undefined' ? '/aurix/payment-done' : `${window.location.origin}/aurix/payment-done`
  return (
    <>
      <a
        href={href}
        className={className}
        onClick={(e) => {
          e.preventDefault()
          setOpen(true)
        }}
      >
        {children}
      </a>
      {open && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 px-4" onClick={() => setOpen(false)}>
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="receipt-pop-title"
            className="aurix-card w-full max-w-md rounded-2xl p-6 space-y-4 text-left"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 id="receipt-pop-title" className="text-lg font-display font-bold text-white">
              {t.popTitle}
            </h2>
            <p className="text-sm text-slate-300 leading-relaxed">{t.popText}</p>
            <p className="text-sm text-slate-300 leading-relaxed">
              {where[0]}
              <span className="font-mono text-aurix-orange break-all">{link.replace(/^https?:\/\//, '')}</span>
              {where.slice(1).join('{link}')}
            </p>
            <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="px-4 py-2.5 rounded-lg bg-aurix-dark border border-aurix-border text-slate-300 text-xs font-mono uppercase hover:text-white"
              >
                {t.popCancel}
              </button>
              <a
                ref={continueRef}
                href={href}
                {...(newTab ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
                onClick={() => setOpen(false)}
                className="px-4 py-2.5 rounded-lg bg-aurix-orange text-black font-semibold text-xs font-mono uppercase tracking-wider text-center hover:bg-orange-400"
              >
                {t.popContinue}
              </a>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
