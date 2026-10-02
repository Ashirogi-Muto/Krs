import { cache } from 'react'
import { getPayload } from 'payload'
import config from '@payload-config'
import { logger } from './logger'
import { DEFAULT_PAGE_TEXTS, type PageTexts } from './page-texts-defaults'

/** Fill every empty CMS field with its built-in default (deep merge; arrays replace when non-empty). */
function merge<T>(def: T, cms: any): T {
  if (Array.isArray(def)) return (Array.isArray(cms) && cms.length ? cms : def) as T
  if (def && typeof def === 'object') {
    const out: any = {}
    for (const k of Object.keys(def)) out[k] = merge((def as any)[k], cms?.[k])
    return out
  }
  return (typeof cms === 'string' && cms.trim() ? cms : def) as T
}

/** Page headings and intros (CMS: Website → Page texts), with today's wording as default. */
export const getPageTexts = cache(async (): Promise<PageTexts> => {
  try {
    const payload = await getPayload({ config })
    const doc: any = await payload.findGlobal({ slug: 'page-texts', depth: 0 })
    return merge(DEFAULT_PAGE_TEXTS, doc)
  } catch (err: any) {
    logger.warn(`Page texts unavailable, using built-in text: ${err?.message || err}`)
    return DEFAULT_PAGE_TEXTS
  }
})
