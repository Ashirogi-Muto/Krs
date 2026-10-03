import React from 'react'
import { ArrowRight, Flame } from 'lucide-react'
import { Countdown } from '@/components/aurix/Countdown'
import { getAllEvents } from '@/lib/data/events'
import { CmsLink } from './shared'

type Btn = { label: string; href: string; style?: string }

/** Full-height title section (KRS or AURIX look). */
export async function HeroBlock({ b }: { b: any }) {
  const aurix = b.theme === 'aurix'
  const tagline: string[] = (b.tagline || []).map((t: any) => t.item).filter(Boolean)
  let countdownTarget: string | undefined
  if (b.showCountdown) {
    const events = (await getAllEvents()).filter((e) => e.series === 'AURIX' && e.startDate)
    countdownTarget = events.map((e) => e.startDate).sort()[0]
  }

  const btnClass = (btn: Btn) => {
    if (btn.style === 'secondary')
      return aurix
        ? 'w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-lg bg-aurix-dark border border-aurix-border text-white font-semibold text-sm hover:border-aurix-orange transition-all'
        : 'w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-lg bg-aurix-surface border border-aurix-border text-aurix-orange font-semibold text-sm hover:border-aurix-orange transition-all'
    if (btn.style === 'link') return `inline-flex items-center gap-2 text-sm font-mono hover:underline ${aurix ? 'text-aurix-orange' : 'text-krs-cyan'}`
    return aurix
      ? 'w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-lg bg-aurix-orange text-black font-semibold text-sm hover:bg-orange-400 transition-colors shadow-lg shadow-aurix-orange/20'
      : 'w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-lg bg-krs-cyan text-black font-semibold text-sm hover:bg-cyan-400 transition-colors shadow-lg shadow-krs-cyan/20'
  }

  return (
    <section
      id={b.anchor || undefined}
      className={`relative min-h-[85vh] flex items-center justify-center pt-20 pb-16 px-4 sm:px-6 lg:px-8 overflow-hidden ${aurix ? 'bg-aurix-grid' : 'bg-tech-grid'}`}
    >
      <div
        className={`absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[350px] blur-[130px] rounded-full pointer-events-none ${
          aurix ? 'bg-aurix-orange/10' : 'bg-krs-cyan/10'
        }`}
      />
      <div className="max-w-5xl mx-auto text-center relative z-10 space-y-6">
        {b.eyebrow && (
          <div
            className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full border text-[11px] font-mono tracking-wider uppercase shadow-sm ${
              aurix ? 'bg-aurix-surface border-aurix-border text-aurix-orange' : 'bg-krs-surface border-krs-border text-krs-cyan'
            }`}
          >
            <span className={`w-2 h-2 rounded-full animate-pulse ${aurix ? 'bg-aurix-orange' : 'bg-krs-cyan'}`} />
            {b.eyebrow}
          </div>
        )}

        {(b.title || b.titleAccent) && (
          <h1 className="text-4xl sm:text-6xl lg:text-7xl font-display font-extrabold tracking-tight text-white uppercase leading-[1.08]">
            {b.title}
            {b.titleAccent && (
              <>
                {' '}
                <br className="hidden sm:inline" />
                <span
                  className={`text-transparent bg-clip-text bg-gradient-to-r ${
                    aurix ? 'from-aurix-orange via-white to-aurix-orange' : 'from-krs-cyan via-white to-krs-cyan'
                  }`}
                >
                  {b.titleAccent}
                </span>
              </>
            )}
          </h1>
        )}

        {tagline.length > 0 && (
          <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-6 text-xs sm:text-sm font-mono tracking-widest text-slate-400 font-semibold py-2">
            {tagline.map((t, i) => (
              <React.Fragment key={i}>
                {i > 0 && <span className={aurix ? 'text-aurix-orange' : 'text-krs-cyan'}>•</span>}
                <span>{t}</span>
              </React.Fragment>
            ))}
          </div>
        )}

        {b.intro && <p className="max-w-2xl mx-auto text-slate-300 text-sm sm:text-base leading-relaxed">{b.intro}</p>}

        {countdownTarget && (
          <div className="pt-2 flex justify-center">
            <Countdown targetDate={countdownTarget} label={b.countdownLabel || undefined} />
          </div>
        )}

        {(b.buttons || []).length > 0 && (
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
            {(b.buttons as Btn[]).map((btn) => (
              <CmsLink key={btn.href + btn.label} href={btn.href} className={btnClass(btn)}>
                {!aurix && btn.style === 'secondary' && btn.href.startsWith('/aurix') && <Flame className="w-4 h-4 text-aurix-orange" />}
                {btn.label}
                {(btn.style || 'primary') === 'primary' && <ArrowRight className="w-4 h-4" />}
              </CmsLink>
            ))}
          </div>
        )}
      </div>
    </section>
  )
}
