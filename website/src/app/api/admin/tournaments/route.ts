import { headers } from 'next/headers'
import { getPayload } from 'payload'
import config from '@payload-config'
import { z } from 'zod'
import { can, canFor, eventScope } from '@/payload/access/permissions'
import { isSameOrigin } from '@/lib/auth/same-origin'
import { rateLimitUser } from '@/lib/rateLimit'
import { logger } from '@/lib/logger'
import { revalidateSite } from '@/lib/revalidate'
import { fill } from '@/lib/form-texts-defaults'
import { getTournamentTexts } from '@/lib/tournament-texts'
import {
  applyResult, buildBracket, checkRace, cleanConfig, clearResult, crossoverPairs, cryptoRand, drawGroups, drawPairs, EMPTY_STATE, groupMatches,
  hasResults, podium, shuffle, standings, trialRanking, TournamentError, type Slot, type State, type TeamId,
} from '@/lib/tournament'
import { candidates, loadTournament, mutate, toDoc, type Change, type TournamentDoc } from '@/lib/tournament-server'

export const dynamic = 'force-dynamic'

/**
 * Sports tournaments (/tournaments; owner, 20 Oct 2026). Access roles only:
 *   "Run tournaments" (tournaments.manage): everything, per competition
 *   "Enter results only" (tournaments.score): results, race times and runs of drawn tournaments
 *   GET               -> tournaments I may see (+ competitions I may create them for)
 *   GET ?id=<id>      -> one tournament + the teams that may enter
 *   POST { action, id, rev, ... } -> one change (see ACTIONS); refused when someone else changed it meanwhile
 */
const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' } })

async function staff() {
  const payload = await getPayload({ config })
  const { user } = await payload.auth({ headers: await headers() })
  return { payload, user: user as any }
}
const mayManage = (u: any, event: number) => canFor(u, 'tournaments.manage', event)
const mayScore = (u: any, event: number) => mayManage(u, event) || canFor(u, 'tournaments.score', event)
const anyAccess = (u: any) => Boolean(u) && (can(u, 'tournaments.manage') || can(u, 'tournaments.score'))

const scopeOf = (u: any) => {
  const a = eventScope(u, 'tournaments.manage')
  const b = eventScope(u, 'tournaments.score')
  if (a === 'all' || b === 'all') return 'all' as const
  return [...new Set([...a, ...b].map(Number))]
}

export async function GET(req: Request) {
  const T = (await getTournamentTexts()).api
  const { payload, user } = await staff()
  if (!anyAccess(user)) return json({ error: T.notAllowed }, 403)
  if (!rateLimitUser(user.id, 'tournaments-get', 240, 60_000)) return json({ error: T.slowDown }, 429)
  const id = new URL(req.url).searchParams.get('id')
  if (!id) {
    const scope = scopeOf(user)
    const { docs } = await payload.find({
      collection: 'tournaments' as any,
      overrideAccess: true,
      depth: 1,
      pagination: false,
      sort: '-createdAt',
      where: scope === 'all' ? undefined : { event: { in: scope.length ? scope : [-1] } },
      select: { name: true, event: true, format: true, status: true, published: true, updatedAt: true },
    })
    const { docs: events } = await payload.find({ collection: 'events', overrideAccess: true, depth: 0, pagination: false, sort: 'title', select: { title: true } })
    return json({
      tournaments: (docs as any[]).map((d) => ({ id: d.id, name: d.name, event: d.event?.title || '', format: d.format, status: d.status, published: Boolean(d.published), updatedAt: d.updatedAt })),
      events: (events as any[]).filter((e) => mayManage(user, e.id)).map((e) => ({ id: e.id, title: e.title })),
    })
  }
  const t = await loadTournament(payload, id)
  if (!t || !mayScore(user, t.event)) return json({ error: T.notAllowed }, 404)
  return json({ tournament: t, canManage: mayManage(user, t.event), teams: mayManage(user, t.event) ? await candidates(payload, t.event) : [] })
}

