import { cache } from 'react'
import { getPayload } from 'payload'
import config from '@payload-config'
import { logger } from './logger'
import { mergeTexts } from './texts'
import { DEFAULT_FORM_TEXTS, type FormTexts } from './form-texts-defaults'

/** Form and message wording (CMS: Website → Forms & messages); empty fields keep the built-in text. */
export const getFormTexts = cache(async (): Promise<FormTexts> => {
  try {
    const payload = await getPayload({ config })
    return mergeTexts(await payload.findGlobal({ slug: 'form-texts', depth: 0 }), DEFAULT_FORM_TEXTS)
  } catch (err: any) {
    logger.warn(`Form texts unavailable, using built-in text: ${err?.message || err}`)
    return DEFAULT_FORM_TEXTS
  }
})
