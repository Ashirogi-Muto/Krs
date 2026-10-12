import React from 'react'
import { Calendar, Clock, MapPin, ArrowRight, Sparkles } from 'lucide-react'
import { NO_CMS, type Cms } from '@/lib/cms-attrs'
import { mediaUrl } from '@/lib/navigation'
import { optimizedSrc } from '@/lib/img'
import { aurixFacts, fillFacts } from './aurix'
import { CmsLink, container } from './shared'

/**
 * Wide "featured event" card (KRS home). Every text comes from the block; dates, prize pool, venue and fee come from
 * Events through the {…} placeholders, and a line whose fact is missing is hidden instead of guessed.
 */
export async function FlagshipEventBlock({ b, cms = NO_CMS }: { b: any; cms?: Cms }) {
  const facts = await aurixFacts()
  const f = (v: unknown) => fillFacts(v, facts)
  const bullets = (b.bullets || []).map((x: any, i: number) => ({ item: f(x?.item), _i: i })).filter((x: any) => x.item)
  const location = f(b.location)
  const date = f(b.dateText)
  const time = f(b.timeText)
  const price = f(b.priceText)
  const btn = (b.buttons || []).find((x: any) => x?.label && x?.href)
  const img = optimizedSrc(mediaUrl(b.image), 1080) || '/images/flagship-event.webp'
  const alt = b.imageAlt || (b.image && typeof b.image === 'object' && b.image.alt) || ''

  return (
    <section id={b.anchor || undefined} {...cms()} className={`${container} py-4 sm:py-6 scroll-mt-20`}>
      <div className="flex flex-col items-center text-center mb-4 sm:mb-5">
        {b.eyebrow && (
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border border-krs-cyan/35 bg-krs-cyan/10 text-krs-cyan font-mono text-[11px] font-semibold uppercase tracking-wider mb-2 shadow-[0_0_15px_rgba(6,182,212,0.12)]">
            <Sparkles className="w-3 h-3 text-krs-cyan animate-pulse" />
            <span {...cms('eyebrow')}>{b.eyebrow}</span>
          </div>
        )}
        <h2 className="text-2xl sm:text-3xl lg:text-[32px] font-display font-extrabold text-white tracking-tight">
          <span {...cms('heading')}>{b.heading}</span>
          {b.headingAccent && (
            <>
              {' '}
              <span className="relative inline-block text-white" {...cms('headingAccent')}>
                {b.headingAccent}
                <span className="absolute -bottom-1.5 left-0 right-0 h-[3px] bg-gradient-to-r from-krs-cyan via-blue-500 to-aurix-orange rounded-full shadow-[0_0_10px_rgba(6,182,212,0.8)]" />
              </span>
            </>
          )}
        </h2>
        {b.intro && (
          <p className="max-w-md mx-auto text-slate-300 text-xs sm:text-sm leading-relaxed mt-2.5 font-normal px-2" {...cms('intro')}>
            {b.intro}
          </p>
        )}
      </div>

      <div className="relative max-w-6xl mx-auto rounded-2xl border border-white/10 hover:border-krs-cyan/40 bg-[#0c1222]/95 backdrop-blur-xl shadow-[0_12px_44px_rgba(0,0,0,0.65)] overflow-hidden transition-all duration-300 group reveal">
        <div className="absolute -top-24 -right-24 w-72 h-72 rounded-full blur-[90px] bg-krs-cyan/15 pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-72 h-72 rounded-full blur-[90px] bg-aurix-orange/15 pointer-events-none" />

        <div className="grid grid-cols-1 lg:grid-cols-12 items-stretch lg:min-h-[395px]">
          <div className="lg:col-span-5 relative h-[250px] sm:h-[300px] lg:h-auto overflow-hidden bg-slate-900" {...cms('image')}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={img}
              alt={alt}
              loading="lazy"
              className="absolute inset-0 w-full h-full object-cover object-top lg:object-center group-hover:scale-105 transition-transform duration-700 ease-out"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#0c1222] via-transparent to-transparent lg:hidden" />
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-transparent to-[#0c1222] hidden lg:block opacity-70" />
            {b.imageBadge && (
              <div className="absolute top-3.5 left-3.5 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-black/75 backdrop-blur-md border border-aurix-orange/60 text-aurix-orange text-[10px] font-mono font-bold uppercase tracking-wider shadow-lg">
                <span className="w-1.5 h-1.5 rounded-full bg-aurix-orange animate-pulse" />
                <span {...cms('imageBadge')}>{b.imageBadge}</span>
              </div>
            )}
          </div>

          <div className="lg:col-span-7 p-5 sm:p-6 lg:p-7 flex flex-col justify-between gap-3">
            <div className="space-y-2.5">
              {(b.tag || location) && (
                <div className="flex flex-wrap items-center gap-2.5">
                  {b.tag && (
                    <span className="px-3 py-0.5 rounded-full text-[11px] font-mono font-semibold bg-krs-cyan/15 border border-krs-cyan/40 text-krs-cyan tracking-wide" {...cms('tag')}>
                      {b.tag}
                    </span>
                  )}
                  {location && (
                    <div className="inline-flex items-center gap-1.5 text-slate-300 text-[11px] font-mono">
                      <MapPin className="w-3.5 h-3.5 text-aurix-orange shrink-0" />
                      <span {...cms('location')}>{location}</span>
                    </div>
                  )}
                </div>
              )}
              {b.title && (
                <h3 className="text-xl sm:text-2xl font-display font-extrabold text-white tracking-tight leading-snug group-hover:text-cyan-50 transition-colors" {...cms('title')}>
                  {b.title}
                </h3>
              )}
              {bullets.length > 0 && (
                <ul className="space-y-1.5 pt-0.5 text-slate-300 text-xs sm:text-[13px] leading-snug">
                  {bullets.map((x: any) => (
                    <li key={x._i} className="flex items-start gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-krs-cyan mt-1.5 shrink-0 shadow-[0_0_6px_rgba(6,182,212,0.8)]" />
                      <span {...cms(`bullets.${x._i}.item`)}>{x.item}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {(date || time) && (
              <div className="flex flex-wrap items-center gap-5 py-2 border-y border-white/10">
                {date && (
                  <div className="inline-flex items-center gap-1.5 text-xs font-mono text-slate-200">
                    <Calendar className="w-3.5 h-3.5 text-krs-cyan" />
                    <span {...cms('dateText')}>{date}</span>
                  </div>
                )}
                {time && (
                  <div className="inline-flex items-center gap-1.5 text-xs font-mono text-slate-200">
                    <Clock className="w-3.5 h-3.5 text-aurix-orange" />
                    <span {...cms('timeText')}>{time}</span>
                  </div>
                )}
              </div>
            )}

            {b.organizers && (
              <span className="text-[11px] font-mono text-slate-400" {...cms('organizers')}>
                {b.organizers}
              </span>
            )}

            <div className="pt-1 flex flex-wrap items-center justify-between gap-4">
              {price && (
                <div>
                  {b.priceLabel && (
                    <span className="block text-[9px] font-mono uppercase tracking-wider text-slate-400" {...cms('priceLabel')}>
                      {b.priceLabel}
                    </span>
                  )}
                  <span className="text-xl sm:text-2xl font-display font-extrabold text-white">
                    <span {...cms('priceText')}>{price}</span>
                    {b.priceNote && (
                      <>
                        {' '}
                        <span className="text-[11px] font-mono font-normal text-krs-cyan" {...cms('priceNote')}>
                          {b.priceNote}
                        </span>
                      </>
                    )}
                  </span>
                </div>
              )}
              {btn && (
                <CmsLink
                  href={btn.href}
                  attrs={cms(`buttons.${btn._i ?? 0}`)}
                  className="inline-flex items-center gap-2 px-6 sm:px-7 py-2.5 sm:py-3 rounded-xl bg-gradient-to-r from-blue-600 to-krs-cyan hover:from-blue-500 hover:to-cyan-300 text-black font-mono font-bold text-xs uppercase tracking-wider transition-all shadow-[0_0_20px_rgba(6,182,212,0.35)] hover:shadow-[0_0_30px_rgba(6,182,212,0.6)] btn-shimmer"
                >
                  {btn.label}
                  <ArrowRight className="w-3.5 h-3.5" />
                </CmsLink>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
