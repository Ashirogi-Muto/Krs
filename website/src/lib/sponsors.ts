import { cache } from 'react'
import { getPayload } from 'payload'
import config from '@payload-config'
import { isSafeHref } from '@/payload/fields/common'
import { mediaUrl } from './navigation'
import { logger } from './logger'
import { DEFAULT_HERO_SPONSORS_LABEL } from './site-settings-defaults'

/**
 * AURIX sponsors (owner, 10 Oct 2026): one list in CMS → Website → Site settings → Sponsors (AURIX), shown by the
 * "Sponsors" page section and as a strip on competition pages. No fallback list: without the database, no sponsors.
 */
export type Sponsor = { name: string; label: string; logo: string; url: string; onCompetitions: boolean; inHero: boolean; events: string[]; index: number }
export const DEFAULT_HERO_LABEL = DEFAULT_HERO_SPONSORS_LABEL

/** Pure: CMS rows → sponsors to show (a logo is required; unsafe links dropped). */
export function toSponsors(rows: unknown): Sponsor[] {
  return (Array.isArray(rows) ? rows : [])
    .map((r: any, index: number) => ({
      index, // row number in the CMS list (live preview: click a logo → its row)
      name: String(r?.name || '').trim(),
      label: String(r?.label || '').trim(),
      logo: mediaUrl(r?.logo) || '',
      url: typeof r?.url === 'string' && r.url.trim() && isSafeHref(r.url.trim()) ? r.url.trim() : '',
      onCompetitions: r?.onCompetitions !== false,
      inHero: r?.inHero === true,
      events: (Array.isArray(r?.events) ? r.events : []).map((e: any) => String(e && typeof e === 'object' ? e.id : e)),
    }))
    .filter((s) => s.name && s.logo)
}

/** The sponsors a competition page shows: "on competition pages", and either all competitions or this one. */
export const sponsorsForEvent = (all: Sponsor[], eventId: string | number) =>
  all.filter((s) => s.onCompetitions && (!s.events.length || s.events.includes(String(eventId))))

/** The sponsor list and the hero line text, read once per request. */
export const getSponsorData = cache(async (): Promise<{ sponsors: Sponsor[]; heroLabel: string }> => {
  try {
    const payload = await getPayload({ config })
    // No `select` here: Payload's select on a global drops the hasMany "events" inside the array (found 10 Oct 2026)
    const doc: any = await payload.findGlobal({ slug: 'site-settings', depth: 1 })
    return { sponsors: toSponsors(doc?.sponsors), heroLabel: String(doc?.heroLabel || '').trim() || DEFAULT_HERO_LABEL }
  } catch (err: any) {
    logger.warn(`Sponsors not loaded: ${err?.message || err}`)
    return { sponsors: [], heroLabel: DEFAULT_HERO_LABEL }
  }
})

export const getSponsors = async (): Promise<Sponsor[]> => (await getSponsorData()).sponsors
