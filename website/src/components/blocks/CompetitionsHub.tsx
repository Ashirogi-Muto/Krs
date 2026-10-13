import React from 'react'
import Link from 'next/link'
import { ArrowRight, ChevronRight } from 'lucide-react'
import { NO_CMS, cmsRef, type Cms } from '@/lib/cms-attrs'
import { getAllEvents, withoutHiddenEvents } from '@/lib/data/events'
import type { GenericEvent } from '@/lib/data/types'
import { aurixFacts, fillFacts } from './aurix'
import { BlockIcon, CmsLink } from './shared'
import { teamLine } from './data'
import { getFormTexts } from '@/lib/form-texts'
import { mediaUrl } from '@/lib/navigation'
import { optimizedSrc } from '@/lib/img'

// Colour per position; the cards themselves are the AURIX competitions in Events
const COLORS = [
  { badge: 'bg-rose-500/15 border-rose-500/30 text-rose-400', card: 'border-rose-500/20 hover:border-rose-500/60', mark: 'text-rose-500/10', glow: 'group-hover:shadow-[0_0_25px_rgba(244,63,94,0.2)]' },
  { badge: 'bg-cyan-500/15 border-cyan-500/30 text-krs-cyan', card: 'border-cyan-500/20 hover:border-krs-cyan/60', mark: 'text-cyan-500/10', glow: 'group-hover:shadow-[0_0_25px_rgba(6,182,212,0.2)]' },
  { badge: 'bg-amber-500/15 border-amber-500/30 text-amber-400', card: 'border-amber-500/20 hover:border-amber-500/60', mark: 'text-amber-500/10', glow: 'group-hover:shadow-[0_0_25px_rgba(245,158,11,0.2)]' },
  { badge: 'bg-yellow-500/15 border-yellow-500/30 text-yellow-400', card: 'border-yellow-500/20 hover:border-yellow-500/60', mark: 'text-yellow-500/10', glow: 'group-hover:shadow-[0_0_25px_rgba(234,179,8,0.2)]' },
  { badge: 'bg-blue-500/15 border-blue-500/30 text-blue-400', card: 'border-blue-500/20 hover:border-blue-500/60', mark: 'text-blue-500/10', glow: 'group-hover:shadow-[0_0_25px_rgba(59,130,246,0.2)]' },
]
const ICONS: Record<string, string> = { hackathon: 'terminal', 'robo-soccer': 'bot', 'robo-race': 'zap', 'robo-expo': 'layers', 'robo-ideathon': 'lightbulb' }

function Card({ e, n, side, linkLabel, facts, cms, cmsLink }: { e: GenericEvent; n: number; side: 'left' | 'right'; linkLabel: string; facts: string; cms: Cms; cmsLink: Record<string, string> }) {
  const col = COLORS[(n - 1) % COLORS.length]
  const num = String(n).padStart(2, '0')
  return (
    <Link
      href={`/aurix/${e.slug}`}
      {...cmsRef(cms !== NO_CMS, 'events', e.id)}
      className={`group relative block p-4 sm:p-5 rounded-xl bg-krs-surface/85 backdrop-blur-xl border ${col.card} transition-all duration-300 hover:-translate-y-1 ${col.glow} overflow-hidden select-none reveal`}
    >
      <span
        className={`absolute -bottom-3 ${side === 'left' ? '-left-1' : '-right-1'} text-5xl sm:text-6xl font-black font-mono select-none pointer-events-none ${col.mark} transition-all duration-300 group-hover:scale-110`}
        aria-hidden="true"
      >
        {num}
      </span>
      <div className={`flex items-center justify-between mb-2.5 ${side === 'left' ? 'flex-row' : 'flex-row-reverse'}`}>
        <span className="text-[10px] font-mono tracking-wider font-semibold text-slate-300 uppercase">{e.eventType}</span>
        <div className={`w-7 h-7 rounded-lg flex items-center justify-center border shadow-sm group-hover:scale-110 transition-transform duration-300 ${col.badge}`}>
          <BlockIcon name={ICONS[e.slug] || 'cpu'} className="w-4 h-4" />
        </div>
      </div>
      <h3 className="relative z-10 text-white font-bold text-sm sm:text-base mb-1 group-hover:text-cyan-300 transition-colors">{e.title}</h3>
      {e.shortDescription && <p className="relative z-10 text-slate-400 text-xs leading-relaxed line-clamp-2">{e.shortDescription}</p>}
      {facts && <p className="relative z-10 text-[11px] font-mono text-aurix-orange mt-1.5">{facts}</p>}
      {linkLabel && (
        <div className="relative z-10 flex items-center gap-1 text-[10px] font-mono text-krs-cyan mt-2 opacity-0 group-hover:opacity-100 group-focus-visible:opacity-100 transition-opacity">
          <span {...cmsLink}>{linkLabel}</span>
          <ChevronRight className="w-3 h-3" />
        </div>
      )}
    </Link>
  )
}

