import { cache } from 'react'
import { getPayload } from 'payload'
import config from '@payload-config'
import { logger } from './logger'
import { mergeTexts } from './texts'
import { DEFAULT_JUDGING_TEXTS, type JudgingTexts } from './judging-texts-defaults'

/** Judging wording (CMS: Admin tools → Judging texts); empty fields keep the built-in text. */
export const getJudgingTexts = cache(async (): Promise<JudgingTexts> => {
  try {
    const payload = await getPayload({ config })
    return mergeTexts(await payload.findGlobal({ slug: 'judging-texts', depth: 0 }), DEFAULT_JUDGING_TEXTS)
  } catch (err: any) {
    logger.warn(`Judging texts unavailable, using built-in text: ${err?.message || err}`)
    return DEFAULT_JUDGING_TEXTS
  }
})
