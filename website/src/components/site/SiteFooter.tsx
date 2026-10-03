import React from 'react'
import Link from 'next/link'
import type { SiteNav } from '@/lib/navigation-defaults'
import type { SiteSettingsData } from '@/lib/site-settings-defaults'

const ACCENT = { plain: 'text-white', krs: 'text-krs-cyan', aurix: 'text-aurix-orange' } as const

/** Footer of the KRS or AURIX site; columns, texts and links come from the CMS (Navigation & footer). */
export function SiteFooter({ nav, site, theme }: { nav: SiteNav; site: SiteSettingsData; theme: 'krs' | 'aurix' }) {
  const aurix = theme === 'aurix'
  const hover = aurix ? 'hover:text-aurix-orange' : 'hover:text-krs-cyan'
  const blurb = nav.footerBlurb || site.footerBlurb
  const address = nav.footerAddress || [site.institution, site.location].filter(Boolean).join('\n')

  return (
    <footer className={`border-t text-slate-400 text-xs ${aurix ? 'border-aurix-border bg-aurix-dark' : 'border-krs-border bg-krs-dark'}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-16">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-12">
          <div className="md:col-span-1 space-y-4">
            <div className="flex items-center gap-2.5">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={nav.logo} alt={`${nav.brandTitle} logo`} width={32} height={32} className="w-8 h-8 object-contain" />
              <span className={`font-display font-bold text-white text-sm ${aurix ? 'font-extrabold tracking-wider uppercase' : 'tracking-tight'}`}>
                {nav.brandTitle}
              </span>
            </div>
            {blurb && <p className="text-slate-400 leading-relaxed text-xs">{blurb}</p>}
            {address && <div className="text-[11px] font-mono text-slate-500 whitespace-pre-line">{address}</div>}
            {!aurix && site.contactEmail && (
              <a href={`mailto:${site.contactEmail}`} className="block text-[11px] font-mono text-slate-400 hover:text-krs-cyan">
                {site.contactEmail}
              </a>
            )}
            {!aurix && site.socialLinks.length > 0 && (
              <div className="flex flex-wrap gap-3 text-[11px] font-mono">
                {site.socialLinks.map((l) => (
                  <a key={l.url} href={l.url} target="_blank" rel="noopener noreferrer" className="text-slate-400 hover:text-krs-cyan">
                    {l.platform}
                  </a>
                ))}
              </div>
            )}
          </div>

          {nav.footerColumns.map((col) => (
            <div key={col.heading}>
              <h3 className={`font-mono text-xs uppercase tracking-wider mb-3 ${ACCENT[col.accent] || ACCENT.plain}`}>{col.heading}</h3>
              <ul className="space-y-2">
                {col.links.map((l) => (
                  <li key={l.href + l.label}>
                    <FooterLink href={l.href} className={`${hover} transition-colors`}>
                      {l.label}
                    </FooterLink>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className={`border-t pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px] font-mono text-slate-400 ${aurix ? 'border-aurix-border/60' : 'border-krs-border/60'}`}>
          <div>{nav.footerNote}</div>
          <div className="flex items-center gap-4">
            {nav.bottomLinks.map((l) => (
              <FooterLink key={l.href + l.label} href={l.href} className={hover}>
                {l.label}
              </FooterLink>
            ))}
            {!aurix && site.motto && <span>{site.motto}</span>}
          </div>
        </div>
      </div>
    </footer>
  )
}

/** Internal paths use next/link; external links open in a new tab without access to this page. */
function FooterLink({ href, className, children }: { href: string; className?: string; children: React.ReactNode }) {
  if (/^https?:\/\//i.test(href))
    return (
      <a href={href} target="_blank" rel="noopener noreferrer" className={className}>
        {children}
      </a>
    )
  if (/^(mailto|tel):/i.test(href)) return <a href={href} className={className}>{children}</a>
  return <Link href={href} className={className}>{children}</Link>
}
