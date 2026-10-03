import React from 'react'
import { ArrowRight, ChevronRight, Flame } from 'lucide-react'
import { RichText } from '@payloadcms/richtext-lexical/react'
import { mediaUrl } from '@/lib/navigation'
import { BlockIcon, CmsLink, SectionHeader, accentText, container } from './shared'

type Btn = { label: string; href: string; style?: string }

/** Text with a side box of tags (KRS home "about"). */
export function TextChipsBlock({ b }: { b: any }) {
  const chips: string[] = (b.chips || []).map((c: any) => c.item).filter(Boolean)
  return (
    <section id={b.anchor || undefined} className={`${container} scroll-mt-24`}>
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center tech-card rounded-2xl p-8 md:p-12">
        <div className={`${chips.length ? 'lg:col-span-7' : 'lg:col-span-12'} space-y-4`}>
          {b.eyebrow && <span className="text-xs font-mono text-krs-cyan uppercase tracking-wider">{b.eyebrow}</span>}
          {b.title && <h2 className="text-2xl sm:text-3xl font-display font-bold text-white tracking-tight">{b.title}</h2>}
          {b.intro && <p className="text-slate-300 text-sm sm:text-base leading-relaxed">{b.intro}</p>}
          {b.body && <p className="text-slate-300 text-sm sm:text-base leading-relaxed whitespace-pre-line">{b.body}</p>}
          {b.linkLabel && b.linkHref && (
            <div className="pt-2">
              <CmsLink href={b.linkHref} className="inline-flex items-center gap-2 text-xs font-mono text-krs-cyan hover:underline">
                {b.linkLabel} <ChevronRight className="w-3.5 h-3.5" />
              </CmsLink>
            </div>
          )}
        </div>
        {chips.length > 0 && (
          <div className="lg:col-span-5 bg-krs-dark/80 rounded-xl p-6 border border-krs-border space-y-4">
            {b.chipsTitle && <h3 className="text-xs font-mono text-slate-400 uppercase tracking-wider">{b.chipsTitle}</h3>}
            <div className="flex flex-wrap gap-2">
              {chips.map((c) => (
                <span key={c} className="px-2.5 py-1 text-xs font-mono rounded bg-krs-surface border border-krs-border/80 text-slate-300">
                  {c}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    </section>
  )
}

/** Boxed highlight with buttons (KRS home "AURIX" box). */
export function CalloutBlock({ b }: { b: any }) {
  const aurix = b.theme === 'aurix'
  return (
    <section id={b.anchor || undefined} className={container}>
      <div
        className={`relative rounded-2xl border p-8 md:p-12 overflow-hidden ${
          aurix ? 'bg-aurix-card border-aurix-border bg-aurix-grid' : 'tech-card bg-tech-grid border-krs-border'
        }`}
      >
        <div className="relative z-10 max-w-3xl space-y-4">
          {b.eyebrow && (
            <div
              className={`inline-flex items-center gap-2 px-3 py-1 rounded border text-[11px] font-mono uppercase ${
                aurix ? 'bg-aurix-dark border-aurix-border text-aurix-orange' : 'bg-krs-dark border-krs-border text-krs-cyan'
              }`}
            >
              {aurix && <Flame className="w-3 h-3 text-aurix-orange animate-pulse" />}
              {b.eyebrow}
            </div>
          )}
          {b.title && <h2 className="text-3xl sm:text-4xl font-display font-bold text-white tracking-tight">{b.title}</h2>}
          {b.intro && <p className="text-slate-300 text-sm sm:text-base leading-relaxed whitespace-pre-line">{b.intro}</p>}
          {(b.buttons || []).length > 0 && (
            <div className="flex flex-wrap gap-4 pt-2">
              {(b.buttons as Btn[]).map((btn) =>
                (btn.style || 'primary') === 'primary' ? (
                  <CmsLink
                    key={btn.href + btn.label}
                    href={btn.href}
                    className={`inline-flex items-center gap-2 px-6 py-2.5 rounded text-black font-semibold text-xs font-mono uppercase transition-colors ${
                      aurix ? 'bg-aurix-orange hover:bg-orange-400' : 'bg-krs-cyan hover:bg-cyan-400'
                    }`}
                  >
                    {btn.label}
                    <ArrowRight className="w-3.5 h-3.5" />
                  </CmsLink>
                ) : (
                  <CmsLink
                    key={btn.href + btn.label}
                    href={btn.href}
                    className={`inline-flex items-center gap-2 px-5 py-2.5 rounded border text-white text-xs font-mono uppercase transition-colors ${
                      aurix ? 'bg-aurix-dark border-aurix-border hover:border-aurix-orange' : 'bg-krs-dark border-krs-border hover:border-krs-cyan'
                    }`}
                  >
                    {btn.label}
                  </CmsLink>
                ),
              )}
            </div>
          )}
        </div>
      </div>
    </section>
  )
}

const COLS: Record<string, string> = {
  '2': 'md:grid-cols-2',
  '3': 'md:grid-cols-2 lg:grid-cols-3',
  '4': 'md:grid-cols-2 lg:grid-cols-4',
}

/** Grid of icon cards (KRS home "pillars"). */
export function CardGridBlock({ b }: { b: any }) {
  const cards = (b.cards || []).filter((c: any) => c?.title)
  return (
    <section id={b.anchor || undefined} className={`${container} space-y-8`}>
      <SectionHeader eyebrow={b.eyebrow} title={b.title} intro={b.intro} />
      <div className={`grid grid-cols-1 ${COLS[b.columns] || COLS['4']} gap-6`}>
        {cards.map((card: any, i: number) => (
          <div key={card.title + i} className="tech-card rounded-xl p-6 space-y-3">
            <div className="w-10 h-10 rounded-lg bg-krs-surface border border-krs-border flex items-center justify-center text-krs-cyan">
              <BlockIcon name={card.icon} className="w-5 h-5" />
            </div>
            <h3 className="font-display font-semibold text-white text-base">{card.title}</h3>
            {card.text && <p className="text-slate-400 text-xs leading-relaxed whitespace-pre-line">{card.text}</p>}
            {card.linkLabel && card.linkHref && (
              <CmsLink href={card.linkHref} className="inline-flex items-center gap-1 text-xs font-mono text-krs-cyan hover:underline">
                {card.linkLabel} <ChevronRight className="w-3.5 h-3.5" />
              </CmsLink>
            )}
          </div>
        ))}
      </div>
    </section>
  )
}

/** Centered call to action (KRS home "join"). */
export function CtaBlock({ b }: { b: any }) {
  const aurix = b.theme === 'aurix'
  return (
    <section id={b.anchor || undefined} className={container}>
      <div
        className={`rounded-2xl p-8 md:p-14 text-center space-y-6 relative overflow-hidden ${
          aurix ? 'aurix-card bg-aurix-grid' : 'tech-card bg-tech-grid'
        }`}
      >
        <div className="max-w-2xl mx-auto space-y-3">
          {b.eyebrow && <span className={`text-xs font-mono uppercase tracking-wider ${accentText(b.theme)}`}>{b.eyebrow}</span>}
          {b.title && <h2 className="text-3xl sm:text-4xl font-display font-extrabold text-white tracking-tight">{b.title}</h2>}
          {b.intro && <p className="text-slate-300 text-sm leading-relaxed whitespace-pre-line">{b.intro}</p>}
        </div>
        {(b.buttons || []).length > 0 && (
          <div className="pt-2 flex flex-wrap justify-center gap-4">
            {(b.buttons as Btn[]).map((btn) => (
              <CmsLink
                key={btn.href + btn.label}
                href={btn.href}
                className={
                  (btn.style || 'primary') === 'primary'
                    ? `inline-flex items-center gap-2 px-8 py-3.5 rounded-lg text-black font-semibold text-sm font-mono uppercase transition-colors shadow-lg ${
                        aurix ? 'bg-aurix-orange hover:bg-orange-400 shadow-aurix-orange/25' : 'bg-krs-cyan hover:bg-cyan-400 shadow-krs-cyan/25'
                      }`
                    : `inline-flex items-center gap-2 px-8 py-3.5 rounded-lg border text-white font-semibold text-sm font-mono uppercase transition-colors ${
                        aurix ? 'border-aurix-border hover:border-aurix-orange' : 'border-krs-border hover:border-krs-cyan'
                      }`
                }
              >
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

/** Free formatted text written in the CMS editor. */
export function RichTextBlock({ b }: { b: any }) {
  return (
    <section id={b.anchor || undefined} className={`${container} space-y-6`}>
      <SectionHeader eyebrow={b.eyebrow} title={b.title} intro={b.intro} />
      {b.content && (
        <div className={`cms-prose ${b.width === 'wide' ? 'max-w-none' : 'max-w-3xl'}`}>
          <RichText data={b.content} />
        </div>
      )}
    </section>
  )
}

/** Image next to text. */
export function ImageTextBlock({ b }: { b: any }) {
  const src = mediaUrl(b.image)
  const alt = (b.image && typeof b.image === 'object' && b.image.alt) || b.title || ''
  return (
    <section id={b.anchor || undefined} className={container}>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center tech-card rounded-2xl p-8 md:p-12">
        <div className={`space-y-4 ${b.imagePosition === 'left' ? 'lg:order-2' : ''}`}>
          {b.eyebrow && <span className="text-xs font-mono text-krs-cyan uppercase tracking-wider">{b.eyebrow}</span>}
          {b.title && <h2 className="text-2xl sm:text-3xl font-display font-bold text-white tracking-tight">{b.title}</h2>}
          {b.intro && <p className="text-slate-300 text-sm sm:text-base leading-relaxed">{b.intro}</p>}
          {b.body && <p className="text-slate-300 text-sm leading-relaxed whitespace-pre-line">{b.body}</p>}
          {(b.buttons || []).length > 0 && (
            <div className="flex flex-wrap gap-3 pt-2">
              {(b.buttons as Btn[]).map((btn) => (
                <CmsLink
                  key={btn.href + btn.label}
                  href={btn.href}
                  className={
                    (btn.style || 'primary') === 'primary'
                      ? 'inline-flex items-center gap-2 px-5 py-2.5 rounded bg-krs-cyan text-black text-xs font-mono font-semibold uppercase hover:bg-cyan-400'
                      : 'inline-flex items-center gap-2 px-5 py-2.5 rounded bg-krs-surface border border-krs-border text-krs-cyan text-xs font-mono font-semibold uppercase hover:border-krs-cyan'
                  }
                >
                  {btn.label}
                </CmsLink>
              ))}
            </div>
          )}
        </div>
        {src && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={src} alt={alt} className="w-full rounded-xl border border-krs-border object-cover" loading="lazy" />
        )}
      </div>
    </section>
  )
}
