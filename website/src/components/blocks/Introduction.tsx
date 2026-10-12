import React from 'react'
import { ChevronRight, Sparkles } from 'lucide-react'
import { NO_CMS, type Cms } from '@/lib/cms-attrs'
import { mediaUrl } from '@/lib/navigation'
import { optimizedSrc } from '@/lib/img'
import { BlockIcon, CmsLink, container } from './shared'

const PILLAR_STYLE = [
  { box: 'bg-krs-cyan/10 border-krs-cyan/30 text-krs-cyan', title: 'group-hover:text-cyan-300' },
  { box: 'bg-blue-500/10 border-blue-500/30 text-blue-400', title: 'group-hover:text-blue-300' },
  { box: 'bg-amber-500/10 border-amber-500/30 text-amber-400', title: 'group-hover:text-amber-300' },
  { box: 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400', title: 'group-hover:text-emerald-300' },
]

/** KRS home "about": photo card on the left, pillar cards and tags on the right. Every text comes from the block. */
export function IntroductionBlock({ b, cms = NO_CMS }: { b: any; cms?: Cms }) {
  const chips = (b.chips || []).map((c: any, i: number) => ({ item: c?.item, _i: i })).filter((c: any) => c.item)
  const pillars = (b.pillars || []).map((p: any, i: number) => ({ ...p, _i: i })).filter((p: any) => p?.title)
  const img = optimizedSrc(mediaUrl(b.image), 1080) || '/images/krs-lab.webp'
  const alt = b.imageAlt || (b.image && typeof b.image === 'object' && b.image.alt) || ''

  return (
    <section id={b.anchor || undefined} {...cms()} className={`${container} py-8 sm:py-12 scroll-mt-24`}>
      <div className="flex flex-col items-center text-center mb-10 sm:mb-12">
        {b.eyebrow && (
          <span className="text-[11px] font-mono text-krs-cyan uppercase tracking-widest mb-2.5" {...cms('eyebrow')}>
            {b.eyebrow}
          </span>
        )}
        <h2 className="text-3xl sm:text-4xl md:text-[44px] font-display font-black text-white tracking-tight leading-tight">
          <span {...cms('title')}>{b.title}</span>
          {b.titleAccent && (
            <>
              {' '}
              <span className="relative inline-block text-rose-500" {...cms('titleAccent')}>
                {b.titleAccent}
                <span className="absolute -bottom-1 left-0 right-0 h-[3px] bg-rose-500/80 rounded-full shadow-[0_0_12px_rgba(244,63,94,0.7)]" />
              </span>
            </>
          )}
        </h2>
        {b.intro && (
          <p className="max-w-2xl mx-auto text-slate-300 text-sm sm:text-base leading-relaxed mt-4 font-normal px-2" {...cms('intro')}>
            {b.intro}
          </p>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center max-w-6xl mx-auto">
        <div className="lg:col-span-6 flex flex-col reveal-left">
          <div className="relative rounded-3xl p-3 sm:p-4 bg-[#0b101e]/95 border border-white/10 hover:border-krs-cyan/40 shadow-[0_16px_50px_rgba(0,0,0,0.65)] backdrop-blur-xl transition-all duration-300 group overflow-hidden">
            <div className="absolute -top-24 -left-24 w-64 h-64 rounded-full blur-[85px] bg-krs-cyan/15 pointer-events-none" />
            <div className="absolute -bottom-24 -right-24 w-64 h-64 rounded-full blur-[85px] bg-rose-500/10 pointer-events-none" />
            <div className="absolute top-2.5 left-2.5 w-6 h-6 border-t-2 border-l-2 border-krs-cyan/60 pointer-events-none z-20" />
            <div className="absolute top-2.5 right-2.5 w-6 h-6 border-t-2 border-r-2 border-krs-cyan/60 pointer-events-none z-20" />
            <div className="absolute bottom-2.5 left-2.5 w-6 h-6 border-b-2 border-l-2 border-krs-cyan/60 pointer-events-none z-20" />
            <div className="absolute bottom-2.5 right-2.5 w-6 h-6 border-b-2 border-r-2 border-krs-cyan/60 pointer-events-none z-20" />

            <div className="relative rounded-2xl overflow-hidden aspect-[4/3] bg-slate-950 border border-white/10" {...cms('image')}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={img}
                alt={alt}
                loading="lazy"
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out"
              />
              {b.imageBadge && (
                <div
                  className="absolute top-3.5 left-3.5 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-black/80 backdrop-blur-md border border-krs-cyan/50 text-krs-cyan text-[10px] font-mono font-bold uppercase tracking-wider shadow-lg"
                  {...cms('imageBadge')}
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-krs-cyan animate-pulse" />
                  {b.imageBadge}
                </div>
              )}
              {(b.imageCaptionTitle || b.imageCaptionText) && (
                <div className="absolute inset-x-0 bottom-0 p-4 sm:p-5 bg-gradient-to-t from-[#070a12] via-[#070a12]/80 to-transparent flex flex-col justify-end">
                  {b.imageCaptionTitle && (
                    <div className="flex items-center gap-2 mb-1">
                      <Sparkles className="w-3.5 h-3.5 text-cyan-300" />
                      <span className="text-[11px] font-mono uppercase tracking-widest text-cyan-300 font-semibold" {...cms('imageCaptionTitle')}>
                        {b.imageCaptionTitle}
                      </span>
                    </div>
                  )}
                  {b.imageCaptionText && (
                    <p className="text-xs sm:text-[13px] text-slate-200 font-medium" {...cms('imageCaptionText')}>
                      {b.imageCaptionText}
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>
          {b.note && (
            <div className="flex items-center gap-2.5 mt-3.5 px-2">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.9)] animate-pulse shrink-0" />
              <span className="text-xs text-slate-400 font-mono" {...cms('note')}>
                {b.note}
              </span>
            </div>
          )}
        </div>

        <div className="lg:col-span-6 flex flex-col justify-between space-y-6">
          {pillars.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 sm:gap-6">
              {pillars.map((p: any, i: number) => {
                const st = PILLAR_STYLE[i % PILLAR_STYLE.length]
                return (
                  <div
                    key={p._i}
                    className="p-4 sm:p-5 rounded-2xl bg-[#0c1222]/85 border border-white/10 hover:border-krs-cyan/40 transition-all duration-300 group reveal"
                    {...cms(`pillars.${p._i}`)}
                  >
                    <div className={`w-9 h-9 rounded-xl border flex items-center justify-center mb-3.5 group-hover:scale-110 transition-transform ${st.box}`}>
                      <BlockIcon name={p.icon} className="w-4 h-4" />
                    </div>
                    <h3 className={`text-white font-display font-bold text-base mb-1.5 transition-colors ${st.title}`} {...cms(`pillars.${p._i}.title`)}>
                      {p.title}
                    </h3>
                    {p.text && (
                      <p className="text-slate-400 text-xs sm:text-[13px] leading-relaxed" {...cms(`pillars.${p._i}.text`)}>
                        {p.text}
                      </p>
                    )}
                  </div>
                )
              })}
            </div>
          )}

          {(chips.length > 0 || (b.linkLabel && b.linkHref)) && (
            <div className="pt-2">
              {chips.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {chips.map((c: any) => (
                    <span
                      key={c._i}
                      className="px-2.5 py-0.5 text-[11px] font-mono rounded-md bg-krs-surface/80 border border-white/10 text-slate-300 hover:border-krs-cyan/40 hover:text-cyan-300 transition-colors"
                      {...cms(`chips.${c._i}.item`)}
                    >
                      {c.item}
                    </span>
                  ))}
                </div>
              )}
              {b.linkLabel && b.linkHref && (
                <div className="pt-3">
                  <CmsLink href={b.linkHref} attrs={cms('linkLabel')} className="inline-flex items-center gap-1.5 text-xs font-mono text-krs-cyan hover:underline">
                    {b.linkLabel}
                    <ChevronRight className="w-3.5 h-3.5" />
                  </CmsLink>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </section>
  )
}
