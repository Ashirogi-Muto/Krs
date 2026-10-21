import { cache } from 'react'
import { getPayload } from 'payload'
import config from '@payload-config'
import { logger } from './logger'
import { mergeTexts } from './texts'
import { DEFAULT_EXPORT_TEXTS, type ExportTexts } from './export-texts-defaults'

/** Export wording (CMS: Website → Export texts); empty fields keep the built-in text. */
export const getExportTexts = cache(async (): Promise<ExportTexts> => {
  try {
    const payload = await getPayload({ config })
    return mergeTexts(await payload.findGlobal({ slug: 'export-texts', depth: 0 }), DEFAULT_EXPORT_TEXTS)
  } catch (err: any) {
    logger.warn(`Export texts unavailable, using built-in text: ${err?.message || err}`)
    return DEFAULT_EXPORT_TEXTS
  }
})
