import { cache } from 'react'
import { getPayload } from 'payload'
import config from '@payload-config'
import { logger } from '@/lib/logger'
import { SEED_LEGAL, type LegalPage } from './seed-legal'

/** Privacy policy / terms from the CMS (Website → Privacy & terms); the built-in text until it is saved. */
export const getLegalPage = cache(async (slug: 'privacy' | 'terms'): Promise<LegalPage> => {
  try {
    const payload = await getPayload({ config })
    const doc: any = await payload.findGlobal({ slug: 'legal-pages', depth: 0 })
    const p = doc?.[slug]
    if (!doc?.updatedAt || !p?.title) return SEED_LEGAL[slug]
    return {
      title: p.title,
      lastUpdated: p.lastUpdated || '',
      seoTitle: p.seoTitle || undefined,
      seoDescription: p.seoDescription || undefined,
      sections: (p.sections || []).filter((s: any) => s?.heading).map((s: any) => ({ heading: s.heading, body: s.body || '' })),
    }
  } catch (err: any) {
    logger.warn(`Legal pages unavailable, using built-in text: ${err?.message || err}`)
    return SEED_LEGAL[slug]
  }
})
