import React from 'react'
import { NO_CMS, type Cms } from '@/lib/cms-attrs'
import { optimizedSrc } from '@/lib/img'
import { AurixMark } from '@/components/aurix/AurixMark'
import { ArrowRight } from 'lucide-react'
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

/** Full-height title section (KRS or AURIX look). */
export async function HeroBlock({ b, cms = NO_CMS }: { b: any; cms?: Cms }) {
  const aurix = b.theme === 'aurix'
  // Tagline items may use {dates} / {prizePool} (live from Events); an item whose value is empty is dropped
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
        ? 'w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-lg bg-aurix-surface border border-aurix-border text-white text-xs font-mono uppercase hover:border-aurix-orange transition-colors'
        : 'w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-lg bg-aurix-surface border border-aurix-border text-aurix-orange font-semibold text-sm hover:border-aurix-orange transition-all'
    if (btn.style === 'link') return `inline-flex items-center gap-2 text-sm font-mono hover:underline ${aurix ? 'text-aurix-orange' : 'text-krs-cyan'}`
    return aurix
      ? 'w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-3.5 rounded-lg bg-aurix-orange text-black font-semibold text-xs font-mono uppercase hover:bg-orange-400 transition-colors shadow-lg shadow-aurix-orange/20'
      : 'w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-lg bg-krs-cyan text-black font-semibold text-sm hover:bg-cyan-400 transition-colors shadow-lg shadow-krs-cyan/20'
  }

  return (
    <section
      id={b.anchor || undefined} {...cms()}
      className={`relative flex items-center justify-center px-4 sm:px-6 lg:px-8 overflow-hidden ${
        aurix ? 'min-h-[80vh] pt-16 pb-12 bg-aurix-grid border-b border-aurix-border' : 'min-h-[85vh] pt-20 pb-16 bg-tech-grid'
      }`}
    >
      <div
        className={`absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[350px] blur-[130px] rounded-full pointer-events-none ${
          aurix ? 'bg-aurix-orange/10' : 'bg-krs-cyan/10'
        }`}
      />
      <div className="max-w-5xl mx-auto text-center relative z-10 space-y-6">
        {imageSrc && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={optimizedSrc(imageSrc, 640)}
            alt={(b.image && typeof b.image === 'object' && b.image.alt) || (await getFormTexts()).general.heroImageAlt}
            width={520}
            height={485}
            className="mx-auto h-32 sm:h-44 w-auto drop-shadow-[0_0_30px_rgba(56,189,248,0.25)]"
          />
        )}
        {b.eyebrow && (
          <div
            className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full border text-[11px] font-mono tracking-wider uppercase shadow-sm ${
              aurix ? 'bg-aurix-surface border-aurix-border text-aurix-orange' : 'bg-krs-surface border-krs-border text-krs-cyan'
            }`}
            {...cms('eyebrow')}
          >
            {aurix ? <AurixMark className="w-4 h-4" /> : <span className="w-2 h-2 rounded-full animate-pulse bg-krs-cyan" />}
            {b.eyebrow}
          </div>
        )}

        {(b.title || b.titleAccent) && (
          <h1 className="text-4xl sm:text-6xl lg:text-7xl font-display font-extrabold tracking-tight text-white uppercase leading-[1.08]" {...cms('title')}>
            {b.title}
            {b.titleAccent && (
              <>
                {' '}
                <br className="hidden sm:inline" />
                <span
                  className={`text-transparent bg-clip-text bg-gradient-to-r ${
                    aurix ? 'from-aurix-orange via-white to-aurix-orange' : 'from-krs-cyan via-white to-krs-cyan'
                  }`}
                  {...cms('titleAccent')}
                >
                  {b.titleAccent}
                </span>
              </>
            )}
          </h1>
        )}

        {tagline.length > 0 && (
          <div
            className={
              aurix
                ? 'flex flex-wrap items-center justify-center gap-x-3 gap-y-1 sm:gap-x-6 text-xs sm:text-sm font-mono tracking-widest text-slate-300 font-bold py-1'
                : 'flex flex-wrap items-center justify-center gap-3 sm:gap-6 text-xs sm:text-sm font-mono tracking-widest text-slate-400 font-semibold py-2'
            }
          >
            {tagline.map((t, i) => (
              <React.Fragment key={i}>
                {i > 0 && <span className={aurix ? 'text-aurix-orange' : 'text-krs-cyan'}>•</span>}
                <span className={`${aurix ? 'uppercase' : ''} ${t.highlight ? (aurix ? 'text-aurix-orange' : 'text-krs-cyan') : ''}`} {...cms(`tagline.${t._i}.item`)}>{t.item}</span>
              </React.Fragment>
            ))}
          </div>
        )}

        {b.intro && <p className="max-w-2xl mx-auto text-slate-300 text-sm sm:text-base leading-relaxed" {...cms('intro')}>{b.intro}</p>}

        {countdownTarget && (
          <div className="pt-2 flex justify-center">
            <Countdown targetDate={countdownTarget} label={b.countdownLabel || undefined} words={countdownWords(await getEventLabels())} />
          </div>
        )}

        {(b.buttons || []).length > 0 && (
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
            {(b.buttons as Btn[]).map((btn) => (
              <CmsLink key={btn.href + btn.label} attrs={cms(`buttons.${(btn as any)._i ?? 0}.label`)} href={btn.href} className={btnClass(btn)}>
                {!aurix && btn.style === 'secondary' && btn.href.startsWith('/aurix') && <AurixMark className="w-4 h-4" />}
                {btn.label}
                {(btn.style || 'primary') === 'primary' && <ArrowRight className="w-4 h-4" />}
              </CmsLink>
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
