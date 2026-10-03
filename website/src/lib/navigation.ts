import { cache } from 'react'
import { getPayload } from 'payload'
import config from '@payload-config'
import { logger } from './logger'
import { isVisibleIn } from './visibility'
import { getHiddenRoutes, getSiteSettings } from './site-settings'
import { DEFAULT_NAVIGATION, type NavLink, type NavigationData, type SiteNav } from './navigation-defaults'

const str = (v: unknown, def: string) => (typeof v === 'string' && v.trim() ? v : def)
const links = (v: unknown, def: NavLink[]): NavLink[] =>
  Array.isArray(v) && v.length
    ? v.filter((l: any) => l?.label && l?.href).map((l: any) => ({ label: l.label, href: l.href, style: l.style || undefined }))
    : def
export const mediaUrl = (v: any): string | undefined => (v && typeof v === 'object' && v.url ? String(v.url) : undefined)

function mergeSite(def: SiteNav, cms: any): SiteNav {
  return {
    brandTitle: str(cms?.brandTitle, def.brandTitle),
    brandSubtitle: str(cms?.brandSubtitle, def.brandSubtitle),
    logo: mediaUrl(cms?.logo) || def.logo,
    links: links(cms?.links, def.links),
    ctas: links(cms?.ctas, def.ctas),
    backLabel: str(cms?.backLabel, def.backLabel || ''),
    footerColumns:
      Array.isArray(cms?.footerColumns) && cms.footerColumns.length
        ? cms.footerColumns.map((c: any) => ({ heading: c.heading, accent: c.accent || 'plain', links: links(c.links, []) }))
        : def.footerColumns,
    footerBlurb: str(cms?.footerBlurb, def.footerBlurb),
    footerAddress: str(cms?.footerAddress, def.footerAddress),
    footerNote: str(cms?.footerNote, def.footerNote),
    bottomLinks: links(cms?.bottomLinks, def.bottomLinks),
  }
}

/** Drop links to pages hidden in Site settings (and footer columns left empty by that). */
function withoutHidden(nav: SiteNav, hidden: string[]): SiteNav {
  const keep = (l: NavLink[]) => l.filter((x) => isVisibleIn(hidden, x.href))
  return {
    ...nav,
    links: keep(nav.links),
    ctas: keep(nav.ctas),
    footerColumns: nav.footerColumns.map((c) => ({ ...c, links: keep(c.links) })).filter((c) => c.links.length),
    bottomLinks: keep(nav.bottomLinks),
  }
}

/** Menus and footers (CMS: Website → Navigation & footer) with today's wording as default. */
export const getNavigation = cache(async (): Promise<NavigationData> => {
  const [hidden, site] = await Promise.all([getHiddenRoutes(), getSiteSettings()])
  let nav = DEFAULT_NAVIGATION
  try {
    const payload = await getPayload({ config })
    const doc: any = await payload.findGlobal({ slug: 'navigation', depth: 1 })
    nav = { krs: mergeSite(DEFAULT_NAVIGATION.krs, doc?.krs), aurix: mergeSite(DEFAULT_NAVIGATION.aurix, doc?.aurix) }
  } catch (err: any) {
    logger.warn(`Navigation unavailable, using built-in menus: ${err?.message || err}`)
  }
  const fill = (s: string) =>
    s.replace(/\{year\}/g, String(new Date().getFullYear())).replace(/\{name\}/g, site.name).replace(/\{institution\}/g, site.institution)
  const finish = (n: SiteNav): SiteNav => withoutHidden({ ...n, footerNote: fill(n.footerNote) }, hidden)
  return { krs: finish(nav.krs), aurix: finish(nav.aurix) }
})

export type { NavLink, NavigationData, SiteNav }
