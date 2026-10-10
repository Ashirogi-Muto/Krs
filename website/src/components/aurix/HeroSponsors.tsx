import React from 'react'
import { NO_CMS, cmsGlobal } from '@/lib/cms-attrs'
import { optimizedSrc } from '@/lib/img'
import type { Sponsor } from '@/lib/sponsors'

/**
 * Small sponsor logos in a hero (owner, 10 Oct 2026): the sponsors ticked for the hero in Site settings → Sponsors
 * (AURIX), after the hero line (heroLabel, editable there). Nothing when none are ticked.
 */
export function HeroSponsors({ sponsors, label, align = 'center', preview = false }: { sponsors: Sponsor[]; label: string; align?: 'center' | 'start'; preview?: boolean }) {
  const list = sponsors.filter((s) => s.inHero)
  if (!list.length) return null
  const g = preview ? cmsGlobal('site-settings') : NO_CMS
  return (
    <div className={`flex flex-wrap items-center gap-x-5 gap-y-3 pt-6 ${align === 'center' ? 'justify-center' : 'justify-start'}`}>
      <span className="text-[11px] font-mono uppercase tracking-widest text-slate-400" {...g('heroLabel')}>
        {label}
      </span>
      <ul className="flex flex-wrap items-center gap-x-6 gap-y-3">
        {list.map((s, i) => {
          // eslint-disable-next-line @next/next/no-img-element
          const logo = <img src={optimizedSrc(s.logo, 256)} alt={s.name} className="h-6 sm:h-7 w-auto max-w-[140px] object-contain" {...g(`sponsors.${s.index}.logo`)} />
          return (
            <li key={`${s.name}-${i}`}>
              {s.url ? (
                <a href={s.url} target="_blank" rel="sponsored noopener noreferrer" className="block opacity-90 hover:opacity-100 transition-opacity">
                  {logo}
                </a>
              ) : (
                logo
              )}
            </li>
          )
        })}
      </ul>
    </div>
  )
}