/** AURIX competitions around a centre circle (KRS home). Cards come from Events; every other text from the block. */
export async function CompetitionsHubBlock({ b, cms = NO_CMS }: { b: any; cms?: Cms }) {
  const events = (await withoutHiddenEvents(await getAllEvents()))
    .filter((e) => e.series === 'AURIX')
    .sort((x, y) => Number(Boolean(x.comingSoon)) - Number(Boolean(y.comingSoon)))
  const half = Math.ceil(events.length / 2)
  const facts = await aurixFacts()
  const centreText = fillFacts(b.centreText, facts)
  const general = (await getFormTexts()).general
  // Fee and team size as on the competition cards (CMS wording for "coming soon" / "registration open")
  const factsOf = (e: GenericEvent) =>
    [
      e.comingSoon ? general.comingSoon : e.registrationFee !== null ? `₹${e.registrationFee}${e.feeSuffix || b.feeSuffix || ''}` : general.registrationOpen,
      teamLine(e, b.teamPrefix || '', b.teamFallback || '', general.fmtSolo),
    ]
      .filter(Boolean)
      .join(' · ')
  const card = (e: GenericEvent, i: number, side: 'left' | 'right') => (
    <Card key={e.id} e={e} n={i + 1} side={side} linkLabel={b.cardLinkLabel} facts={factsOf(e)} cms={cms} cmsLink={cms('cardLinkLabel')} />
  )

  return (
    <section id={b.anchor || undefined} {...cms()} className="relative w-full py-12 sm:py-16 px-4 sm:px-6 lg:px-8 overflow-hidden bg-[#070a12] my-2">
      <div className="absolute inset-0 overflow-hidden pointer-events-none select-none" aria-hidden="true">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={optimizedSrc(mediaUrl(b.backgroundImage), 1920) || '/images/robotics-board.webp'} alt="" loading="lazy" className="w-full h-full object-cover object-center scale-105 filter blur-sm sm:blur-md opacity-30" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_55%,rgba(249,115,22,0.22)_0%,rgba(249,115,22,0.08)_35%,transparent_70%)]" />
        <div className="absolute top-1/3 left-[8%] w-[500px] h-[500px] rounded-full blur-[140px] bg-krs-cyan/15" />
        <div className="absolute bottom-1/3 right-[8%] w-[500px] h-[500px] rounded-full blur-[140px] bg-blue-600/15" />
        <div className="absolute inset-0 bg-gradient-to-b from-[#070a12] via-transparent to-[#070a12]" />
        <div className="absolute inset-0 bg-gradient-to-r from-[#070a12] via-transparent to-[#070a12]" />
        <div className="absolute inset-0 bg-tech-grid opacity-35" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[520px] h-[520px] rounded-full border border-aurix-orange/20" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[760px] h-[760px] rounded-full border border-dashed border-aurix-orange/15" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[1050px] h-[1050px] rounded-full border border-dashed border-krs-cyan/10" />
      </div>
      <div className="absolute top-0 left-1/4 right-1/4 h-[1px] bg-gradient-to-r from-transparent via-aurix-orange/50 to-transparent pointer-events-none" />
      <div className="absolute bottom-0 left-1/4 right-1/4 h-[1px] bg-gradient-to-r from-transparent via-krs-cyan/40 to-transparent pointer-events-none" />

      <div className="relative z-10 max-w-2xl mx-auto text-center mb-8 sm:mb-10 space-y-2">
        {b.eyebrow && (
          <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full border bg-aurix-orange/10 border-aurix-orange/30 text-aurix-orange text-[10px] font-mono tracking-wider uppercase" {...cms('eyebrow')}>
            {b.eyebrow}
          </div>
        )}
        <h2 className="text-3xl sm:text-4xl lg:text-[42px] font-black tracking-tight text-white leading-tight font-cinzel">
          <span {...cms('title')}>{b.title}</span>
          {b.titleAccent && (
            <>
              {' '}
              <span className="gradient-text-orange drop-shadow-[0_0_25px_rgba(249,115,22,0.5)]" {...cms('titleAccent')}>
                {b.titleAccent}
              </span>
            </>
          )}
        </h2>
        {b.intro && (
          <p className="text-slate-300 text-xs sm:text-sm max-w-lg mx-auto leading-relaxed font-light" {...cms('intro')}>
            {b.intro}
          </p>
        )}
      </div>

      <div className="relative z-10 max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-5 lg:gap-6 items-center">
        <div className="lg:col-span-4 space-y-3.5">{events.slice(0, half).map((e, i) => card(e, i, 'left'))}</div>

        <div className="lg:col-span-4 flex items-center justify-center py-4 lg:py-0 select-none">
          <div className="relative w-[260px] h-[260px] sm:w-[290px] sm:h-[290px] flex items-center justify-center">
            <div className="absolute inset-[-15px] rounded-full bg-aurix-orange/20 blur-xl animate-pulse pointer-events-none" />
            <div className="absolute inset-[-25px] rounded-full border border-dashed border-aurix-orange/30 animate-spin-slow pointer-events-none" />
            <div className="absolute inset-[-40px] rounded-full border border-aurix-orange/15 animate-spin-very-slow pointer-events-none" />
            <div className="relative z-10 w-full h-full rounded-full bg-gradient-to-b from-[#131b2e] via-[#0d1322] to-[#080c16] border-2 border-aurix-orange/50 shadow-[0_0_40px_rgba(249,115,22,0.35),inset_0_0_25px_rgba(249,115,22,0.15)] p-6 sm:p-7 flex flex-col items-center justify-center text-center">
              {b.centreBadge && (
                <span className="text-[9px] font-mono tracking-widest text-aurix-orange uppercase font-bold mb-1.5" {...cms('centreBadge')}>
                  {b.centreBadge}
                </span>
              )}
              <h3 className="text-2xl sm:text-3xl font-black font-cinzel text-white leading-tight mb-1.5 drop-shadow-[0_4px_20px_rgba(0,0,0,0.8)]">
                <span {...cms('centreTitle')}>{b.centreTitle}</span>
                {b.centreAccent && (
                  <>
                    <br />
                    <span className="text-aurix-orange" {...cms('centreAccent')}>
                      {b.centreAccent}
                    </span>
                  </>
                )}
              </h3>
              {centreText && (
                <p className="text-slate-300 text-[11px] sm:text-xs leading-relaxed max-w-[190px] mb-4 font-light" {...cms('centreText')}>
                  {centreText}
                </p>
              )}
              {b.centreButtonLabel && b.centreButtonHref && (
                <CmsLink
                  href={b.centreButtonHref}
                  attrs={cms('centreButtonLabel')}
                  className="inline-flex items-center gap-1.5 px-5 py-2 rounded-full bg-gradient-to-r from-amber-500 to-aurix-orange text-black font-bold text-[11px] uppercase font-mono tracking-wider shadow-[0_0_15px_rgba(249,115,22,0.6)] hover:shadow-[0_0_25px_rgba(249,115,22,0.9)] hover:scale-105 transition-all btn-shimmer"
                >
                  {b.centreButtonLabel}
                  <ArrowRight className="w-3 h-3" />
                </CmsLink>
              )}
            </div>
          </div>
        </div>

        <div className="lg:col-span-4 space-y-3.5">{events.slice(half).map((e, i) => card(e, half + i, 'right'))}</div>
      </div>
    </section>
  )
}
