import React from 'react'
import { Zap, Play, ArrowRight } from 'lucide-react'
import { NO_CMS, type Cms } from '@/lib/cms-attrs'
import { mediaUrl } from '@/lib/navigation'
import { optimizedSrc } from '@/lib/img'
import { BlockIcon, CmsLink } from './shared'

type Btn = { label: string; href: string; _i?: number }
type OrbitCard = { icon?: string; title: string; text?: string; _i: number }

const CARD_STYLE = [
  { pos: 'left', top: '22%', color: 'bg-krs-cyan/20', glow: 'shadow-krs-cyan/25 border-krs-cyan/30', delay: 0, duration: 4.2 },
  { pos: 'left', top: '54%', color: 'bg-blue-500/20', glow: 'shadow-blue-500/20 border-blue-500/25', delay: 0.8, duration: 5.1 },
  { pos: 'right', top: '24%', color: 'bg-amber-500/20', glow: 'shadow-amber-500/20 border-amber-400/30', delay: 1.4, duration: 3.8 },
  { pos: 'right', top: '56%', color: 'bg-violet-500/20', glow: 'shadow-violet-500/20 border-violet-400/30', delay: 0.5, duration: 4.6 },
] as const

function FloatCard({ card, i, cms }: { card: OrbitCard; i: number; cms: Cms }) {
  const st = CARD_STYLE[i]
  const left = st.pos === 'left'
  return (
    <div
      className={`absolute ${left ? 'left-[1.5%] lg:left-[3%] xl:left-[5%]' : 'right-[1.5%] lg:right-[3%] xl:right-[5%]'} hidden lg:block hero-float-card z-20`}
      style={{ top: st.top, animationDelay: `${st.delay}s`, animationDuration: `${st.duration}s` }}
      {...cms(`orbitCards.${card._i}`)}
    >
      <div
        className="absolute top-1/2 -translate-y-1/2 w-14 h-px pointer-events-none"
        style={{
          [left ? 'right' : 'left']: '-3.5rem',
          background: 'linear-gradient(to right, transparent, rgba(6,182,212,0.3), transparent)',
        }}
      />
      <div className={`relative flex items-start gap-3 p-3.5 rounded-2xl bg-krs-surface/80 backdrop-blur-xl border ${st.glow} shadow-lg w-[160px] sm:w-[182px] hover:scale-105 transition-transform duration-300`}>
        <div className={`flex-shrink-0 w-8 h-8 rounded-xl ${st.color} flex items-center justify-center text-krs-cyan`}>
          <BlockIcon name={card.icon} className="w-4 h-4" />
        </div>
        <div className="min-w-0">
          <p className="text-white text-xs font-semibold leading-snug" {...cms(`orbitCards.${card._i}.title`)}>{card.title}</p>
          {card.text && <p className="text-slate-400 text-[10px] leading-tight mt-0.5" {...cms(`orbitCards.${card._i}.text`)}>{card.text}</p>}
        </div>
        <div className="absolute bottom-0 left-3 right-3 h-px bg-gradient-to-r from-transparent via-krs-cyan/20 to-transparent rounded-full" />
      </div>
    </div>
  )
}

