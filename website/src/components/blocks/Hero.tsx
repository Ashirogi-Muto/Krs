import React from 'react'
import { NO_CMS, type Cms } from '@/lib/cms-attrs'
import { optimizedSrc } from '@/lib/img'
import { AurixMark } from '@/components/aurix/AurixMark'
import { ArrowRight, Zap } from 'lucide-react'
import { Countdown } from '@/components/aurix/Countdown'
import { getAllEvents } from '@/lib/data/events'
import { formatINR } from '@/lib/format'
import { mediaUrl } from '@/lib/navigation'
import { aurixDates, aurixPrizePool } from './aurix'
import { CmsLink } from './shared'
import { getEventLabels } from '@/lib/event-labels'
import { getFormTexts } from '@/lib/form-texts'
import { countdownWords } from '@/lib/event-labels-defaults'
import { getSponsorData } from '@/lib/sponsors'
import { HeroSponsors } from '@/components/aurix/HeroSponsors'

type Btn = { label: string; href: string; style?: string }

/** Full-height title section (KRS or AURIX look) — Yodha-style premium design. */
export async function HeroBlock({ b, cms = NO_CMS }: { b: any; cms?: Cms }) {
  const aurix = b.theme === 'aurix'
  const raw: { item: string; highlight?: boolean; _i: number }[] = (b.tagline || []).map((t: any, i: number) => ({ ...t, _i: i })).filter((t: any) => t?.item)
  const needs = (k: string) => raw.some((t) => t.item.includes(k))
  const dates = needs('{dates}') ? await aurixDates() : ''
  const pool = needs('{prizePool}') ? await aurixPrizePool() : 0
  const tagline = raw
    .filter((t) => !(t.item.includes('{prizePool}') && !pool))
    .map((t) => ({ ...t, item: t.item.replace(/\{dates\}/g, dates).replace(/\{prizePool\}/g, pool ? formatINR(pool) : '') }))
  const imageSrc = mediaUrl(b.image) || (b.builtinImage === 'aurix-logo-full' ? '/images/aurix-logo-full.png' : undefined)
  let countdownTarget: string | undefined
  if (b.showCountdown) {
    const events = (await getAllEvents()).filter((e) => e.series === 'AURIX' && e.startDate)
    countdownTarget = events.map((e) => e.startDate).sort()[0]
  }

  const btnClass = (btn: Btn) => {
    if (btn.style === 'secondary')
      return aurix
        ? 'w-full sm:w-auto inline-flex items-center justify-center gap-2 px-7 py-3.5 rounded-xl bg-white/5 border border-white/10 text-white text-xs font-mono uppercase hover:bg-white/10 hover:border-aurix-orange/50 transition-all backdrop-blur-sm'
        : 'w-full sm:w-auto inline-flex items-center justify-center gap-2 px-7 py-3.5 rounded-xl bg-white/5 border border-white/10 text-white font-semibold text-sm hover:bg-white/10 hover:border-krs-cyan/50 transition-all backdrop-blur-sm'
    if (btn.style === 'link') return `inline-flex items-center gap-2 text-sm font-mono hover:underline ${aurix ? 'text-aurix-orange' : 'text-krs-cyan'}`
    return aurix
      ? 'w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-3.5 rounded-xl bg-aurix-orange text-black font-semibold text-xs font-mono uppercase hover:bg-orange-400 transition-all shadow-lg shadow-aurix-orange/30 btn-shimmer'
      : 'w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-3.5 rounded-xl bg-krs-cyan text-black font-bold text-sm hover:bg-cyan-400 transition-all shadow-lg shadow-krs-cyan/30 btn-shimmer'
  }

  return (
    <section
      id={b.anchor || undefined} {...cms()}
      className={`relative flex items-center justify-center px-4 sm:px-6 lg:px-8 overflow-hidden ${
        aurix ? 'min-h-[80vh] pt-16 pb-12 bg-aurix-grid' : 'min-h-[88vh] pt-20 pb-16 bg-tech-grid'
      }`}
    >
      {/* Ambient orbs */}
      <div className={`absolute top-0 left-1/4 w-[500px] h-[500px] rounded-full blur-[120px] pointer-events-none opacity-30 ${aurix ? 'bg-aurix-orange/20' : 'bg-krs-cyan/15'}`} />
      <div className={`absolute bottom-0 right-1/4 w-[400px] h-[400px] rounded-full blur-[100px] pointer-events-none opacity-20 ${aurix ? 'bg-orange-600/20' : 'bg-blue-600/20'}`} />
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-krs-dark/60 pointer-events-none" />

      {/* Corner accent lines */}
      {!aurix && (
        <>
          <div className="absolute top-0 left-0 w-24 h-24 border-t border-l border-krs-cyan/20 pointer-events-none" />
          <div className="absolute bottom-0 right-0 w-24 h-24 border-b border-r border-krs-cyan/20 pointer-events-none" />
        </>
      )}

      <div className="max-w-5xl mx-auto text-center relative z-10 space-y-8">
        {/* Logo image */}
        {imageSrc && (
          <div className="hero-animate hero-animate-1 flex justify-center">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={optimizedSrc(imageSrc, 640)}
              alt={(b.image && typeof b.image === 'object' && b.image.alt) || (await getFormTexts()).general.heroImageAlt}
              width={520} height={485}
              className={`mx-auto h-32 sm:h-44 w-auto ${aurix ? 'drop-shadow-[0_0_40px_rgba(249,115,22,0.3)]' : 'drop-shadow-[0_0_40px_rgba(6,182,212,0.35)]'}`}
            />
          </div>
        )}

        {/* Eyebrow badge */}
        {b.eyebrow && (
          <div className="hero-animate hero-animate-1 flex justify-center" {...cms('eyebrow')}>
            <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full border text-[11px] font-mono tracking-wider uppercase ${
              aurix ? 'bg-aurix-orange/10 border-aurix-orange/30 text-aurix-orange' : 'bg-krs-cyan/10 border-krs-cyan/30 text-krs-cyan'
            }`}>
              {aurix ? <AurixMark className="w-3.5 h-3.5" /> : <Zap className="w-3 h-3" />}
              {b.eyebrow}
            </div>
          </div>
        )}

        {/* Main title */}
        {(b.title || b.titleAccent) && (
          <div className="hero-animate hero-animate-2 space-y-3">
            <h1 className={`text-4xl sm:text-6xl lg:text-7xl ${aurix ? 'font-display font-extrabold' : 'font-cinzel font-black tracking-wider'} text-white uppercase leading-[1.08] drop-shadow-[0_4px_30px_rgba(6,182,212,0.25)]`} {...cms('title')}>
              {b.title}
              {b.titleAccent && (
                <>
                  {' '}
                  <br className="hidden sm:inline" />
                  <span
                    className={`${aurix ? 'text-aurix-orange' : 'gradient-text-cyan drop-shadow-[0_0_25px_rgba(6,182,212,0.5)]'}`}
                    {...cms('titleAccent')}
                  >
                    {b.titleAccent}
                  </span>
                </>
              )}
            </h1>
            {/* Accent underline */}
            <div className="flex justify-center pt-2">
              <span className="accent-line" />
            </div>
          </div>
        )}

        {/* Tagline */}
        {tagline.length > 0 && (
          <div
            className={`hero-animate hero-animate-3 flex flex-wrap items-center justify-center gap-3 sm:gap-6 text-xs sm:text-sm font-mono tracking-widest font-semibold py-2 ${
              aurix ? 'uppercase' : ''
            }`}
          >
            {tagline.map((t, i) => (
              <React.Fragment key={i}>
                {i > 0 && <span className={aurix ? 'text-aurix-orange opacity-60' : 'text-krs-cyan opacity-60'}>•</span>}
                <span className={`${aurix ? 'uppercase' : ''} ${t.highlight ? (aurix ? 'text-aurix-orange' : 'text-krs-cyan') : 'text-slate-300'}`} {...cms(`tagline.${t._i}.item`)}>{t.item}</span>
              </React.Fragment>
            ))}
          </div>
        )}

        {/* Intro text */}
        {b.intro && (
          <p className="hero-animate hero-animate-3 max-w-2xl mx-auto text-slate-300 text-base sm:text-lg leading-relaxed" {...cms('intro')}>
            {b.intro}
          </p>
        )}

        {/* Countdown */}
        {countdownTarget && (
          <div className="hero-animate hero-animate-4 pt-2 flex justify-center">
            <Countdown targetDate={countdownTarget} label={b.countdownLabel || undefined} words={countdownWords(await getEventLabels())} />
          </div>
        )}

        {/* Buttons */}
        {(b.buttons || []).length > 0 && (
          <div className="hero-animate hero-animate-4 flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
            {(b.buttons as Btn[]).map((btn) => (
              <CmsLink key={btn.href + btn.label} attrs={cms(`buttons.${(btn as any)._i ?? 0}.label`)} href={btn.href} className={btnClass(btn)}>
                {!aurix && btn.style === 'secondary' && btn.href.startsWith('/aurix') && <AurixMark className="w-4 h-4" />}
                {btn.label}
                {(btn.style || 'primary') === 'primary' && <ArrowRight className="w-4 h-4" />}
              </CmsLink>
            ))}
          </div>
        )}
        {/* Glass stat pills */}
        {tagline.length > 0 && !b.intro && (
          <div className="hero-animate hero-animate-5 flex flex-wrap justify-center gap-4 pt-4">
            {tagline.slice(0, 3).map((t, i) => (
              <div key={i} className="stat-pill px-5 py-3 flex flex-col items-center gap-0.5">
                <span className={`text-lg font-display font-bold ${aurix ? 'text-aurix-orange' : 'text-krs-cyan'}`}>{t.item.split(' ')[0]}</span>
                <span className="text-[11px] font-mono text-slate-400 uppercase tracking-wider">{t.item.split(' ').slice(1).join(' ')}</span>
              </div>
            ))}
          </div>
        )}

        {/* AURIX look only: small logos of the sponsors ticked for the hero (Site settings) */}
        {aurix && <HeroSponsors {...(await heroSponsors())} preview={cms !== NO_CMS} />}
      </div>
    </section>
  )
}

async function heroSponsors() {
  const { sponsors, heroLabel } = await getSponsorData()
  return { sponsors, label: heroLabel }
}
