import React from 'react'
import { RotateCw, ArrowRight, CheckCircle2 } from 'lucide-react'
import { NO_CMS, type Cms } from '@/lib/cms-attrs'
import { mediaUrl } from '@/lib/navigation'
import { optimizedSrc } from '@/lib/img'
import { CmsLink } from './shared'
import { FlipCard } from './DisciplinesFlip'

const BUILT_IN_IMAGES = ['/images/pillar-lab.webp', '/images/pillar-arena.webp', '/images/pillar-code.webp']
const TILT = ['-rotate-2 hover:rotate-0', 'rotate-1 hover:rotate-0', '-rotate-1 hover:rotate-0']
const FACE =
  'w-full h-full bg-[#0b101d] text-white p-6 sm:p-7 rounded-t-lg torn-paper-edge shadow-[0_20px_50px_rgba(0,0,0,0.8),0_0_20px_rgba(6,182,212,0.15)] border flex flex-col relative'

function Pushpin() {
  return (
    <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 z-30 pointer-events-none select-none flex items-center justify-center" aria-hidden="true">
      <div className="absolute top-2 left-2 w-4 h-4 bg-black/60 rounded-full blur-[2px]" />
      <div className="relative w-6 h-6 rounded-full bg-gradient-to-br from-[#ff5252] via-[#e50914] to-[#67000b] shadow-[0_0_15px_rgba(229,9,20,0.65),0_4px_8px_rgba(0,0,0,0.8)] border border-[#ff8585]/50 flex items-center justify-center">
        <div className="absolute top-1 left-1.5 w-2 h-1.5 bg-white/80 rounded-full blur-[0.3px]" />
        <div className="w-1.5 h-1.5 rounded-full bg-white/90 shadow-[0_0_6px_#ffffff]" />
      </div>
    </div>
  )
}