const id = z.number().int().positive()
const team = z.number().int().positive()
const slot = z.union([team, z.literal('BYE'), z.null()])
const Body = z.discriminatedUnion('action', [
  z.object({ action: z.literal('create'), event: id, name: z.string().trim().min(1).max(80), format: z.enum(['league_knockout', 'knockout', 'race_bracket', 'time_trial']) }),
  z.object({ action: z.literal('rename'), id, rev: z.number().int(), name: z.string().trim().min(1).max(80) }),
  z.object({ action: z.literal('config'), id, rev: z.number().int(), config: z.record(z.string(), z.unknown()) }),
  z.object({ action: z.literal('teams'), id, rev: z.number().int(), teams: z.array(team).max(256) }),
  z.object({
    action: z.literal('draw'),
    id,
    rev: z.number().int(),
    mode: z.enum(['random', 'hand', 'locked']),
    locked: z.array(z.tuple([team, team])).max(128).optional(),
    hand: z.array(z.tuple([slot, slot])).max(128).optional(),
    placed: z.record(z.string().regex(/^\d+$/), z.number().int().min(0).max(15)).optional(),
    order: z.array(team).max(256).optional(),
  }),
  z.object({
    action: z.literal('knockout'),
    id,
    rev: z.number().int(),
    mode: z.enum(['crossover', 'random', 'hand', 'locked']),
    locked: z.array(z.tuple([team, team])).max(64).optional(),
    hand: z.array(z.tuple([slot, slot])).max(64).optional(),
  }),
  z.object({ action: z.literal('result'), id, rev: z.number().int(), match: z.string().regex(/^(g\d+-\d+|b\d+-\d+|third)$/), result: z.record(z.string(), z.unknown()) }),
  z.object({ action: z.literal('clear'), id, rev: z.number().int(), match: z.string().regex(/^(g\d+-\d+|b\d+-\d+|third)$/) }),
  z.object({ action: z.literal('run'), id, rev: z.number().int(), round: z.number().int().min(0).max(7), team, attempt: z.number().int().min(1).max(5), run: z.record(z.string(), z.unknown()).nullable() }),
  z.object({ action: z.literal('advance'), id, rev: z.number().int(), round: z.number().int().min(0).max(7), count: z.number().int().min(1).max(256), includeTies: z.boolean().optional() }),
  z.object({ action: z.literal('publish'), id, rev: z.number().int(), published: z.boolean() }),
  z.object({ action: z.literal('finish'), id, rev: z.number().int(), finished: z.boolean() }),
  z.object({ action: z.literal('reset'), id, rev: z.number().int(), confirm: z.string().max(80) }),
])
type Action = z.infer<typeof Body>
const SCORE_ACTIONS = new Set(['result', 'clear', 'run'])

/** Knockout finished? (final decided, and the third-place match if there is one) */
const knockoutDone = (s: State) => {
  if (!s.bracket.length) return false
  const p = podium(s)
  const third = s.bracket.find((m) => m.stage === 'third')
  return p.first !== null && (!third || third.winner !== null || typeof third.a !== 'number' || typeof third.b !== 'number')
}

