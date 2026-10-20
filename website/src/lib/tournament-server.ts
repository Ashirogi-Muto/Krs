import type { Payload } from 'payload'
import { cleanConfig, displayNames, EMPTY_STATE, TournamentError, type Config, type State } from './tournament'

/**
 * Tournament storage (server only; lib/tournament.ts holds the rules). Every change goes through `mutate`: one change
 * at a time per tournament (queue), the client's revision must still be the stored one, and the revision goes up.
 */

export type TournamentDoc = { id: number; name: string; event: number; eventTitle: string; format: Config['format']; status: 'SETUP' | 'LIVE' | 'FINISHED'; published: boolean; rev: number; config: Config; state: State; updatedAt: string }

const idOf = (x: any): number => Number(x && typeof x === 'object' ? x.id : x)

export function cleanState(s: any): State {
  const st = s && typeof s === 'object' ? s : {}
  return {
    entrants: Array.isArray(st.entrants) ? st.entrants : [],
    groups: Array.isArray(st.groups) ? st.groups : [],
    groupMatches: Array.isArray(st.groupMatches) ? st.groupMatches : [],
    bracket: Array.isArray(st.bracket) ? st.bracket : [],
    trial: Array.isArray(st.trial) ? st.trial : [],
    draw: st.draw || null,
  }
}

export function toDoc(d: any): TournamentDoc {
  const config = cleanConfig({ ...(d?.config || {}), format: d?.format })
  return {
    id: Number(d.id),
    name: String(d.name || ''),
    event: idOf(d.event),
    eventTitle: typeof d.event === 'object' ? String(d.event?.title || '') : '',
    format: config.format,
    status: ['SETUP', 'LIVE', 'FINISHED'].includes(d.status) ? d.status : 'SETUP',
    published: Boolean(d.published),
    rev: Number(d.rev) || 0,
    config,
    state: cleanState(d.state || EMPTY_STATE),
    updatedAt: d.updatedAt,
  }
}

export async function loadTournament(payload: Payload, id: unknown): Promise<TournamentDoc | null> {
  const n = Number(id)
  if (!Number.isSafeInteger(n) || n <= 0) return null
  const d = await payload.findByID({ collection: 'tournaments' as any, id: n, depth: 1, overrideAccess: true }).catch(() => null)
  return d ? toDoc(d) : null
}

// One change at a time per tournament (the site runs as one process)
const queues = new Map<number, Promise<unknown>>()
function serial<T>(id: number, fn: () => Promise<T>): Promise<T> {
  const prev = queues.get(id) || Promise.resolve()
  const run = prev.then(fn, fn)
  const tail = run.catch(() => undefined)
  queues.set(id, tail)
  void tail.then(() => queues.get(id) === tail && queues.delete(id))
  return run
}

export type Change = Partial<Pick<TournamentDoc, 'name' | 'status' | 'published' | 'config' | 'state'>>

/** Apply `fn` to the stored tournament if `rev` is still current; saves and returns the new version. */
export function mutate(payload: Payload, id: number, rev: number, fn: (t: TournamentDoc) => Change | Promise<Change>): Promise<TournamentDoc> {
  return serial(id, async () => {
    const t = await loadTournament(payload, id)
    if (!t) throw new TournamentError('notFound')
    if (t.rev !== rev) throw new TournamentError('changed')
    const change = await fn(t)
    const saved = await payload.update({
      collection: 'tournaments' as any,
      id,
      overrideAccess: true,
      depth: 1,
      data: { ...change, ...(change.config ? { format: change.config.format } : {}), rev: t.rev + 1 } as any,
    })
    return toDoc(saved)
  })
}

/** Teams that may enter: the competition's registrations except cancelled / rejected (confirmed ones pre-ticked). */
export async function candidates(payload: Payload, event: number) {
  const { docs } = await payload.find({
    collection: 'event-registrations',
    overrideAccess: true,
    depth: 0,
    pagination: false,
    sort: 'teamName',
    where: { and: [{ event: { equals: event } }, { status: { not_in: ['CANCELLED', 'REJECTED'] } }] },
    select: { teamName: true, registrationCode: true, status: true, checkedIn: true, college: true },
  })
  return (docs as any[]).map((r) => ({ id: Number(r.id), name: String(r.teamName), code: String(r.registrationCode), status: String(r.status), checkedIn: Boolean(r.checkedIn), college: String(r.college || '') }))
}

/** Published tournaments of a competition, for its public page: team names only. */
export async function publishedTournaments(payload: Payload, event: number) {
  const { docs } = await payload.find({
    collection: 'tournaments' as any,
    overrideAccess: true,
    depth: 0,
    pagination: false,
    sort: 'createdAt',
    where: { and: [{ event: { equals: event } }, { published: { equals: true } }] },
  })
  return (docs as any[]).map(toDoc).map((t) => publicView(t))
}

/** What visitors may see: no registration codes, ids replaced by names in the browser through `names`. */
export function publicView(t: TournamentDoc) {
  return {
    id: t.id,
    name: t.name,
    format: t.format,
    status: t.status,
    config: t.config,
    names: displayNames(t.state.entrants, 'public'),
    state: { ...t.state, entrants: t.state.entrants.map((e) => ({ id: e.id, name: displayNames(t.state.entrants, 'public')[e.id], code: '' })), draw: t.state.draw ? { ...t.state.draw, at: '' } : null },
  }
}
export type PublicTournament = ReturnType<typeof publicView>
