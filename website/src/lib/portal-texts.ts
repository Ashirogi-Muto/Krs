import { cache } from 'react'
import { getPayload } from 'payload'
import config from '@payload-config'
import { logger } from './logger'
import { mergeTexts } from './texts'
import { DEFAULT_PORTAL_TEXTS, type PortalTexts } from './portal-texts-defaults'

/** Participant portal wording (CMS: Website → Participant portal); empty fields keep the built-in text. */
export const getPortalTexts = cache(async (): Promise<PortalTexts> => {
  try {
    const payload = await getPayload({ config })
    return mergeTexts(await payload.findGlobal({ slug: 'portal-texts', depth: 0 }), DEFAULT_PORTAL_TEXTS)
  } catch (err: any) {
    logger.warn(`Portal texts unavailable, using built-in text: ${err?.message || err}`)
    return DEFAULT_PORTAL_TEXTS
  }
})

export type { PortalTexts }
