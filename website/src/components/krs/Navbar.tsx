'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Cpu, Menu, X, ArrowUpRight } from 'lucide-react'
import { isRouteVisible } from '@/lib/visibility'

const NAV_LINKS = [
  { name: 'Home', href: '/' },
  { name: 'Projects', href: '/projects' },
  { name: 'Learning', href: '/learning' },
  { name: 'Events', href: '/events' },
  { name: 'Gallery', href: '/gallery' },
  { name: 'Blogs', href: '/blogs' },
  { name: 'Insights', href: '/insights' },
  { name: 'Team', href: '/team' },
].filter((link) => isRouteVisible(link.href))

export function KRSNavbar() {
  const [mobileOpen, setMobileOpen] = useState(false)
  const pathname = usePathname()

  return (
    <header className="sticky top-0 z-40 w-full border-b border-krs-border bg-krs-dark/90 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand Identity */}
        <Link href="/" className="flex items-center gap-3 group">
          <div className="w-10 h-10 rounded-lg bg-krs-surface border border-krs-border flex items-center justify-center text-krs-cyan group-hover:border-krs-cyan transition-colors">
            <Cpu className="w-5 h-5 transition-transform group-hover:scale-110" />
          </div>
          <div className="flex flex-col">
            <span className="font-display font-bold text-white text-base tracking-tight leading-none group-hover:text-krs-cyan transition-colors">
              KALAM ROBOTICS SOCIETY
            </span>
            <span className="text-[10px] font-mono tracking-wider text-slate-400 uppercase mt-1">
              IILM University, Greater Noida
            </span>
          </div>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden lg:flex items-center gap-1">
          {NAV_LINKS.map((link) => {
            const isActive =
              link.href === '/' ? pathname === '/' : pathname.startsWith(link.href)
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`px-3 py-1.5 text-xs font-mono tracking-wide rounded-md transition-all ${
                  isActive
                    ? 'text-krs-cyan bg-krs-surface font-semibold shadow-inner'
                    : 'text-slate-300 hover:text-white hover:bg-slate-800/40'
                }`}
              >
                {link.name}
              </Link>
            )
          })}
        </nav>

        {/* Action CTAs */}
        <div className="hidden lg:flex items-center gap-3">
          <Link
            href="/aurix"
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-mono uppercase text-aurix-orange hover:text-orange-400 transition-colors"
          >
            AURIX Arena
            <ArrowUpRight className="w-3.5 h-3.5" />
          </Link>
          {isRouteVisible('/join') && (
            <Link
              href="/join"
              className="px-4 py-2 text-xs font-mono font-semibold uppercase bg-krs-cyan text-black rounded hover:bg-cyan-400 transition-colors shadow-sm"
            >
              Join KRS
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
        <div className="lg:hidden border-b border-krs-border bg-krs-surface/98 px-4 pt-2 pb-6 space-y-1">
          {NAV_LINKS.map((link) => {
            const isActive =
              link.href === '/' ? pathname === '/' : pathname.startsWith(link.href)
            return (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMobileOpen(false)}
                className={`block px-3 py-2 text-sm font-mono rounded-md ${
                  isActive
                    ? 'text-krs-cyan bg-krs-dark font-semibold'
                    : 'text-slate-300 hover:text-white hover:bg-slate-800/50'
                }`}
              >
                {link.name}
              </Link>
            )
          })}
          <div className="pt-4 border-t border-krs-border/60 flex flex-col gap-2">
            <Link
              href="/aurix"
              onClick={() => setMobileOpen(false)}
              className="flex items-center justify-between px-3 py-2 text-xs font-mono uppercase text-aurix-orange rounded bg-aurix-surface/60"
            >
              <span>Explore AURIX Arena</span>
              <ArrowUpRight className="w-4 h-4" />
            </Link>
            {isRouteVisible('/join') && (
              <Link
                href="/join"
                onClick={() => setMobileOpen(false)}
                className="w-full text-center px-4 py-2.5 text-xs font-mono font-semibold uppercase bg-krs-cyan text-black rounded"
              >
                Join KRS
              </Link>
            )}
          </div>
        </div>
      )}
    </header>
  )
}