function apply(t: TournamentDoc, a: Action): Change & { audit?: Record<string, unknown> } {
  const cfg = t.config
  const s: State = structuredClone(t.state)
  const drawn = Boolean(s.draw)
  switch (a.action) {
    case 'rename':
      return { name: a.name }
    case 'config': {
      if (drawn) throw new TournamentError('drawn')
      const next = cleanConfig({ ...a.config, format: t.format })
      return { config: next, audit: { config: next } }
    }
    case 'teams': {
      if (drawn) throw new TournamentError('drawn')
      return { state: { ...s, entrants: a.teams.map((id) => ({ id, name: '', code: '' })) } }
    }
    case 'draw': {
      if (drawn) throw new TournamentError('drawn')
      const ids = s.entrants.map((e) => e.id)
      const at = new Date().toISOString()
      let next: State
      if (cfg.format === 'league_knockout') {
        const groups = drawGroups(ids, cfg.groups, { mode: a.mode, placed: a.placed }, cryptoRand)
        next = { ...s, groups, groupMatches: groupMatches(groups), bracket: [], trial: [], draw: { mode: a.mode, at, locked: [] } }
      } else if (cfg.format === 'time_trial') {
        // The draw is the running order of round 1
        let order: TeamId[]
        if (a.mode === 'hand') {
          order = a.order || []
          if (order.length !== ids.length || new Set(order).size !== order.length || order.some((x) => !ids.includes(x))) throw new TournamentError('handTeams')
        } else order = shuffle(ids, cryptoRand)
        next = { ...s, groups: [], groupMatches: [], bracket: [], trial: [{ round: 0, entries: order.map((team) => ({ team, runs: [] })) }], draw: { mode: a.mode === 'hand' ? 'hand' : 'random', at, locked: [] } }
      } else {
        const locked = (a.locked || []) as [TeamId, TeamId][]
        const pairs = drawPairs(ids, { mode: a.mode, locked, hand: a.hand as [Slot, Slot][] }, cryptoRand)
        next = { ...s, groups: [], groupMatches: [], trial: [], bracket: buildBracket(pairs, cfg.thirdPlace, a.mode === 'locked' ? locked : []), draw: { mode: a.mode, at, locked: a.mode === 'locked' ? locked : [] } }
      }
      return { state: next, status: 'LIVE', audit: { mode: a.mode, locked: a.locked || [], teams: ids.length, groups: next.groups, firstRound: next.bracket.filter((m) => m.round === 1).map((m) => [m.a, m.b]), order: next.trial[0]?.entries.map((e) => e.team) } }
    }
    case 'knockout': {
      if (cfg.format !== 'league_knockout' || !s.groups.length) throw new TournamentError('wrongStage')
      if (s.bracket.length) throw new TournamentError('drawn')
      if (s.groupMatches.some((m) => !m.result)) throw new TournamentError('groupsUnfinished')
      const tables = s.groups.map((g) => standings(g, s.groupMatches.filter((m) => g.includes(m.a as TeamId)), cfg).map((r) => r.team))
      const qualified = tables.flatMap((t) => t.slice(0, cfg.advancePerGroup))
      let pairs: [Slot, Slot][]
      if (a.mode === 'crossover') pairs = crossoverPairs(tables, cfg.advancePerGroup)
      else {
        if (a.mode === 'hand' && (a.hand || []).flat().some((x) => typeof x === 'number' && !qualified.includes(x))) throw new TournamentError('handTeams')
        pairs = drawPairs(qualified, { mode: a.mode, locked: (a.locked || []) as [TeamId, TeamId][], hand: a.hand as [Slot, Slot][] }, cryptoRand)
      }
      const locked = a.mode === 'locked' ? ((a.locked || []) as [TeamId, TeamId][]) : []
      return { state: { ...s, bracket: buildBracket(pairs, cfg.thirdPlace, locked) }, audit: { mode: a.mode, qualified, firstRound: pairs } }
    }
    case 'result': {
      if (!drawn) throw new TournamentError('wrongStage')
      const m = applyResult(s, a.match, a.result, cfg)
      return { state: s, status: knockoutDone(s) ? 'FINISHED' : 'LIVE', audit: { match: a.match, a: m.a, b: m.b, result: m.result, winner: m.winner } }
    }
    case 'clear': {
      const m = clearResult(s, a.match)
      return { state: s, status: 'LIVE', audit: { match: a.match, a: m.a, b: m.b } }
    }
    case 'run': {
      if (cfg.format !== 'time_trial') throw new TournamentError('wrongStage')
      const round = s.trial.find((r) => r.round === a.round)
      const entry = round?.entries.find((e) => e.team === a.team)
      if (!round || !entry) throw new TournamentError('noMatch')
      if (s.trial.some((r) => r.round > a.round)) throw new TournamentError('nextPlayed')
      if (a.attempt > cfg.trialRounds[a.round].attempts) throw new TournamentError('badAttempt')
      entry.runs = entry.runs.filter((r) => r.attempt !== a.attempt)
      if (a.run) entry.runs.push({ ...checkRace(a.run, cfg), attempt: a.attempt })
      entry.runs.sort((x, y) => x.attempt - y.attempt)
      return { state: s, status: 'LIVE', audit: { round: a.round, team: a.team, attempt: a.attempt, run: a.run } }
    }
    case 'advance': {
      if (cfg.format !== 'time_trial') throw new TournamentError('wrongStage')
      const last = Math.max(-1, ...s.trial.map((r) => r.round))
      if (a.round !== last || a.round + 1 >= cfg.trialRounds.length) throw new TournamentError('wrongStage')
      const cur = s.trial.find((r) => r.round === a.round)!
      if (cur.entries.some((e) => !e.runs.length)) throw new TournamentError('runsMissing')
      const rank = trialRanking(cur.entries, cfg.trialRounds[a.round], cfg).filter((r) => r.time !== null)
      let going = rank.slice(0, a.count)
      if (a.includeTies && going.length && rank.length > going.length) {
        const cut = going[going.length - 1].time
        going = rank.filter((r, i) => i < a.count || r.time === cut)
      }
      if (!going.length) throw new TournamentError('tooFewTeams')
      // Next round runs slowest qualifier first, fastest last
      return { state: { ...s, trial: [...s.trial, { round: a.round + 1, entries: [...going].reverse().map((r) => ({ team: r.team, runs: [] })) }] }, audit: { round: a.round, advanced: going.map((r) => r.team) } }
    }
    case 'publish':
      return { published: a.published, audit: { published: a.published } }
    case 'finish':
      if (!drawn) throw new TournamentError('wrongStage')
      return { status: a.finished ? 'FINISHED' : 'LIVE' }
    case 'reset': {
      if (a.confirm.trim() !== t.name) throw new TournamentError('confirmName')
      return { state: { ...EMPTY_STATE, entrants: s.entrants }, status: 'SETUP', audit: { hadResults: hasResults(s), state: t.state } }
    }
  }
  throw new TournamentError('badRequest')
}

