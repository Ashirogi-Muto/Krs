import { SEED_AURIX_EVENTS } from './seed-events'
import { GenericEvent } from './types'

export async function getAllEvents(): Promise<GenericEvent[]> {
  // Returns all authoritative events
  return SEED_AURIX_EVENTS
}

export async function getEventsBySeries(series: 'AURIX' | 'KRS'): Promise<GenericEvent[]> {
  return SEED_AURIX_EVENTS.filter((e) => e.series === series)
}

export async function getEventBySlug(slug: string): Promise<GenericEvent | null> {
  const event = SEED_AURIX_EVENTS.find((e) => e.slug === slug)
  return event || null
}

export async function getHackathonEvent(): Promise<GenericEvent> {
  const hackathon = SEED_AURIX_EVENTS.find((e) => e.slug === 'hackathon')
  if (!hackathon) throw new Error('Hackathon event record not found')
  return hackathon
}

export async function getFeaturedCompetitions(): Promise<GenericEvent[]> {
  return SEED_AURIX_EVENTS.filter((e) => e.series === 'AURIX' && e.featured)
}
