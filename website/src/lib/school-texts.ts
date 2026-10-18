import { cache } from 'react'
import { getPayload } from 'payload'
import config from '@payload-config'
import { logger } from './logger'
import { mergeTexts } from './texts'
import { DEFAULT_SCHOOL_TEXTS, type SchoolTexts } from './school-texts-defaults'

/** Free school entry wording (CMS: Website → School entry (free)); empty fields keep the built-in text. */
export const getSchoolTexts = cache(async (): Promise<SchoolTexts> => {
  try {
    const payload = await getPayload({ config })
    return mergeTexts(await payload.findGlobal({ slug: 'school-entry-texts', depth: 0 }), DEFAULT_SCHOOL_TEXTS)
  } catch (err: any) {
    logger.warn(`School entry texts unavailable, using built-in text: ${err?.message || err}`)
    return DEFAULT_SCHOOL_TEXTS
  }
})
