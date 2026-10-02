import type { Payload } from 'payload'
import { SEED_AURIX_EVENTS } from '../lib/data/seed-events'
import type { GenericEvent } from '../lib/data/types'

const toDoc = (event: GenericEvent) => ({
  title: event.title,
  shortName: event.shortName,
  slug: event.slug,
  edition: event.edition,
  series: event.series,
  eventType: event.eventType,
  status: event.status,
  shortDescription: event.shortDescription,
  description: event.description,
  startDate: event.startDate,
  endDate: event.endDate,
  registrationOpen: event.registrationOpen,
  registrationClose: event.registrationClose,
  timezone: event.timezone,
  venue: event.venue,
  location: event.location,
  registrationFee: event.registrationFee,
  currency: event.currency,
  minTeamSize: event.minTeamSize,
  maxTeamSize: event.maxTeamSize,
  operatorCount: event.operatorCount ?? null,
  participantRequirements: event.participantRequirements ?? null,
  registrationUrl: event.registrationUrl ?? null,
  mediaGalleryUrl: event.mediaGalleryUrl ?? null,
  comingSoon: Boolean(event.comingSoon),
  comingSoonMessage: event.comingSoonMessage ?? null,
  paymentEventLabel: event.paymentEventLabel ?? null,
  specsSummary: event.specsSummary ?? null,
  specialNotice: event.specialNotice ?? null,
  requiresPayment: event.requiresPayment,
  requiresSubmission: event.requiresSubmission,
  requiresJudging: event.requiresJudging,
  resultsPublished: event.resultsPublished,
  featured: event.featured,
  tracks: (event.tracks || []).map((t) => ({
    number: t.number,
    name: t.name,
    mission: t.mission,
    examples: t.examples.map((item) => ({ item })),
  })),
  rounds: (event.rounds || []).map((r) => ({
    number: r.number,
    name: r.name,
    description: r.description,
    startDate: r.startDate,
    endDate: r.endDate,
    submissionType: r.submissionType,
    evaluationFormat: r.evaluationFormat ?? null,
  })),
  judgingCriteria: (event.judgingCriteria || []).map((c) => ({
    name: c.name,
    description: c.description,
    maxScore: c.maxScore,
    weightPercent: c.weightPercent ?? null,
  })),
  rulesSections: (event.rulesSections || []).map((sec) => ({
    title: sec.title,
    rules: sec.rules.map((rule) => ({ rule })),
  })),
  schedule: (event.schedule || []).map((s) => ({
    timeLabel: s.timeLabel,
    title: s.title,
    description: s.description,
    location: s.location ?? null,
  })),
  faqs: (event.faqs || []).map((f) => ({ question: f.question, answer: f.answer })),
})

/**
 * Writes the bundled event data (src/lib/data/seed-events.ts) into the CMS, matching by slug.
 * Overwrites CMS edits for those events, so it only runs when SYNC_SEED_EVENTS=1 is set
 * for a single deploy.
 */
export async function syncSeedEvents(payload: Payload): Promise<void> {
  for (const event of SEED_AURIX_EVENTS) {
    const data = toDoc(event) as any
    const existing = await payload.find({
      collection: 'events',
      where: { slug: { equals: event.slug } },
      limit: 1,
      depth: 0,
      overrideAccess: true,
    })
    if (existing.docs[0]) {
      await payload.update({ collection: 'events', id: existing.docs[0].id, data, overrideAccess: true })
      payload.logger.info(`[sync-events] updated ${event.slug}`)
    } else {
      await payload.create({ collection: 'events', data, overrideAccess: true })
      payload.logger.info(`[sync-events] created ${event.slug}`)
    }
  }
}