/** KRS home hero: title over a background robot, floating cards on wide screens. Every text comes from the block. */
export function HeroOrbitBlock({ b, cms = NO_CMS }: { b: any; cms?: Cms }) {
  const buttons: Btn[] = (b.buttons || []).filter((x: any) => x?.label && x?.href)
  const cards: OrbitCard[] = (b.orbitCards || []).map((c: any, i: number) => ({ ...c, _i: i })).filter((c: any) => c?.title).slice(0, 4)
  const bg = optimizedSrc(mediaUrl(b.image), 1080) || '/images/hero-robot.webp'
  const tagline: { item: string; highlight?: boolean; _i: number }[] = (b.tagline || []).map((t: any, i: number) => ({ ...t, _i: i })).filter((t: any) => t?.item)

  return (
    <section
      id={b.anchor || 'hero'}
      {...cms()}
      className="relative flex flex-col items-center justify-center min-h-[calc(100vh-5rem)] pt-4 sm:pt-6 md:pt-8 pb-14 sm:pb-20 px-4 sm:px-6 lg:px-8 overflow-hidden bg-krs-dark bg-tech-grid"
    >
      {/* Background: glow, rotating rings, robot artwork, scan line */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none select-none overflow-hidden z-0" aria-hidden="true">
        <div className="absolute w-[640px] h-[640px] rounded-full blur-[140px] bg-krs-cyan/20" />
        <div className="absolute w-[480px] h-[480px] rounded-full blur-[100px] bg-blue-600/15" />
        <div className="absolute w-[560px] h-[560px] sm:w-[680px] sm:h-[680px] rounded-full border border-dashed border-krs-cyan/20 animate-spin-slow" />
        <div className="absolute w-[760px] h-[760px] sm:w-[920px] sm:h-[920px] rounded-full border border-krs-cyan/10 animate-spin-very-slow" />
        <div className="absolute w-[1000px] h-[1000px] sm:w-[1200px] sm:h-[1200px] rounded-full border border-krs-cyan/5" />
        <div className="absolute w-[800px] h-px bg-gradient-to-r from-transparent via-krs-cyan/15 to-transparent" />
        <div className="absolute h-[800px] w-px bg-gradient-to-b from-transparent via-krs-cyan/15 to-transparent" />
        <div className="relative w-[340px] sm:w-[500px] md:w-[620px] lg:w-[740px] flex items-center justify-center">
          <div className="absolute top-[22%] left-1/2 -translate-x-1/2 w-48 h-24 bg-krs-cyan/35 blur-2xl rounded-full" />
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={bg}
            alt=""
            fetchPriority="high"
            className="w-full h-auto object-cover opacity-45 sm:opacity-50 lg:opacity-55 drop-shadow-[0_0_90px_rgba(6,182,212,0.35)] hero-robot-img"
            style={{
              maskImage: 'radial-gradient(ellipse 75% 75% at 50% 50%, black 35%, transparent 75%)',
              WebkitMaskImage: 'radial-gradient(ellipse 75% 75% at 50% 50%, black 35%, transparent 75%)',
            }}
            draggable={false}
          />
          <div className="absolute inset-0 overflow-hidden">
            <div className="hero-scan-line" />
          </div>
        </div>
        <div className="absolute inset-0 bg-gradient-to-b from-krs-dark/80 via-transparent to-krs-dark" />
      </div>

      <div className="absolute top-0 left-0 w-24 h-24 border-t-2 border-l-2 border-krs-cyan/30 pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-24 h-24 border-b-2 border-r-2 border-krs-cyan/30 pointer-events-none" />

      {b.badgeText && (
        <div className="absolute top-12 right-12 hidden lg:flex items-center justify-center hero-orbit-badge pointer-events-none" {...cms('badgeText')}>
          <svg viewBox="0 0 120 120" className="w-24 h-24 animate-spin-slow" aria-hidden="true">
            <defs>
              <path id="hero-badge-circle" d="M 60,60 m -42,0 a 42,42 0 1,1 84,0 a 42,42 0 1,1 -84,0" />
            </defs>
            <text fill="rgba(6,182,212,0.6)" fontSize="10" fontFamily="monospace" letterSpacing="3">
              <textPath href="#hero-badge-circle">{`${b.badgeText} • `}</textPath>
            </text>
          </svg>
          <span className="absolute text-krs-cyan text-lg" aria-hidden="true">✦</span>
        </div>
      )}

      {cards.map((card, i) => (
        <FloatCard key={card._i} card={card} i={i} cms={cms} />
      ))}

      {b.statValue && (
        <div className="absolute bottom-8 left-6 lg:left-12 hidden sm:block hero-stat-chip z-20" style={{ animationDelay: '1.2s' }}>
          <p className="text-white text-xs font-bold leading-tight" {...cms('statValue')}>{b.statValue}</p>
          {b.statLabel && <p className="text-slate-400 text-[10px] leading-tight" {...cms('statLabel')}>{b.statLabel}</p>}
        </div>
      )}
      {(b.noteTop || b.noteBottom) && (
        <div className="absolute bottom-8 right-6 lg:right-12 text-right hidden sm:block hero-stat-chip z-20" style={{ animationDelay: '1.8s' }}>
          {b.noteTop && <p className="text-slate-400 text-[11px] font-mono" {...cms('noteTop')}>{b.noteTop}</p>}
          {b.noteBottom && <p className="text-white text-xs font-semibold" {...cms('noteBottom')}>{b.noteBottom}</p>}
        </div>
      )}

      <div className="relative z-10 max-w-3xl mx-auto w-full flex flex-col items-center text-center">
        {b.eyebrow && (
          <div
            className="hero-animate hero-animate-1 inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border bg-krs-dark/85 backdrop-blur-md border-krs-cyan/40 text-krs-cyan text-[10px] sm:text-[11px] font-mono tracking-widest uppercase mb-4 shadow-[0_0_20px_rgba(6,182,212,0.2)]"
            {...cms('eyebrow')}
          >
            <Zap className="w-3.5 h-3.5 text-krs-cyan animate-pulse" />
            {b.eyebrow}
          </div>
        )}

        <div className="hero-animate hero-animate-2 space-y-2 mb-4">
          <h1 className="text-3xl sm:text-5xl lg:text-[4rem] font-cinzel font-black tracking-wider text-white uppercase leading-[1.08] drop-shadow-[0_8px_40px_rgba(0,0,0,0.95)]">
            <span {...cms('title')}>{b.title}</span>
            {b.titleAccent && (
              <>
                <br className="hidden sm:inline" />
                <span className="gradient-text-cyan drop-shadow-[0_0_40px_rgba(6,182,212,0.6)]" {...cms('titleAccent')}>
                  {' '}
                  {b.titleAccent}
                </span>
              </>
            )}
          </h1>
          <div className="flex justify-center pt-1.5">
            <span className="accent-line w-28 shadow-[0_0_12px_rgba(6,182,212,0.8)]" />
          </div>
        </div>

        {tagline.length > 0 && (
          <div className="hero-animate hero-animate-3 flex flex-wrap items-center justify-center gap-x-3 gap-y-1 sm:gap-x-5 text-xs sm:text-sm font-mono tracking-widest text-slate-300 font-semibold mb-4">
            {tagline.map((t, i) => (
              <React.Fragment key={t._i}>
                {i > 0 && <span className="text-krs-cyan opacity-60">•</span>}
                <span className={t.highlight ? 'text-krs-cyan' : ''} {...cms(`tagline.${t._i}.item`)}>
                  {t.item}
                </span>
              </React.Fragment>
            ))}
          </div>
        )}

        {b.intro && (
          <p
            className="hero-animate hero-animate-3 max-w-xl text-slate-200 text-sm sm:text-base leading-relaxed mb-7 drop-shadow-[0_4px_16px_rgba(0,0,0,0.9)] font-light px-2"
            {...cms('intro')}
          >
            {b.intro}
          </p>
        )}

        {buttons.length > 0 && (
          <div className="hero-animate hero-animate-4 flex flex-col sm:flex-row items-center justify-center gap-3.5 w-full sm:w-auto">
            {buttons.map((btn, i) =>
              i === 0 ? (
                <CmsLink
                  key={i}
                  href={btn.href}
                  attrs={cms(`buttons.${btn._i ?? i}`)}
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-3 rounded-xl bg-krs-cyan text-black font-bold text-xs sm:text-sm hover:bg-cyan-300 transition-all shadow-[0_0_25px_rgba(6,182,212,0.45)] hover:shadow-[0_0_35px_rgba(6,182,212,0.7)] btn-shimmer"
                >
                  {btn.label}
                  <ArrowRight className="w-4 h-4" />
                </CmsLink>
              ) : (
                <CmsLink
                  key={i}
                  href={btn.href}
                  attrs={cms(`buttons.${btn._i ?? i}`)}
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-7 py-3 rounded-xl bg-krs-dark/80 border border-white/20 text-white font-semibold text-xs sm:text-sm hover:bg-white/10 hover:border-krs-cyan/60 transition-all backdrop-blur-md shadow-lg"
                >
                  <span className="flex items-center justify-center w-6 h-6 rounded-full border border-krs-cyan/40 bg-krs-cyan/15">
                    <Play className="w-2.5 h-2.5 text-krs-cyan fill-krs-cyan" />
                  </span>
                  {btn.label}
                </CmsLink>
              ),
            )}
          </div>
        )}
      </div>
    </section>
  )
}
