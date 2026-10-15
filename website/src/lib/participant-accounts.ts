import type { Payload, Where } from 'payload'

/**
 * Admin tools → Participants: the filters of the list and of its CSV export (owner, 15 Oct 2026). One function builds
 * the query for both, so the export always contains exactly the accounts the screen shows for the same filters.
 */
export type ParticipantFilters = { q: string; status: 'all' | 'unconfirmed' | 'confirmed' | 'locked'; team: 'all' | 'yes' | 'no'; sort: string }

export const PARTICIPANT_SORTS: Record<string, string> = { newest: '-createdAt', oldest: 'createdAt', name: 'name', email: 'email' }
const str = (v: unknown) => (Array.isArray(v) ? String(v[0] ?? '') : v === undefined || v === null ? '' : String(v))
const pick = <T extends string>(v: string, allowed: readonly T[], fallback: T): T => ((allowed as readonly string[]).includes(v) ? (v as T) : fallback)

/** The filters from the screen's query string (search params object or URLSearchParams). Unknown values = "all". */
export function parseParticipantFilters(sp: Record<string, unknown> | URLSearchParams): ParticipantFilters {
  const get = (k: string) => (sp instanceof URLSearchParams ? sp.get(k) || '' : str((sp as Record<string, unknown>)[k]))
  return {
    q: get('q').trim().slice(0, 100),
    status: pick(get('status'), ['all', 'unconfirmed', 'confirmed', 'locked'] as const, 'all'),
    team: pick(get('team'), ['all', 'yes', 'no'] as const, 'all'),
    sort: pick(get('sort'), Object.keys(PARTICIPANT_SORTS), 'newest'),
  }
}

/** The same filters as a query string (for the export link). */
export function participantFilterQuery(f: ParticipantFilters): string {
  return new URLSearchParams(Object.entries(f).filter(([, v]) => v && v !== 'all') as [string, string][]).toString()
}

export type TeamLink = { code: string; event: string }
export type RegistrationLinks = { ids: Map<string, TeamLink[]>; emails: Map<string, TeamLink[]> }

/** Which registrations each account is linked to: as a portal account of the team, or as its leader email. */
export async function registrationLinks(payload: Payload): Promise<RegistrationLinks> {
  const res = await payload.find({
    collection: 'event-registrations',
    limit: 10000,
    pagination: false,
    depth: 0,
    overrideAccess: true,
    select: { participants: true, leaderEmail: true, registrationCode: true, event: true },
  })
  // Competition titles in one small query (depth 1 would also load every linked user account)
  const events = await payload.find({ collection: 'events', pagination: false, depth: 0, overrideAccess: true, select: { title: true } })
  const titles = new Map((events.docs as any[]).map((e) => [String(e.id), String(e.title || '')]))
  const ids = new Map<string, TeamLink[]>()
  const emails = new Map<string, TeamLink[]>()
  const add = (m: Map<string, TeamLink[]>, k: string, v: TeamLink) => m.set(k, [...(m.get(k) || []), v])
  for (const r of res.docs as any[]) {
    const link = { code: String(r.registrationCode || ''), event: titles.get(String(typeof r.event === 'object' ? r.event?.id : r.event)) || '' }
    for (const p of r.participants || []) add(ids, String(typeof p === 'object' ? p?.id : p), link)
    if (r.leaderEmail) add(emails, String(r.leaderEmail).toLowerCase(), link)
  }
  return { ids, emails }
}

/** The teams of one account (no duplicates when it is both linked and the leader email). */
export function teamsOf(links: RegistrationLinks, u: { id: unknown; email?: unknown }): TeamLink[] {
  const all = [...(links.ids.get(String(u.id)) || []), ...(links.emails.get(String(u.email || '').toLowerCase()) || [])]
  return all.filter((t, i) => all.findIndex((x) => x.code === t.code) === i)
}

export const unconfirmedWhere: Where = { or: [{ emailVerified: { equals: false } }, { emailVerified: { exists: false } }] }

/** The query for participant accounts matching the filters (the screen's list and the CSV export). */
export function participantWhere(f: ParticipantFilters, links: RegistrationLinks, now = new Date()): Where {
  const and: Where[] = [{ role: { equals: 'PARTICIPANT' } }]
  if (f.q) and.push({ or: ['name', 'email', 'institution', 'phone'].map((k) => ({ [k]: { like: f.q } })) })
  if (f.status === 'unconfirmed') and.push(unconfirmedWhere)
  if (f.status === 'confirmed') and.push({ emailVerified: { equals: true } })
  if (f.status === 'locked') and.push({ lockUntil: { greater_than: now.toISOString() } })
  if (f.team !== 'all') {
    const ids = [...links.ids.keys()].map(Number).filter(Number.isFinite).concat([-1])
    const mails = [...links.emails.keys()].concat(['-'])
    and.push(
      f.team === 'yes'
        ? { or: [{ id: { in: ids } }, { email: { in: mails } }] }
        : { and: [{ id: { not_in: ids } }, { email: { not_in: mails } }] },
    )
  }
  return { and }
}
