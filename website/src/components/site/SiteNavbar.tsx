'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Menu, X, ArrowUpRight, ArrowLeft, User } from 'lucide-react'
import type { SiteNav } from '@/lib/navigation-defaults'

/** Top bar of the KRS or AURIX site. All texts, links and the logo come from the CMS (Navigation & footer). */
export function SiteNavbar({ nav, theme }: { nav: SiteNav; theme: 'krs' | 'aurix' }) {
  const [mobileOpen, setMobileOpen] = useState(false)
  const pathname = usePathname()
  const aurix = theme === 'aurix'
  const home = aurix ? '/aurix' : '/'
  const isActive = (href: string) => (href === home ? pathname === home : pathname.startsWith(href))

  const c = aurix
    ? {
        header: 'border-aurix-border bg-aurix-dark/95',
        brand: 'font-display font-extrabold text-white text-base tracking-wider uppercase group-hover:text-aurix-orange',
        sub: 'text-[10px] font-mono tracking-widest text-slate-400 uppercase',
        link: 'uppercase tracking-wider',
        active: 'text-aurix-orange bg-aurix-surface font-semibold shadow-inner',
        drawer: 'border-aurix-border bg-aurix-surface/98',
        drawerActive: 'text-aurix-orange bg-aurix-dark font-bold',
        divider: 'border-aurix-border/60',
        primary: 'bg-aurix-orange text-black hover:bg-orange-400 font-bold',
      }
    : {
        header: 'border-krs-border bg-krs-dark/90',
        brand: 'font-display font-bold text-white text-base tracking-tight leading-none group-hover:text-krs-cyan',
        sub: 'text-[10px] font-mono tracking-wider text-slate-400 uppercase mt-1',
        link: 'tracking-wide',
        active: 'text-krs-cyan bg-krs-surface font-semibold shadow-inner',
        drawer: 'border-krs-border bg-krs-surface/98',
        drawerActive: 'text-krs-cyan bg-krs-dark font-semibold',
        divider: 'border-krs-border/60',
        primary: 'bg-krs-cyan text-black hover:bg-cyan-400 font-semibold',
      }

  const ctaClass = (style?: string) =>
    style === 'link'
      ? `flex items-center gap-1.5 px-3 py-1.5 text-xs font-mono uppercase transition-colors ${
          aurix ? 'text-krs-cyan hover:text-cyan-300' : 'text-aurix-orange hover:text-orange-400'
        }`
      : style === 'secondary'
      ? `inline-flex items-center gap-2 px-4 py-2 text-xs font-mono uppercase rounded border transition-colors ${
          aurix ? 'border-aurix-border text-white hover:border-aurix-orange' : 'border-krs-border text-white hover:border-krs-cyan'
        }`
      : `inline-flex items-center gap-2 px-4 py-2 text-xs font-mono uppercase rounded transition-colors shadow-sm ${c.primary}`

  return (
    <header className={`sticky top-0 z-40 w-full border-b backdrop-blur-md ${c.header}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <div className="flex items-center gap-6">
          <Link href={home} className="flex items-center gap-3 group">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={nav.logo} alt={`${nav.brandTitle} logo`} width={40} height={40} className="w-10 h-10 object-contain transition-transform group-hover:scale-105" />
            <div className="flex flex-col">
              <span className={`${c.brand} transition-colors`}>{nav.brandTitle}</span>
              {nav.brandSubtitle && <span className={c.sub}>{nav.brandSubtitle}</span>}
            </div>
          </Link>
          {aurix && nav.backLabel && (
            <Link href="/" className="hidden md:inline-flex items-center gap-1 text-[11px] font-mono text-slate-400 hover:text-krs-cyan transition-colors">
              <ArrowLeft className="w-3 h-3" /> {nav.backLabel}
            </Link>
          )}
        </div>

        <nav className="hidden lg:flex items-center gap-1">
          {nav.links.map((link) => (
            <Link
              key={link.href + link.label}
              href={link.href}
              className={`px-3 py-1.5 text-xs font-mono rounded-md transition-all ${c.link} ${
                isActive(link.href) ? c.active : 'text-slate-300 hover:text-white hover:bg-slate-800/40'
              }`}
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="hidden lg:flex items-center gap-3">
          {nav.ctas.map((cta) => (
            <Link key={cta.href + cta.label} href={cta.href} className={ctaClass(cta.style)}>
              {aurix && cta.style !== 'link' && cta.href.startsWith('/aurix/portal') && <User className="w-3.5 h-3.5" />}
              {cta.label}
              {cta.style === 'link' && <ArrowUpRight className="w-3.5 h-3.5" />}
            </Link>
          ))}
        </div>

        <button
          type="button"
          onClick={() => setMobileOpen(!mobileOpen)}
          aria-expanded={mobileOpen}
          aria-label="Toggle navigation menu"
          className="lg:hidden p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800/60 focus:outline-none"
        >
          {mobileOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {mobileOpen && (
        <div className={`lg:hidden border-b px-4 pt-2 pb-6 space-y-1 ${c.drawer}`}>
          {nav.links.map((link) => (
            <Link
              key={link.href + link.label}
              href={link.href}
              onClick={() => setMobileOpen(false)}
              className={`block px-3 py-2 text-sm font-mono rounded-md ${aurix ? 'uppercase' : ''} ${
                isActive(link.href) ? c.drawerActive : 'text-slate-300 hover:text-white hover:bg-slate-800/50'
              }`}
            >
              {link.label}
            </Link>
          ))}
          <div className={`pt-4 border-t flex flex-col gap-2 ${c.divider}`}>
            {nav.ctas.map((cta) => (
              <Link
                key={cta.href + cta.label}
                href={cta.href}
                onClick={() => setMobileOpen(false)}
                className={`${ctaClass(cta.style)} justify-center w-full`}
              >
                {cta.label}
                {cta.style === 'link' && <ArrowUpRight className="w-4 h-4" />}
              </Link>
            ))}
            {aurix && nav.backLabel && (
              <Link href="/" onClick={() => setMobileOpen(false)} className="text-center px-4 py-2 text-xs font-mono text-slate-400 hover:text-krs-cyan">
                {nav.backLabel}
              </Link>
            )}
          </div>
        </div>
      )}
    </header>
  )
}
