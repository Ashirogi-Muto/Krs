import type { GenericEvent } from './data/types'
import { DIRECT_ENTRY_WORDING } from './direct-entry-defaults'

/**
 * Hackathon direct entry (owner, 18 Oct 2026): registration closes on 23 Oct and the event is on 27 Oct, too close for the
 * online PPT screening round. The page therefore drops everything about that round and every registered team goes straight
 * to the on-site hackathon. Pure and unit-tested (tests/direct-entry.test.ts). Switched per competition in the CMS
 * (Events → Notice & coming soon → "Direct entry"); untick it to bring the screening round back. The CMS data is never
 * changed, and the portal / registration are not affected (only the public pages read through this).
 */

const isScreening = (r: { name?: string | null; submissionType?: string | null }) => r.submissionType === 'PROPOSAL' || /\b(ppt|screening)\b/i.test(r.name || '')

const mentionsScreening = (s: string) => /\b(ppt screening|screening round|online screening)\b/i.test(s)
const drop = (s: string) => DIRECT_ENTRY_WORDING.reduce((t, [re, to]) => t.replace(re, to), s)

export const isDirectEntry = (event: Pick<GenericEvent, 'directEntry'>) => Boolean(event.directEntry)

/** The Hackathon without the screening round; any other event (or the switch off) comes back unchanged. */
export function withDirectEntry<T extends GenericEvent>(event: T): T {
  if (!isDirectEntry(event)) return event
  const kept = (event.rounds || []).filter((r) => !isScreening(r))
  // Renumber so the page reads "Round 1" for the on-site final
  const rounds = kept.map((r, i) => ({
    ...r,
    number: i + 1,
    name: r.name ? r.name.replace(/^Round\s+\d+/i, `Round ${i + 1}`) : r.name,
    description: r.description ? drop(r.description) : r.description,
  }))
  const rulesSections = (event.rulesSections || [])
    .filter((s) => !/selection process/i.test(s.title || ''))
    .map((s) => ({ ...s, rules: (s.rules || []).filter((x) => !mentionsScreening(x)).map(drop) }))
    .filter((s) => (s.rules || []).length > 0)
  const schedule = (event.schedule || []).map((x) => ({ ...x, description: x.description ? drop(x.description) : x.description }))
  const faqs = (event.faqs || []).filter((f) => !mentionsScreening(`${f.question} ${f.answer}`))
  return { ...event, rounds, rulesSections, schedule, faqs }
}
