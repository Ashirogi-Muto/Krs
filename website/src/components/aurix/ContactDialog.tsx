'use client'

import React, { useRef } from 'react'
import { MessageCircle, Phone, X } from 'lucide-react'

/** One contact as the page passes it: links are built on the server (lib/event-contacts.ts). */
export type ContactItem = { name: string; role?: string; phoneText: string; tel: string; whatsapp: string }
export type ContactWords = { button: string; title: string; intro: string; whatsapp: string; close: string }

/**
 * "Contact Us" button + pop-up on the competition page (owner, 17 Oct 2026): the competition's own contacts, each
 * opening a WhatsApp chat. A native <dialog>: Escape and the backdrop close it, focus stays inside while open.
 */
export function ContactDialog({ contacts, words, cms = {} }: { contacts: ContactItem[]; words: ContactWords; cms?: Record<string, string> }) {
  const ref = useRef<HTMLDialogElement>(null)
  if (!contacts.length) return null
  return (
    <>
      <button
        type="button"
        onClick={() => ref.current?.showModal()}
        className="inline-flex items-center gap-2 px-6 py-3.5 rounded-lg bg-aurix-surface border border-emerald-500/60 text-emerald-400 font-mono text-xs uppercase font-bold hover:bg-emerald-500/10 transition-colors"
        {...cms}
      >
        <MessageCircle className="w-4 h-4" />
        {words.button}
      </button>
      <dialog
        ref={ref}
        onClick={(ev) => ev.target === ref.current && ref.current?.close()}
        className="m-auto w-[min(92vw,28rem)] rounded-2xl border border-aurix-border bg-aurix-dark p-0 text-white backdrop:bg-black/70 backdrop:backdrop-blur-sm"
        aria-labelledby="aurix-contact-title"
      >
        <div className="p-6 space-y-4">
          <div className="flex items-start justify-between gap-4">
            <h2 id="aurix-contact-title" className="text-lg font-display font-bold uppercase tracking-wide">
              {words.title}
            </h2>
            <button type="button" onClick={() => ref.current?.close()} aria-label={words.close} className="p-1 rounded text-slate-400 hover:text-white">
              <X className="w-5 h-5" />
            </button>
          </div>
          <p className="text-sm text-slate-300">{words.intro}</p>
          <ul className="space-y-3">
            {contacts.map((c) => (
              <li key={c.tel} className="aurix-card rounded-xl p-4 flex flex-col sm:flex-row sm:items-center gap-3 justify-between">
                <div className="min-w-0">
                  <p className="font-bold text-white truncate">{c.name}</p>
                  {c.role && <p className="text-xs font-mono text-slate-400">{c.role}</p>}
                  <a href={c.tel} className="mt-1 inline-flex items-center gap-1.5 text-xs font-mono text-slate-300 hover:text-white">
                    <Phone className="w-3.5 h-3.5" />
                    {c.phoneText}
                  </a>
                </div>
                <a
                  href={c.whatsapp}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-emerald-500 text-black font-semibold text-xs font-mono uppercase tracking-wider hover:bg-emerald-400 transition-colors shrink-0"
                >
                  <MessageCircle className="w-4 h-4" />
                  {words.whatsapp}
                </a>
              </li>
            ))}
          </ul>
        </div>
      </dialog>
    </>
  )
}
