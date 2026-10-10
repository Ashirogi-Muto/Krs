import React from 'react'
import Link from 'next/link'
import { Calendar, Clock, MapPin, ArrowRight, Sparkles } from 'lucide-react'
import { NO_CMS, type Cms } from '@/lib/cms-attrs'
import { container } from './shared'

/**
 * Widescreen rectangular replica of the Featured Event card reference,
 * designed to fit completely within the viewport at 100% standard zoom.
 */
export function FlagshipEventReplica({ b, cms = NO_CMS }: { b?: any; cms?: Cms }) {
  const title = b?.title || 'AURIX 2026: National Robotics Arena & AI Challenge'
  const primaryHref = b?.buttons?.[0]?.href || '/aurix'
  const primaryLabel = b?.buttons?.[0]?.label || 'Register Here'

  return (
    <section id="flagship-event" {...cms()} className={`${container} py-4 sm:py-6 scroll-mt-20`}>
      {/* ── Compact Section Header (Fits 100% Viewport) ── */}
      <div className="flex flex-col items-center text-center mb-4 sm:mb-5">
        {/* Pill Eyebrow */}
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border border-krs-cyan/35 bg-krs-cyan/10 text-krs-cyan font-mono text-[11px] font-semibold uppercase tracking-wider mb-2 shadow-[0_0_15px_rgba(6,182,212,0.12)]">
          <Sparkles className="w-3 h-3 text-krs-cyan animate-pulse" />
          <span>FEATURED EVENT</span>
        </div>

        {/* Section Heading with decorative accent underline */}
        <div className="relative inline-block">
          <h2 className="text-2xl sm:text-3xl lg:text-[32px] font-display font-extrabold text-white tracking-tight">
            Upcoming{' '}
            <span className="relative inline-block text-white">
              Event
              <span className="absolute -bottom-1.5 left-0 right-0 h-[3px] bg-gradient-to-r from-krs-cyan via-blue-500 to-aurix-orange rounded-full shadow-[0_0_10px_rgba(6,182,212,0.8)]" />
            </span>
          </h2>
        </div>

        {/* Compact Subtitle */}
        <p className="max-w-md mx-auto text-slate-300 text-xs sm:text-sm leading-relaxed mt-2.5 font-normal px-2">
          Don&apos;t miss out on our most anticipated event of the season. Register now to secure your spot!
        </p>
      </div>

      {/* ── Sleek Widescreen Horizontal Rectangle Card ── */}
      <div className="relative max-w-6xl mx-auto rounded-2xl border border-white/10 hover:border-krs-cyan/40 bg-[#0c1222]/95 backdrop-blur-xl shadow-[0_12px_44px_rgba(0,0,0,0.65)] overflow-hidden transition-all duration-300 group">
        {/* Ambient Corner Glows */}
        <div className="absolute -top-24 -right-24 w-72 h-72 rounded-full blur-[90px] bg-krs-cyan/15 pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-72 h-72 rounded-full blur-[90px] bg-aurix-orange/15 pointer-events-none" />

        <div className="grid grid-cols-1 lg:grid-cols-12 items-stretch lg:h-[395px]">
          {/* Left Column: Image (Horizontal rectangular proportion) */}
          <div className="lg:col-span-5 relative h-[250px] sm:h-[300px] lg:h-full overflow-hidden bg-slate-900">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/images/flagship-event.jpg"
              alt="AURIX Robotics Engineer & Systems"
              className="w-full h-full object-cover object-top lg:object-center group-hover:scale-105 transition-transform duration-700 ease-out"
            />
            {/* Dark gradient blend on edges */}
            <div className="absolute inset-0 bg-gradient-to-t from-[#0c1222] via-transparent to-transparent lg:hidden" />
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-transparent to-[#0c1222] hidden lg:block opacity-70" />

            {/* Live Arena badge in corner */}
            <div className="absolute top-3.5 left-3.5 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-black/75 backdrop-blur-md border border-aurix-orange/60 text-aurix-orange text-[10px] font-mono font-bold uppercase tracking-wider shadow-lg">
              <span className="w-1.5 h-1.5 rounded-full bg-aurix-orange animate-pulse" />
              LIVE ARENA // 2026
            </div>
          </div>

          {/* Right Column: Compact Details Area */}
          <div className="lg:col-span-7 p-5 sm:p-6 lg:p-7 flex flex-col justify-between space-y-3 lg:space-y-0">
            <div className="space-y-2.5">
              {/* Category tag & mode row */}
              <div className="flex flex-wrap items-center gap-2.5">
                <span className="px-3 py-0.5 rounded-full text-[11px] font-mono font-semibold bg-krs-cyan/15 border border-krs-cyan/40 text-krs-cyan tracking-wide">
                  Robotics &amp; AI
                </span>
                <div className="inline-flex items-center gap-1.5 text-slate-300 text-[11px] font-mono">
                  <MapPin className="w-3.5 h-3.5 text-aurix-orange shrink-0" />
                  <span>Campus Arena | Live In-Person &amp; Hybrid</span>
                </div>
              </div>

              {/* Event Title */}
              <h3 className="text-xl sm:text-2xl font-display font-extrabold text-white tracking-tight leading-snug group-hover:text-cyan-50 transition-colors">
                {title}
              </h3>

              {/* Bullet points list (compact vertical footprint) */}
              <ul className="space-y-1.5 pt-0.5 text-slate-300 text-xs sm:text-[13px] leading-snug">
                <li className="flex items-start gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-krs-cyan mt-1.5 shrink-0 shadow-[0_0_6px_rgba(6,182,212,0.8)]" />
                  <span>Compete in Robo Soccer, High-Speed Robo Race &amp; Autonomous Maze Navigation</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-krs-cyan mt-1.5 shrink-0 shadow-[0_0_6px_rgba(6,182,212,0.8)]" />
                  <span>12-Hour National AI &amp; Embedded Systems Hackathon with live jury evaluation</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-krs-cyan mt-1.5 shrink-0 shadow-[0_0_6px_rgba(6,182,212,0.8)]" />
                  <span>Exhibit hardware prototypes and research systems at the National Robo Expo</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-krs-cyan mt-1.5 shrink-0 shadow-[0_0_6px_rgba(6,182,212,0.8)]" />
                  <span>₹5,00,000+ prize pool, corporate sponsorships &amp; IEEE-recognized credentials</span>
                </li>
              </ul>
            </div>

            {/* Meta Row: Date & Time */}
            <div className="flex flex-wrap items-center gap-5 py-2 border-y border-white/10">
              <div className="inline-flex items-center gap-1.5 text-xs font-mono text-slate-200">
                <Calendar className="w-3.5 h-3.5 text-krs-cyan" />
                <span>24th – 25th October 2026</span>
              </div>
              <div className="inline-flex items-center gap-1.5 text-xs font-mono text-slate-200">
                <Clock className="w-3.5 h-3.5 text-aurix-orange" />
                <span>09:00 AM – 06:00 PM IST</span>
              </div>
            </div>

            {/* Mentors / Organizers Row */}
            <div className="flex items-center gap-2.5">
              <div className="flex -space-x-1.5 overflow-hidden">
                <div className="inline-block h-6 w-6 rounded-full ring-2 ring-[#0c1222] bg-gradient-to-tr from-cyan-600 to-blue-500 text-[9px] font-bold text-white flex items-center justify-center">
                  KR
                </div>
                <div className="inline-block h-6 w-6 rounded-full ring-2 ring-[#0c1222] bg-gradient-to-tr from-orange-500 to-amber-400 text-[9px] font-bold text-white flex items-center justify-center">
                  AX
                </div>
                <div className="inline-block h-6 w-6 rounded-full ring-2 ring-[#0c1222] bg-gradient-to-tr from-purple-600 to-indigo-500 text-[9px] font-bold text-white flex items-center justify-center">
                  AI
                </div>
                <div className="inline-block h-6 w-6 rounded-full ring-2 ring-[#0c1222] bg-slate-800 text-[8px] font-mono text-slate-300 flex items-center justify-center">
                  +12
                </div>
              </div>
              <span className="text-[11px] font-mono text-slate-400">
                Ex-DRDO Jury &amp; KRS Tech Leads
              </span>
            </div>

            {/* Bottom Row: Free Status + Register Button */}
            <div className="pt-1 flex items-center justify-between gap-4">
              <div>
                <span className="block text-[9px] font-mono uppercase tracking-wider text-slate-400">
                  Participation
                </span>
                <span className="text-xl sm:text-2xl font-display font-extrabold text-white">
                  Free{' '}
                  <span className="text-[11px] font-mono font-normal text-krs-cyan">
                    / Open Registration
                  </span>
                </span>
              </div>

              <div className="flex items-center gap-3">
                <Link
                  href={primaryHref}
                  className="inline-flex items-center gap-2 px-6 sm:px-7 py-2.5 sm:py-3 rounded-xl bg-gradient-to-r from-blue-600 to-krs-cyan hover:from-blue-500 hover:to-cyan-300 text-black font-mono font-bold text-xs uppercase tracking-wider transition-all shadow-[0_0_20px_rgba(6,182,212,0.35)] hover:shadow-[0_0_30px_rgba(6,182,212,0.6)] btn-shimmer"
                >
                  <span>{primaryLabel}</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