export async function POST(req: Request) {
  const TT = await getTournamentTexts()
  const T = TT.api
  if (!isSameOrigin(req)) return json({ error: T.badOrigin }, 403)
  const { payload, user } = await staff()
  if (!anyAccess(user)) return json({ error: T.notAllowed }, 403)
  if (!rateLimitUser(user.id, 'tournaments-post', 120, 60_000)) return json({ error: T.slowDown }, 429)
  if (Number(req.headers.get('content-length') || 0) > 64_000) return json({ error: T.badRequest }, 413)
  const parsed = Body.safeParse(await req.json().catch(() => null))
  if (!parsed.success) return json({ error: T.badRequest }, 400)
  const a = parsed.data
  const who = String(user.email)

  try {
    if (a.action === 'create') {
      if (!mayManage(user, a.event)) return json({ error: T.notAllowed }, 403)
      const doc: any = await payload.create({
        collection: 'tournaments' as any,
        overrideAccess: true,
        depth: 1,
        data: {
          name: a.name,
          event: a.event,
          format: a.format,
          status: 'SETUP',
          published: false,
          rev: 0,
          // Brochure penalties with their CMS names (organisers can change or remove them before the draw)
          config: cleanConfig({ format: a.format, penalties: [{ key: 'touch', label: TT.desk.penTouch, seconds: 10 }, { key: 'offcourse', label: TT.desk.penOffcourse, seconds: 5 }] }),
          state: EMPTY_STATE,
        } as any,
      })
      logger.audit(who, 'TOURNAMENT_CREATED', 'Tournament', String(doc.id), { name: a.name, event: a.event, format: a.format })
      return json({ tournament: toDoc(doc) })
    }
    const t = await loadTournament(payload, a.id)
    if (!t) return json({ error: T.notAllowed }, 404)
    if (SCORE_ACTIONS.has(a.action) ? !mayScore(user, t.event) : !mayManage(user, t.event)) return json({ error: T.notAllowed }, 403)

    let audit: Record<string, unknown> | undefined
    const saved = await mutate(payload, t.id, a.rev, async (cur) => {
      const change = apply(cur, a)
      audit = change.audit
      delete change.audit
      // Team names are copied in when the teams are chosen (the public page shows names only)
      if (a.action === 'teams') {
        const allowed = new Map((await candidates(payload, cur.event)).map((c) => [c.id, c]))
        if (a.teams.some((x) => !allowed.has(x))) throw new TournamentError('teamNotAllowed')
        change.state!.entrants = [...new Set(a.teams)].map((x) => ({ id: x, name: allowed.get(x)!.name, code: allowed.get(x)!.code }))
        audit = { teams: change.state!.entrants.map((e) => e.id) }
      }
      return change
    })
    logger.audit(who, `TOURNAMENT_${a.action.toUpperCase()}`, 'Tournament', String(t.id), { rev: saved.rev, ...(audit || {}) })
    if (saved.published || a.action === 'publish') revalidateSite('tournaments')
    return json({ tournament: saved })
  } catch (err: any) {
    if (err instanceof TournamentError) {
      const msg = (T as Record<string, string>)[err.code] || T.badRequest
      return json({ error: fill(msg, Object.fromEntries(Object.entries(err.detail).map(([k, v]) => [k, String(v)]))), code: err.code }, err.code === 'changed' ? 409 : 400)
    }
    throw err
  }
}
