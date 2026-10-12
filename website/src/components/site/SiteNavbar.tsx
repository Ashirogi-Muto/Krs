'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Menu, X, ArrowUpRight, ArrowLeft, User } from 'lucide-react'
import type { SiteNav } from '@/lib/navigation-defaults'

/** Top bar of the KRS or AURIX site. All texts, links and the logo come from the CMS (Navigation & footer). */
export function SiteNavbar({ nav, theme, menuLabel = 'Toggle navigation menu' }: { nav: SiteNav; theme: 'krs' | 'aurix'; menuLabel?: string }) {
  const [mobileOpen, setMobileOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const pathname = usePathname()
  const aurix = theme === 'aurix'
  const home = aurix ? '/aurix' : '/'
  const isActive = (href: string) => (href === home ? pathname === home : pathname.startsWith(href))

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  const c = aurix
    ? {
        active: 'text-aurix-orange bg-aurix-surface font-semibold',
        drawerActive: 'text-aurix-orange bg-aurix-dark font-bold',
        link: 'uppercase tracking-wider',
        brand: 'font-display font-extrabold text-white text-base tracking-wider uppercase group-hover:text-aurix-orange',
        sub: 'text-[10px] font-mono tracking-widest text-slate-400 uppercase',
        primary: 'bg-aurix-orange text-black hover:bg-orange-400 font-bold',
        divider: 'border-aurix-border/60',
      }
    : {
        active: 'text-krs-cyan bg-krs-surface/60 font-semibold',
        drawerActive: 'text-krs-cyan bg-krs-dark font-semibold',
        link: 'tracking-wide',
        brand: 'font-display font-bold text-white text-base tracking-tight leading-none group-hover:text-krs-cyan',
        sub: 'text-[10px] font-mono tracking-wider text-slate-400 uppercase mt-1',
        primary: 'bg-krs-cyan text-black hover:bg-cyan-400 font-semibold btn-shimmer',
        divider: 'border-krs-border/60',
      }

  const ctaClass = (style?: string) =>
    style === 'link'
      ? `flex items-center gap-1.5 px-3 py-1.5 text-xs font-mono uppercase transition-colors ${aurix ? 'text-krs-cyan hover:text-cyan-300' : 'text-aurix-orange hover:text-orange-400'}`
      : style === 'secondary'
      ? `inline-flex items-center gap-2 px-4 py-2 text-xs font-mono uppercase rounded-lg border transition-all ${aurix ? 'border-aurix-border text-white hover:border-aurix-orange hover:text-aurix-orange' : 'border-krs-border/60 text-slate-300 hover:border-krs-cyan hover:text-krs-cyan'}`
      : `inline-flex items-center gap-2 px-5 py-2.5 text-xs font-mono uppercase rounded-lg transition-all shadow-lg ${aurix ? 'shadow-aurix-orange/20' : 'shadow-krs-cyan/20'} ${c.primary}`

  const wrapperCls = scrolled
    ? 'max-w-7xl mx-auto rounded-2xl navbar-glass border border-krs-cyan/25 shadow-[0_8px_32px_rgba(0,0,0,0.6)]'
    : `max-w-7xl mx-auto rounded-2xl border transition-all duration-300 ${aurix ? 'border-aurix-border/70 bg-aurix-dark/80 backdrop-blur-xl' : 'border-krs-border/60 bg-krs-dark/75 backdrop-blur-xl shadow-[0_4px_24px_rgba(0,0,0,0.3)]'}`

  return (
    <header className="sticky top-0 z-40 px-3 sm:px-6 pt-3 pb-1 transition-all duration-300">
      {/* Top ambient glow line */}
      {!aurix && (
        <div className="absolute top-0 left-1/4 right-1/4 h-[1px] bg-gradient-to-r from-transparent via-krs-cyan/40 to-transparent pointer-events-none" />
      )}
      <div className={`transition-all duration-300 ${wrapperCls}`}>
        <div className="px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          {/* Brand */}
          <div className="flex items-center gap-6">
            <Link href={home} className="flex items-center gap-3 group">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={nav.logo}
                alt={`${nav.brandTitle} logo`}
                width={40} height={40}
                className="w-10 h-10 object-contain transition-all duration-300 group-hover:scale-110 group-hover:drop-shadow-[0_0_8px_rgba(6,182,212,0.6)]"
              />
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

          {/* Desktop nav */}
          <nav className="hidden lg:flex items-center gap-0.5">
            {nav.links.map((link) => (
              <Link
                key={link.href + link.label}
                href={link.href}
                className={`relative px-4 py-2 text-xs font-mono rounded-lg transition-all ${c.link} ${
                  isActive(link.href) ? c.active : 'text-slate-300 hover:text-white hover:bg-white/5'
                }`}
              >
                {isActive(link.href) && (
                  <span className="absolute bottom-1 left-1/2 -translate-x-1/2 w-4 h-0.5 rounded-full bg-krs-cyan opacity-70" />
                )}
                {link.label}
              </Link>
            ))}
          </nav>

          {/* Desktop CTAs */}
          <div className="hidden lg:flex items-center gap-3">
            {nav.ctas.map((cta) => (
              <Link key={cta.href + cta.label} href={cta.href} className={ctaClass(cta.style)}>
                {aurix && cta.style !== 'link' && cta.href.startsWith('/aurix/portal') && <User className="w-3.5 h-3.5" />}
                {cta.label}
                {cta.style === 'link' && <ArrowUpRight className="w-3.5 h-3.5" />}
              </Link>
            ))}
          </div>

          {/* Mobile toggle */}
          <button
            type="button"
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-expanded={mobileOpen}
            aria-label={menuLabel}
            className="lg:hidden p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/8 focus:outline-none transition-colors"
          >
            {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>

        {/* Mobile drawer */}
        {mobileOpen && (
          <div className={`lg:hidden border-t px-4 pt-3 pb-6 space-y-1 glass-dark ${c.divider}`}>
            {nav.links.map((link) => (
              <Link
                key={link.href + link.label}
                href={link.href}
                onClick={() => setMobileOpen(false)}
                className={`flex items-center px-3 py-2.5 text-sm font-mono rounded-xl ${aurix ? 'uppercase' : ''} transition-all ${
                  isActive(link.href) ? c.drawerActive : 'text-slate-300 hover:text-white hover:bg-white/5'
                }`}
              >
                {isActive(link.href) && <span className="w-1.5 h-1.5 rounded-full bg-krs-cyan mr-2" />}
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
      </div>
    </header>
  )
}