/** Pinned cards that flip to show a list (KRS home "pillars"). Every text comes from the block. */
export function DisciplinesBlock({ b, cms = NO_CMS }: { b: any; cms?: Cms }) {
  const cards = (b.cards || []).map((c: any, i: number) => ({ ...c, _i: i })).filter((c: any) => c?.title)

  return (
    <section
      id={b.anchor || undefined}
      {...cms()}
      className="relative w-full py-10 sm:py-14 px-4 sm:px-6 lg:px-8 rounded-2xl overflow-hidden bg-krs-dark/95 border border-krs-cyan/25 shadow-[0_16px_60px_rgba(0,0,0,0.7),inset_0_0_60px_rgba(6,182,212,0.05)] bg-tech-grid"
    >
      <div className="absolute top-0 left-1/4 w-[500px] h-[500px] rounded-full blur-[140px] bg-krs-cyan/15 pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] rounded-full blur-[140px] bg-blue-600/10 pointer-events-none" />
      <div className="absolute top-0 left-0 w-16 h-16 border-t-2 border-l-2 border-krs-cyan/40 pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-16 h-16 border-b-2 border-r-2 border-krs-cyan/40 pointer-events-none" />

      <div className="relative z-10 max-w-2xl mx-auto text-center mb-8 sm:mb-10 space-y-2">
        {b.eyebrow && (
          <div
            className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full border bg-krs-cyan/10 border-krs-cyan/30 text-krs-cyan text-[10px] font-mono tracking-wider uppercase mb-1"
            {...cms('eyebrow')}
          >
            {b.eyebrow}
          </div>
        )}
        <h2 className="text-3xl sm:text-4xl lg:text-[42px] font-black tracking-tight text-white leading-tight font-cinzel">
          <span {...cms('title')}>{b.title}</span>
          {b.titleAccent && (
            <>
              {' '}
              <span className="gradient-text-cyan drop-shadow-[0_0_25px_rgba(6,182,212,0.5)] font-normal" {...cms('titleAccent')}>
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

      <div className="relative z-10 max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8 items-start">
        {cards.map((card: any, i: number) => {
          const c = (f: string) => cms(`cards.${card._i}.${f}`)
          const img = optimizedSrc(mediaUrl(card.image), 640) || BUILT_IN_IMAGES[i % BUILT_IN_IMAGES.length]
          const specs = (card.specs || []).map((s: any, j: number) => ({ item: s?.item, _j: j })).filter((s: any) => s.item)
          const front = (
            <div className={`${FACE} border-krs-cyan/30`}>
              <Pushpin />
              <div className="text-center pt-2 mb-5">
                <h3 className="inline-block text-krs-cyan font-bold text-base sm:text-lg tracking-wide border-b-2 border-krs-cyan/80 pb-0.5 drop-shadow-[0_0_10px_rgba(6,182,212,0.4)]" {...c('title')}>
                  {card.title}
                </h3>
              </div>
              <div className="relative w-full aspect-[4/3] rounded bg-black/60 overflow-hidden border border-krs-cyan/25 shadow-inner mb-5 select-none" {...c('image')}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={img}
                  alt=""
                  loading="lazy"
                  className="w-full h-full object-cover grayscale contrast-125 brightness-90 group-hover:scale-105 group-hover:brightness-100 transition-all duration-500"
                  draggable={false}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent pointer-events-none" />
              </div>
              {card.caption && (
                <p className="text-slate-300 text-xs sm:text-[13px] leading-relaxed text-center font-normal px-1 mb-4 flex-grow" {...c('caption')}>
                  {card.caption}
                </p>
              )}
              {b.flipHint && (
                <div className="mt-auto pt-2 border-t border-dashed border-white/10 flex items-center justify-center gap-1.5 text-[11px] font-mono text-slate-400 group-hover:text-krs-cyan transition-colors pb-3">
                  <RotateCw className="w-3 h-3 text-krs-cyan" />
                  <span {...cms('flipHint')}>{b.flipHint}</span>
                </div>
              )}
            </div>
          )
          const back = (
            <div className={`${FACE} border-krs-cyan/40 justify-between`}>
              <Pushpin />
              <div>
                <div className="text-center pt-2 mb-4">
                  {b.backBadge && (
                    <span className="text-[10px] font-mono text-krs-cyan uppercase tracking-widest block mb-0.5" {...cms('backBadge')}>
                      {b.backBadge}
                    </span>
                  )}
                  {card.backTitle && (
                    <h4 className="text-white font-bold text-base sm:text-lg tracking-tight border-b-2 border-krs-cyan/80 pb-0.5 inline-block" {...c('backTitle')}>
                      {card.backTitle}
                    </h4>
                  )}
                </div>
                {card.backText && (
                  <p className="text-slate-400 text-xs leading-relaxed text-center mb-5" {...c('backText')}>
                    {card.backText}
                  </p>
                )}
                {specs.length > 0 && (
                  <ul className="space-y-2.5 bg-black/40 p-3.5 rounded-lg border border-white/10 mb-4">
                    {specs.map((s: any) => (
                      <li key={s._j} className="flex items-start gap-2 text-xs text-slate-200">
                        <CheckCircle2 className="w-3.5 h-3.5 text-krs-cyan flex-shrink-0 mt-0.5" />
                        <span className="leading-tight font-medium" {...c(`specs.${s._j}.item`)}>
                          {s.item}
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
              {card.linkLabel && card.linkHref && (
                <div className="pt-2 pb-3">
                  <CmsLink
                    href={card.linkHref}
                    attrs={c('linkLabel')}
                    className="w-full inline-flex items-center justify-center gap-1.5 py-2.5 px-4 rounded-lg bg-krs-cyan text-black hover:bg-cyan-300 text-xs font-bold transition-all shadow-[0_0_15px_rgba(6,182,212,0.4)] btn-shimmer"
                  >
                    {card.linkLabel}
                    <ArrowRight className="w-3.5 h-3.5" />
                  </CmsLink>
                </div>
              )}
            </div>
          )
          return <FlipCard key={card._i} front={front} back={back} tilt={TILT[i % TILT.length]} attrs={cms(`cards.${card._i}`)} />
        })}
      </div>
    </section>
  )
}
