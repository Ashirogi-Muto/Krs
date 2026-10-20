import type { Payload, Where } from 'payload'
import { roundOf, type Round } from './judging'

/**
 * Judging data access (server only; lib/judging.ts holds the pure rules). Everything here runs with overrideAccess:
 * the /api/judge and /api/admin/judging routes check who may see what before calling it.
 */

const idOf = (x: any): number => Number(x && typeof x === 'object' ? x.id : x)
const LIVE: Where = { status: { not_in: ['CANCELLED', 'REJECTED'] } }

export async function loadRound(payload: Payload, id: unknown): Promise<Round | null> {
  const n = Number(id)
  if (!Number.isSafeInteger(n) || n <= 0) return null
  const doc = await payload.findByID({ collection: 'judging-rounds' as any, id: n, depth: 0, overrideAccess: true }).catch(() => null)
  return doc ? roundOf(doc) : null
}

/** Submissions of this round (registration id → submission), for the project details and the file. */
export async function roundSubmissions(payload: Payload, round: Pick<Round, 'event' | 'roundNumber'>, roundNumber = round.roundNumber) {
  const { docs } = await payload.find({
    collection: 'round-submissions',
    overrideAccess: true,
    depth: 0,
    pagination: false,
    where: { and: [{ event: { equals: round.event } }, { roundNumber: { equals: roundNumber } }] },
  })
  return new Map((docs as any[]).map((d) => [idOf(d.registration), d]))
}

/** Registration ids qualified in round N-1: Qualified on that round's submission or on its judging round. */
async function qualifiedBefore(payload: Payload, round: Round): Promise<Set<number>> {
  const prev = round.roundNumber - 1
  const out = new Set<number>()
  if (prev < 1) return out
  for (const [reg, s] of await roundSubmissions(payload, round, prev)) if ((s as any).status === 'QUALIFIED') out.add(reg)
  const { docs: rounds } = await payload.find({
    collection: 'judging-rounds' as any,
    overrideAccess: true,
    depth: 0,
    limit: 1,
    where: { and: [{ event: { equals: round.event } }, { roundNumber: { equals: prev } }] },
  })
  if (rounds.length) {
    const { docs } = await payload.find({ collection: 'judging-decisions' as any, overrideAccess: true, depth: 0, pagination: false, where: { round: { equals: (rounds[0] as any).id } } })
    for (const d of docs as any[]) {
      if (d.decision === 'QUALIFIED') out.add(idOf(d.registration))
      else out.delete(idOf(d.registration))
    }
  }
  return out
}

/** The teams (registrations) a round covers, by its "Teams to score" setting. Cancelled/rejected teams never count. */
export async function roundTeams(payload: Payload, round: Round): Promise<any[]> {
  let where: Where
  if (round.teams === 'confirmed') where = { and: [{ event: { equals: round.event } }, { status: { equals: 'CONFIRMED' } }] }
  else {
    const ids = round.teams === 'submitted' ? [...(await roundSubmissions(payload, round)).keys()] : [...(await qualifiedBefore(payload, round))]
    if (!ids.length) return []
    where = { and: [{ event: { equals: round.event } }, { id: { in: ids } }, LIVE] }
  }
  const { docs } = await payload.find({
    collection: 'event-registrations',
    overrideAccess: true,
    depth: 0,
    pagination: false,
    sort: 'registrationCode',
    where,
    select: { registrationCode: true, teamName: true, college: true, members: true, status: true, event: true },
  })
  return docs as any[]
}

export type StoredScore = { id: number; registration: number; judge: number; marks: Record<string, number>; total: number; remarks: string; submittedAt: string; updatedAt: string }

export async function roundScores(payload: Payload, roundId: number, judge?: number): Promise<StoredScore[]> {
  const where: Where = judge ? { and: [{ round: { equals: roundId } }, { judge: { equals: judge } }] } : { round: { equals: roundId } }
  const { docs } = await payload.find({ collection: 'judge-scores' as any, overrideAccess: true, depth: 0, pagination: false, where })
  return (docs as any[]).map((d) => ({
    id: d.id,
    registration: idOf(d.registration),
    judge: idOf(d.judge),
    marks: d.marks && typeof d.marks === 'object' ? d.marks : {},
    total: Number(d.total) || 0,
    remarks: String(d.remarks || ''),
    submittedAt: d.submittedAt,
    updatedAt: d.updatedAt,
  }))
}

export async function roundDecisions(payload: Payload, roundId: number): Promise<Map<number, any>> {
  const { docs } = await payload.find({ collection: 'judging-decisions' as any, overrideAccess: true, depth: 0, pagination: false, where: { round: { equals: roundId } } })
  return new Map((docs as any[]).map((d) => [idOf(d.registration), d]))
}

/** Judges' display names (staff desk only). */
export async function judgeNames(payload: Payload, ids: number[]): Promise<Map<number, string>> {
  if (!ids.length) return new Map()
  const { docs } = await payload.find({ collection: 'users', overrideAccess: true, depth: 0, pagination: false, where: { id: { in: ids } }, select: { name: true, email: true } })
  return new Map((docs as any[]).map((u) => [Number(u.id), String(u.name || u.email)]))
}

/** May this judge open this submission's file? A non-draft round of its competition and round number that picks the
 * judge, allows the file and covers the team. */
export async function judgeMayOpenFile(payload: Payload, judgeId: number, submission: any): Promise<boolean> {
  const { docs } = await payload.find({
    collection: 'judging-rounds' as any,
    overrideAccess: true,
    depth: 0,
    limit: 1,
    where: {
      and: [
        { event: { equals: idOf(submission?.event) } },
        { roundNumber: { equals: Number(submission?.roundNumber) } },
        { judges: { in: [judgeId] } },
        { status: { in: ['OPEN', 'CLOSED'] } },
      ],
    },
  })
  if (!docs.length) return false
  const round = roundOf(docs[0])
  if (!round.view.file || !round.judges.includes(judgeId)) return false
  return (await roundTeams(payload, round)).some((t) => Number(t.id) === idOf(submission?.registration))
}
