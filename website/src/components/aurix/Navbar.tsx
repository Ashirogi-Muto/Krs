'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Menu, X, ArrowLeft, User } from 'lucide-react'
import { isVisibleIn } from '@/lib/visibility'

const AURIX_NAV_LINKS = [
  { name: 'AURIX Arena', href: '/aurix' },
  { name: 'Competitions', href: '/aurix/competitions' },
  { name: 'Schedule', href: '/aurix/schedule' },
  { name: 'Rules', href: '/aurix/rules' },
  { name: 'Results', href: '/aurix/results' },
  { name: 'FAQ', href: '/aurix/faq' },
]

/** `hidden`: routes hidden in the CMS (Site settings), passed in by the server layout. */
export function AURIXNavbar({ hidden }: { hidden: string[] }) {
  const isRouteVisible = (href: string) => isVisibleIn(hidden, href)
  const visibleLinks = AURIX_NAV_LINKS.filter((link) => isRouteVisible(link.href))

  const [mobileOpen, setMobileOpen] = useState(false)
  const pathname = usePathname()

  return (
    <header className="sticky top-0 z-40 w-full border-b border-aurix-border bg-aurix-dark/95 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand Identity */}
        <div className="flex items-center gap-6">
          <Link href="/aurix" className="flex items-center gap-3 group">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/images/aurix-mark.png"
              alt="AURIX logo"
              width={40}
              height={40}
              className="h-10 w-10 transition-transform group-hover:scale-105"
            />
            <div className="flex flex-col">
              <span className="font-display font-extrabold text-white text-base tracking-wider uppercase group-hover:text-aurix-orange transition-colors">
                AURIX 2026
              </span>
              <span className="text-[10px] font-mono tracking-widest text-slate-400 uppercase">
                Robotics Competition Arena
              </span>
            </div>
          </Link>

          <Link
            href="/"
            className="hidden md:inline-flex items-center gap-1 text-[11px] font-mono text-slate-400 hover:text-krs-cyan transition-colors"
          >
            <ArrowLeft className="w-3 h-3" /> Return to KRS
          </Link>
        </div>

        {/* Desktop Navigation */}
        <nav className="hidden lg:flex items-center gap-1">
          {visibleLinks.map((link) => {
            const isActive =
              link.href === '/aurix'
                ? pathname === '/aurix'
                : pathname.startsWith(link.href)
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`px-3 py-1.5 text-xs font-mono uppercase tracking-wider rounded-md transition-all ${
                  isActive
                    ? 'text-aurix-orange bg-aurix-surface font-semibold shadow-inner'
                    : 'text-slate-300 hover:text-white hover:bg-slate-800/40'
                }`}
              >
                {link.name}
              </Link>
            )
          })}
        </nav>

        {/* Action Buttons */}
        <div className="hidden lg:flex items-center gap-3">
          {isRouteVisible('/aurix/portal') && (
            <Link
              href="/aurix/portal"
              className="inline-flex items-center gap-2 px-4 py-2 text-xs font-mono font-bold uppercase bg-aurix-orange text-black rounded hover:bg-orange-400 transition-colors shadow-sm"
            >
              <User className="w-3.5 h-3.5" />
              Participant Portal
            </Link>
          )}
        </div>

        {/* Mobile Hamburger Button */}
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

      {/* Mobile Drawer */}
      {mobileOpen && (
        <div className="lg:hidden border-b border-aurix-border bg-aurix-surface/98 px-4 pt-2 pb-6 space-y-1">
          {visibleLinks.map((link) => {
            const isActive =
              link.href === '/aurix'
                ? pathname === '/aurix'
                : pathname.startsWith(link.href)
            return (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMobileOpen(false)}
                className={`block px-3 py-2 text-sm font-mono uppercase rounded-md ${
                  isActive
                    ? 'text-aurix-orange bg-aurix-dark font-bold'
                    : 'text-slate-300 hover:text-white hover:bg-slate-800/50'
                }`}
              >
                {link.name}
              </Link>
            )
          })}
          <div className="pt-4 border-t border-aurix-border/60 flex flex-col gap-2">
            {isRouteVisible('/aurix/portal') && (
              <Link
                href="/aurix/portal"
                onClick={() => setMobileOpen(false)}
                className="w-full text-center px-4 py-2.5 text-xs font-mono font-bold uppercase bg-aurix-orange text-black rounded"
              >
                Enter Participant Portal
              </Link>
            )}
            <Link
              href="/"
              onClick={() => setMobileOpen(false)}
              className="text-center px-4 py-2 text-xs font-mono text-slate-400 hover:text-krs-cyan"
            >
              Return to KRS Society Home
            </Link>
          </div>
        </div>
      )}
    </header>
  )
}
