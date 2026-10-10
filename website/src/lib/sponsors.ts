import { cache } from 'react'
import { getPayload } from 'payload'
import config from '@payload-config'
import { isSafeHref } from '@/payload/fields/common'
import { mediaUrl } from './navigation'
import { logger } from './logger'

/**
 * AURIX sponsors (owner, 10 Oct 2026): one list in CMS → Website → Site settings → Sponsors (AURIX), shown by the
 * "Sponsors" page section and as a strip on competition pages. No fallback list: without the database, no sponsors.
 */
export type Sponsor = { name: string; label: string; logo: string; url: string; onCompetitions: boolean; events: string[] }

/** Pure: CMS rows → sponsors to show (a logo is required; unsafe links dropped). */
export function toSponsors(rows: unknown): Sponsor[] {
  return (Array.isArray(rows) ? rows : [])
    .map((r: any) => ({
      name: String(r?.name || '').trim(),
      label: String(r?.label || '').trim(),
      logo: mediaUrl(r?.logo) || '',
      url: typeof r?.url === 'string' && r.url.trim() && isSafeHref(r.url.trim()) ? r.url.trim() : '',
      onCompetitions: r?.onCompetitions !== false,
      events: (Array.isArray(r?.events) ? r.events : []).map((e: any) => String(e && typeof e === 'object' ? e.id : e)),
    }))
    .filter((s) => s.name && s.logo)
}

/** The sponsors a competition page shows: "on competition pages", and either all competitions or this one. */
export const sponsorsForEvent = (all: Sponsor[], eventId: string | number) =>
  all.filter((s) => s.onCompetitions && (!s.events.length || s.events.includes(String(eventId))))

export const getSponsors = cache(async (): Promise<Sponsor[]> => {
  try {
    const payload = await getPayload({ config })
    const doc: any = await payload.findGlobal({ slug: 'site-settings', depth: 1, select: { sponsors: true } as any })
    return toSponsors(doc?.sponsors)
  } catch (err: any) {
    logger.warn(`Sponsors not loaded: ${err?.message || err}`)
    return []
  }
})
