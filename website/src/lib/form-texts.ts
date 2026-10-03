import { cache } from 'react'
import { getPayload } from 'payload'
import config from '@payload-config'
import { logger } from './logger'
import { DEFAULT_FORM_TEXTS, type FormTexts } from './form-texts-defaults'

/** Form and message wording (CMS: Website → Forms & messages); empty fields keep the built-in text. */
export const getFormTexts = cache(async (): Promise<FormTexts> => {
  try {
    const payload = await getPayload({ config })
    const doc: any = await payload.findGlobal({ slug: 'form-texts', depth: 0 })
    const out: any = {}
    for (const [group, defs] of Object.entries(DEFAULT_FORM_TEXTS)) {
      out[group] = { ...defs }
      for (const k of Object.keys(defs)) {
        const v = doc?.[group]?.[k]
        if (typeof v === 'string' && v.trim()) out[group][k] = v
      }
    }
    return out as FormTexts
  } catch (err: any) {
    logger.warn(`Form texts unavailable, using built-in text: ${err?.message || err}`)
    return DEFAULT_FORM_TEXTS
  }
})
