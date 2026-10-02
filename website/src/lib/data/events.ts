import { getPayload } from 'payload'
import config from '@payload-config'
import { SEED_AURIX_EVENTS } from './seed-events'
import { GenericEvent } from './types'
import { logger } from '@/lib/logger'

/** Seconds a rendered page may serve cached event data before re-reading the CMS. */
export const EVENTS_REVALIDATE_SECONDS = 60

type EventDoc = Record<string, any>

const iso = (value: unknown): string => (value ? new Date(String(value)).toISOString() : '')

function toGenericEvent(doc: EventDoc): GenericEvent {
  return {
    id: String(doc.id),
    title: doc.title,
    shortName: doc.shortName,
    slug: doc.slug,
    edition: doc.edition,
    series: doc.series,
    description: doc.description,
    shortDescription: doc.shortDescription,
    status: doc.status,
    eventType: doc.eventType,
    startDate: iso(doc.startDate),
    endDate: iso(doc.endDate),
    registrationOpen: iso(doc.registrationOpen),
    registrationClose: iso(doc.registrationClose),
    timezone: doc.timezone || 'Asia/Kolkata',
    venue: doc.venue || '',
    location: doc.location || '',
    registrationFee: doc.registrationFee ?? null,
    currency: doc.currency || 'INR',
    minTeamSize: doc.minTeamSize ?? null,
    maxTeamSize: doc.maxTeamSize ?? null,
    operatorCount: doc.operatorCount ?? undefined,
    participantRequirements: doc.participantRequirements || undefined,
    requiresPayment: Boolean(doc.requiresPayment),
    requiresSubmission: Boolean(doc.requiresSubmission),
    requiresJudging: Boolean(doc.requiresJudging),
    resultsPublished: Boolean(doc.resultsPublished),
    featured: Boolean(doc.featured),
    specialNotice: doc.specialNotice || undefined,
    mediaGalleryUrl: doc.mediaGalleryUrl || undefined,
    registrationUrl: doc.registrationUrl || undefined,
    comingSoon: Boolean(doc.comingSoon),
    comingSoonMessage: doc.comingSoonMessage || undefined,
    paymentEventLabel: doc.paymentEventLabel ?? undefined,
    specsSummary: doc.specsSummary || undefined,
    tracks: (doc.tracks || []).map((t: EventDoc) => ({
      id: String(t.id),
      number: t.number,
      name: t.name,
      mission: t.mission,
      examples: (t.examples || []).map((e: EventDoc) => e.item).filter(Boolean),
    })),
    rounds: (doc.rounds || []).map((r: EventDoc) => ({
      id: String(r.id),
      number: r.number,
      name: r.name,
      description: r.description || '',
      startDate: iso(r.startDate),
      endDate: iso(r.endDate),
      submissionType: r.submissionType || 'IN_PERSON_DEMO',
      evaluationFormat: r.evaluationFormat || undefined,
    })),
    judgingCriteria: (doc.judgingCriteria || []).map((c: EventDoc) => ({
      id: String(c.id),
      name: c.name,
      description: c.description || '',
      maxScore: c.maxScore,
      weightPercent: c.weightPercent ?? undefined,
    })),
    rulesSections: (doc.rulesSections || []).map((sec: EventDoc) => ({
      title: sec.title,
      rules: (sec.rules || []).map((r: EventDoc) => r.rule).filter(Boolean),
    })),
    schedule: (doc.schedule || []).map((item: EventDoc) => ({
      timeLabel: item.timeLabel,
      title: item.title,
      description: item.description || '',
      location: item.location || undefined,
    })),
    faqs: (doc.faqs || []).map((f: EventDoc) => ({ question: f.question, answer: f.answer })),
  }
}

const DEFAULT_COMING_SOON = 'Full details will be announced soon.'

/** Coming-soon events expose only their name and dates; fees, rules and formats stay hidden everywhere. */
function applyComingSoon(event: GenericEvent): GenericEvent {
  if (!event.comingSoon) return event
  const message = event.comingSoonMessage || DEFAULT_COMING_SOON
  return {
    ...event,
    shortDescription: message,
    description: message,
    registrationFee: null,
    minTeamSize: null,
    maxTeamSize: null,
    operatorCount: undefined,
    participantRequirements: undefined,
    specialNotice: undefined,
    registrationUrl: undefined,
    specsSummary: undefined,
    tracks: [],
    rounds: [],
    judgingCriteria: [],
    rulesSections: [],
    schedule: [],
    faqs: [],
  }
}

/**
 * All non-draft events, read from the CMS. Falls back to the bundled seed data only
 * when the database is unreachable (for example during `next build`).
 */
async function loadEvents(): Promise<GenericEvent[]> {
  try {
    const payload = await getPayload({ config })
    const result = await payload.find({
      collection: 'events',
      where: { status: { not_equals: 'DRAFT' } },
      sort: 'startDate',
      limit: 100,
      depth: 0,
    })
    return result.docs.map((doc) => applyComingSoon(toGenericEvent(doc as EventDoc)))
  } catch (err: any) {
    logger.warn(`Events CMS unavailable, using bundled seed data: ${err?.message || err}`)
    return SEED_AURIX_EVENTS.filter((e) => e.status !== 'DRAFT').map(applyComingSoon)
  }
}

export async function getAllEvents(): Promise<GenericEvent[]> {
  return loadEvents()
}

export async function getEventsBySeries(series: 'AURIX' | 'KRS'): Promise<GenericEvent[]> {
  return (await loadEvents()).filter((e) => e.series === series)
}

export async function getEventBySlug(slug: string): Promise<GenericEvent | null> {
  return (await loadEvents()).find((e) => e.slug === slug) || null
}

export async function getHackathonEvent(): Promise<GenericEvent> {
  const hackathon = (await loadEvents()).find((e) => e.slug === 'hackathon')
  if (!hackathon) throw new Error('Hackathon event record not found')
  return hackathon
}

export async function getFeaturedCompetitions(): Promise<GenericEvent[]> {
  return (await loadEvents()).filter((e) => e.series === 'AURIX' && e.featured)
}
