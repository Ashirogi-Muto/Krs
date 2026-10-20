import { cache } from 'react'
import { getPayload } from 'payload'
import config from '@payload-config'
import { logger } from './logger'
import { publishedTournaments, type PublicTournament } from './tournament-server'

/** Published tournaments of a competition for its page (team names only); none when the database is unreachable. */
export const getEventTournaments = cache(async (eventId: unknown): Promise<PublicTournament[]> => {
  const id = Number(eventId)
  if (!Number.isSafeInteger(id) || id <= 0) return []
  try {
    return await publishedTournaments(await getPayload({ config }), id)
  } catch (err: any) {
    logger.warn(`Tournaments unavailable for event ${id}: ${err?.message || err}`)
    return []
  }
})
