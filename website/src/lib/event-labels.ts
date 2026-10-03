import { cache } from 'react'
import { getPayload } from 'payload'
import config from '@payload-config'
import { logger } from './logger'
import { DEFAULT_EVENT_LABELS, type EventLabels } from './event-labels-defaults'

/** Competition-page wording (CMS: Website → Event pages); empty fields keep the built-in text. */
export const getEventLabels = cache(async (): Promise<EventLabels> => {
  try {
    const payload = await getPayload({ config })
    const doc: any = await payload.findGlobal({ slug: 'event-page-labels', depth: 0 })
    const out = { ...DEFAULT_EVENT_LABELS }
    for (const k of Object.keys(out) as (keyof EventLabels)[]) {
      const v = doc?.[k]
      if (typeof v === 'string' && v.trim()) out[k] = v
    }
    return out
  } catch (err: any) {
    logger.warn(`Event page labels unavailable, using built-in text: ${err?.message || err}`)
    return DEFAULT_EVENT_LABELS
  }
})
