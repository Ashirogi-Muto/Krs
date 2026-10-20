import { cache } from 'react'
import { getPayload } from 'payload'
import config from '@payload-config'
import { logger } from './logger'
import { mergeTexts } from './texts'
import { DEFAULT_TOURNAMENT_TEXTS, type TournamentTexts } from './tournament-texts-defaults'

/** Tournament wording (CMS: Website → Tournament texts); empty fields keep the built-in text. */
export const getTournamentTexts = cache(async (): Promise<TournamentTexts> => {
  try {
    const payload = await getPayload({ config })
    return mergeTexts(await payload.findGlobal({ slug: 'tournament-texts', depth: 0 }), DEFAULT_TOURNAMENT_TEXTS)
  } catch (err: any) {
    logger.warn(`Tournament texts unavailable, using built-in text: ${err?.message || err}`)
    return DEFAULT_TOURNAMENT_TEXTS
  }
})
