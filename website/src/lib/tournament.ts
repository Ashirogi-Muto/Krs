/**
 * Tournaments for sports events (owner, 20 Oct 2026): Robo Soccer and Robo Race (any competition can use them).
 * Organisers pick the format per tournament at /tournaments, draw it (fully random, by hand, or with locked pairs /
 * group places and the rest random), enter results, and publish it on the competition page.
 *
 * Pure module (no Payload, no I/O): the draw, brackets, league tables, race timing and every rule that decides who
 * advances. The server runs it on every change; the browser only shows what the server stored. Unit-tested
 * (tests/tournament.test.ts).
 */

export type Format = 'league_knockout' | 'knockout' | 'race_bracket' | 'time_trial'
export const FORMATS: Format[] = ['league_knockout', 'knockout', 'race_bracket', 'time_trial']
export type Tiebreaker = 'points' | 'goalDiff' | 'headToHead' | 'goalsFor' | 'wins'
export const TIEBREAKERS: Tiebreaker[] = ['points', 'goalDiff', 'headToHead', 'goalsFor', 'wins']

export type Penalty = { key: string; label: string; seconds: number }
export type TrialRound = { name: string; attempts: number; combine: 'best' | 'sum'; advance: number | null }

export type Config = {
  format: Format
  /** League: number of groups, teams per group going to the knockout, points, tie-break order */
  groups: number
  advancePerGroup: number
  points: { win: number; draw: number; loss: number }
  tiebreakers: Tiebreaker[]
  /** Knockout from the league: "crossover" (A1 v B2, B1 v A2…) or a new draw */
  knockoutSeeding: 'crossover' | 'draw'
  /** Knockout: play-off for third place; ties need a penalty shoot-out (soccer) */
  thirdPlace: boolean
  /** Races: penalties in seconds per occurrence, false starts allowed before disqualification, runs per heat */
  penalties: Penalty[]
  falseStartsAllowed: number
  runsPerHeat: number
  heatCombine: 'best' | 'sum'
  /** Time trial rounds (Elimination → Qualifier → Final) */
  trialRounds: TrialRound[]
  /** Shown with times, e.g. "s" */
  timeDecimals: number
}

export const DEFAULT_CONFIG: Config = {
  format: 'knockout',
  groups: 2,
  advancePerGroup: 2,
  points: { win: 3, draw: 1, loss: 0 },
  tiebreakers: ['points', 'goalDiff', 'headToHead', 'goalsFor'],
  knockoutSeeding: 'crossover',
  thirdPlace: false,
  // Robo Race brochure: +10 s per hand touch (qualifier), +5 s per off-course, second false start = disqualified.
  // Their names come from the CMS when a tournament is created (Tournament texts → penTouch / penOffcourse).
  penalties: [
    { key: 'touch', label: 'touch', seconds: 10 },
    { key: 'offcourse', label: 'offcourse', seconds: 5 },
  ],
  falseStartsAllowed: 1,
  runsPerHeat: 1,
  heatCombine: 'best',
  trialRounds: [
    { name: 'Round 1: Elimination', attempts: 1, combine: 'best', advance: null },
    { name: 'Round 2: Qualifier', attempts: 1, combine: 'best', advance: null },
    { name: 'Final', attempts: 1, combine: 'best', advance: null },
  ],
  timeDecimals: 2,
}

const int = (x: unknown, lo: number, hi: number, d: number) => {
  const n = Math.trunc(Number(x))
  return Number.isFinite(n) ? Math.min(hi, Math.max(lo, n)) : d
}
const numIn = (x: unknown, lo: number, hi: number, d: number) => {
  const n = Number(x)
  return Number.isFinite(n) ? Math.min(hi, Math.max(lo, n)) : d
}
const KEY = /^[a-z][a-z0-9_]{0,23}$/

/** Any input → a valid config (unknown values replaced by the defaults, sizes bounded). */
export function cleanConfig(input: any): Config {
  const c = input && typeof input === 'object' ? input : {}
  const d = DEFAULT_CONFIG
  const tb = Array.isArray(c.tiebreakers) ? (c.tiebreakers as string[]).filter((t): t is Tiebreaker => (TIEBREAKERS as string[]).includes(t)) : d.tiebreakers
  const pens = Array.isArray(c.penalties) ? c.penalties : d.penalties
  const seen = new Set<string>()
  return {
    format: (FORMATS as string[]).includes(c.format) ? c.format : d.format,
    groups: int(c.groups, 1, 16, d.groups),
    advancePerGroup: int(c.advancePerGroup, 1, 16, d.advancePerGroup),
    points: { win: numIn(c.points?.win, -100, 100, d.points.win), draw: numIn(c.points?.draw, -100, 100, d.points.draw), loss: numIn(c.points?.loss, -100, 100, d.points.loss) },
    tiebreakers: [...new Set(tb)].slice(0, 5),
    knockoutSeeding: c.knockoutSeeding === 'draw' ? 'draw' : 'crossover',
    thirdPlace: Boolean(c.thirdPlace),
    penalties: pens
      .slice(0, 12)
      .map((p: any) => ({ key: String(p?.key || ''), label: String(p?.label || '').slice(0, 40), seconds: numIn(p?.seconds, -3600, 3600, 0) }))
      .filter((p: Penalty) => KEY.test(p.key) && p.label && !seen.has(p.key) && seen.add(p.key)),
    falseStartsAllowed: int(c.falseStartsAllowed, 0, 10, d.falseStartsAllowed),
    runsPerHeat: int(c.runsPerHeat, 1, 5, d.runsPerHeat),
    heatCombine: c.heatCombine === 'sum' ? 'sum' : 'best',
    trialRounds: (Array.isArray(c.trialRounds) && c.trialRounds.length ? c.trialRounds : d.trialRounds).slice(0, 8).map((r: any, i: number) => ({
      name: String(r?.name || `Round ${i + 1}`).slice(0, 60),
      attempts: int(r?.attempts, 1, 5, 1),
      combine: r?.combine === 'sum' ? 'sum' : 'best',
      advance: r?.advance === null || r?.advance === undefined || r?.advance === '' ? null : int(r.advance, 1, 512, 1),
    })),
    timeDecimals: int(c.timeDecimals, 0, 3, d.timeDecimals),
  }
}

// ---------------------------------------------------------------------------------------------------------------
// Randomness: crypto in production; tests pass their own

export type Rand = () => number
export const cryptoRand: Rand = () => {
  const a = new Uint32Array(1)
  globalThis.crypto.getRandomValues(a)
  return a[0] / 2 ** 32
}
export function shuffle<T>(list: T[], rand: Rand): T[] {
  const a = [...list]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

// ---------------------------------------------------------------------------------------------------------------
// Matches

export type TeamId = number
/** null = an empty slot (winner not known yet); 'BYE' = no opponent */
export type Slot = TeamId | 'BYE' | null

export type Race = { time: number | null; penalties: Record<string, number>; falseStarts: number; dnf: boolean }
export type MatchResult = {
  /** Soccer: goals in regulation (+ extra time); races: unused */
  a?: number | null
  b?: number | null
  /** Soccer knockout tie: penalty shoot-out */
  penA?: number | null
  penB?: number | null
  /** Races: runs per side */
  runsA?: Race[]
  runsB?: Race[]
}
export type Match = {
  id: string
  stage: 'group' | 'bracket' | 'third'
  group?: number
  round: number
  slot: number
  a: Slot
  b: Slot
  result: MatchResult | null
  winner: TeamId | null
  /** Pair fixed by the organisers at the draw */
  locked?: boolean
}

export type Entrant = { id: TeamId; name: string; code: string }
export type TrialRun = Race & { attempt: number }
export type TrialEntry = { team: TeamId; runs: TrialRun[] }
export type State = {
  entrants: Entrant[]
  groups: TeamId[][]
  groupMatches: Match[]
  bracket: Match[]
  trial: { round: number; entries: TrialEntry[] }[]
  /** Draw details for the audit log and the page (mode, locked pairs) */
  draw: { mode: 'random' | 'hand' | 'locked'; at: string; locked: [TeamId, TeamId][] } | null
}
export const EMPTY_STATE: State = { entrants: [], groups: [], groupMatches: [], bracket: [], trial: [], draw: null }

/**
 * Names to show: two teams can register the same name (Robo Soccer has two "Robogyan"), so duplicates get the
 * registration code (organisers) or a number in id order (public page, no codes).
 */
export function displayNames(entrants: Entrant[], mode: 'staff' | 'public'): Record<string, string> {
  const count = new Map<string, number>()
  for (const e of entrants) count.set(e.name.trim().toLowerCase(), (count.get(e.name.trim().toLowerCase()) || 0) + 1)
  const seen = new Map<string, number>()
  const out: Record<string, string> = {}
  for (const e of [...entrants].sort((a, b) => a.id - b.id)) {
    const k = e.name.trim().toLowerCase()
    if ((count.get(k) || 0) < 2) out[e.id] = e.name
    else if (mode === 'staff') out[e.id] = `${e.name} · ${e.code}`
    else {
      seen.set(k, (seen.get(k) || 0) + 1)
      out[e.id] = `${e.name} (${seen.get(k)})`
    }
  }
  return out
}

export class TournamentError extends Error {
  constructor(public code: string, public detail: Record<string, string | number> = {}) {
    super(code)
  }
}

export const nextPow2 = (n: number) => {
  let p = 1
  while (p < n) p *= 2
  return Math.max(2, p)
}

/**
 * First-round pairs of a knockout: locked pairs stay together; every remaining team is placed at random (byes go
 * to random teams, never bye v bye); "hand" = the pairs given are the whole first round, in bracket order.
 */
export function drawPairs(teams: TeamId[], opts: { mode: 'random' | 'hand' | 'locked'; locked?: [TeamId, TeamId][]; hand?: [Slot, Slot][] }, rand: Rand): [Slot, Slot][] {
  const unique = [...new Set(teams)]
  if (unique.length !== teams.length) throw new TournamentError('duplicateTeam')
  if (unique.length < 2) throw new TournamentError('tooFewTeams')
  const size = nextPow2(unique.length)
  const set = new Set(unique)
  if (opts.mode === 'hand') {
    const pairs = opts.hand || []
    if (pairs.length !== size / 2) throw new TournamentError('handPairs', { n: size / 2 })
    const used = pairs.flat().filter((x) => x !== 'BYE' && x !== null) as TeamId[]
    if (used.length !== unique.length || new Set(used).size !== used.length || used.some((t) => !set.has(t))) throw new TournamentError('handTeams')
    if (pairs.some(([a, b]) => (a === 'BYE' || a === null) && (b === 'BYE' || b === null))) throw new TournamentError('byeVsBye')
    return pairs.map(([a, b]) => [a ?? 'BYE', b ?? 'BYE'])
  }
  const locked = opts.mode === 'locked' ? opts.locked || [] : []
  const inLock = locked.flat()
  if (new Set(inLock).size !== inLock.length || inLock.some((t) => !set.has(t)) || locked.some(([a, b]) => a === b)) throw new TournamentError('lockedTeams')
  if (locked.length > size / 2) throw new TournamentError('tooManyLocked')
  const rest = shuffle(unique.filter((t) => !inLock.includes(t)), rand)
  const byes = size - unique.length
  if (rest.length < byes) throw new TournamentError('tooManyLocked')
  const pairs: [Slot, Slot][] = locked.map(([a, b]) => [a, b])
  for (let i = 0; i < byes; i++) pairs.push([rest.shift()!, 'BYE'])
  while (rest.length) pairs.push([rest.shift()!, rest.shift()!])
  // Spread byes and locked pairs over the bracket
  return shuffle(pairs, rand)
}

/** A full knockout bracket from first-round pairs; byes advance at once. */
export function buildBracket(pairs: [Slot, Slot][], thirdPlace: boolean, locked: [TeamId, TeamId][] = []): Match[] {
  const size = pairs.length * 2
  const rounds = Math.log2(size)
  const isLocked = (a: Slot, b: Slot) => locked.some(([x, y]) => (x === a && y === b) || (x === b && y === a))
  const out: Match[] = []
  for (let r = 1; r <= rounds; r++) {
    const n = size / 2 ** r
    for (let s = 0; s < n; s++) {
      const [a, b] = r === 1 ? pairs[s] : [null, null]
      out.push({ id: `b${r}-${s}`, stage: 'bracket', round: r, slot: s, a, b, result: null, winner: null, ...(r === 1 && isLocked(a, b) ? { locked: true } : {}) })
    }
  }
  if (thirdPlace && rounds >= 2) out.push({ id: 'third', stage: 'third', round: rounds, slot: 0, a: null, b: null, result: null, winner: null })
  // Byes: the team goes straight through
  for (const m of out.filter((x) => x.round === 1)) {
    if (m.a === 'BYE' && typeof m.b === 'number') setWinner(out, m, m.b)
    else if (m.b === 'BYE' && typeof m.a === 'number') setWinner(out, m, m.a)
  }
  return out
}

const nextOf = (bracket: Match[], m: Match) => bracket.find((x) => x.stage === 'bracket' && x.round === m.round + 1 && x.slot === Math.floor(m.slot / 2))
const finalRound = (bracket: Match[]) => Math.max(0, ...bracket.filter((x) => x.stage === 'bracket').map((x) => x.round))

function setWinner(bracket: Match[], m: Match, winner: TeamId) {
  m.winner = winner
  if (m.stage !== 'bracket') return
  const next = nextOf(bracket, m)
  if (next) {
    if (m.slot % 2 === 0) next.a = winner
    else next.b = winner
    // A bye in the next round (only when the draw put two byes on one side, which drawPairs never does)
  }
  // Semi-final losers go to the third-place match
  const third = bracket.find((x) => x.stage === 'third')
  if (third && m.round === finalRound(bracket) - 1) {
    const loser = m.a === winner ? m.b : m.a
    if (typeof loser === 'number') {
      if (m.slot % 2 === 0) third.a = loser
      else third.b = loser
    }
  }
}

function clearWinner(bracket: Match[], m: Match) {
  m.winner = null
  if (m.stage !== 'bracket') return
  const next = nextOf(bracket, m)
  if (next) {
    if (m.slot % 2 === 0) next.a = null
    else next.b = null
  }
  const third = bracket.find((x) => x.stage === 'third')
  if (third && m.round === finalRound(bracket) - 1) {
    if (m.slot % 2 === 0) third.a = null
    else third.b = null
  }
}

/** Did a later match (that this one feeds) already get a result? Then this result cannot change. */
export function feedsPlayedMatch(bracket: Match[], m: Match): boolean {
  if (m.stage !== 'bracket') return false
  const next = nextOf(bracket, m)
  if (next && next.result) return true
  const third = bracket.find((x) => x.stage === 'third')
  return Boolean(third && third.result && m.round === finalRound(bracket) - 1)
}

// ---------------------------------------------------------------------------------------------------------------
// Races

/** Adjusted time of one run: time + penalties; null = DNF / disqualified (too many false starts) / no time. */
export function adjustedTime(run: Race | null | undefined, cfg: Pick<Config, 'penalties' | 'falseStartsAllowed'>): number | null {
  if (!run || run.dnf || run.time === null || run.time === undefined || !Number.isFinite(Number(run.time))) return null
  if ((run.falseStarts || 0) > cfg.falseStartsAllowed) return null
  let t = Number(run.time)
  for (const p of cfg.penalties) t += (Number(run.penalties?.[p.key]) || 0) * p.seconds
  return Math.max(0, t)
}
export const isDsq = (run: Race | null | undefined, cfg: Pick<Config, 'falseStartsAllowed'>) => Boolean(run && (run.falseStarts || 0) > cfg.falseStartsAllowed)

/** Several runs → one time (best or sum); null when no valid run (sum: any invalid run). */
export function combineRuns(runs: Race[], cfg: Pick<Config, 'penalties' | 'falseStartsAllowed'>, combine: 'best' | 'sum'): number | null {
  const times = runs.map((r) => adjustedTime(r, cfg))
  if (!times.length) return null
  if (combine === 'sum') return times.some((t) => t === null) ? null : (times as number[]).reduce((a, b) => a + b, 0)
  const ok = times.filter((t): t is number => t !== null)
  return ok.length ? Math.min(...ok) : null
}

export function checkRace(run: any, cfg: Config): Race {
  const time = run?.time === null || run?.time === undefined || run?.time === '' ? null : Number(run.time)
  if (time !== null && (!Number.isFinite(time) || time < 0 || time > 86_400)) throw new TournamentError('badTime')
  const penalties: Record<string, number> = {}
  for (const p of cfg.penalties) {
    const n = Number(run?.penalties?.[p.key] ?? 0)
    if (!Number.isInteger(n) || n < 0 || n > 99) throw new TournamentError('badPenalty', { penalty: p.label })
    if (n) penalties[p.key] = n
  }
  const falseStarts = Number(run?.falseStarts ?? 0)
  if (!Number.isInteger(falseStarts) || falseStarts < 0 || falseStarts > 10) throw new TournamentError('badPenalty', { penalty: 'falseStarts' })
  const dnf = Boolean(run?.dnf)
  if (time === null && !dnf && falseStarts <= cfg.falseStartsAllowed) throw new TournamentError('badTime')
  return { time, penalties, falseStarts, dnf }
}

// ---------------------------------------------------------------------------------------------------------------
// Results

const goals = (x: unknown) => {
  const n = Number(x)
  if (!Number.isInteger(n) || n < 0 || n > 999) throw new TournamentError('badScore')
  return n
}

/**
 * Check a result and work out the winner. Soccer group match: a draw is fine. Soccer knockout: a draw needs a
 * penalty shoot-out with a winner. Race: the lower combined adjusted time wins; both out = refused.
 */
export function decide(m: Match, input: any, cfg: Config): { result: MatchResult; winner: TeamId | null } {
  if (typeof m.a !== 'number' || typeof m.b !== 'number') throw new TournamentError('notReady')
  if (cfg.format === 'race_bracket') {
    const runsA = (Array.isArray(input?.runsA) ? input.runsA : []).slice(0, cfg.runsPerHeat).map((r: any) => checkRace(r, cfg))
    const runsB = (Array.isArray(input?.runsB) ? input.runsB : []).slice(0, cfg.runsPerHeat).map((r: any) => checkRace(r, cfg))
    if (runsA.length !== cfg.runsPerHeat || runsB.length !== cfg.runsPerHeat) throw new TournamentError('runsNeeded', { n: cfg.runsPerHeat })
    const ta = combineRuns(runsA, cfg, cfg.heatCombine)
    const tb = combineRuns(runsB, cfg, cfg.heatCombine)
    if (ta === null && tb === null) throw new TournamentError('bothOut')
    let winner: TeamId
    if (ta === null) winner = m.b
    else if (tb === null) winner = m.a
    else if (ta === tb) throw new TournamentError('raceTie')
    else winner = ta < tb ? m.a : m.b
    return { result: { runsA, runsB }, winner }
  }
  const a = goals(input?.a)
  const b = goals(input?.b)
  if (m.stage === 'group') return { result: { a, b }, winner: a > b ? m.a : b > a ? m.b : null }
  if (a !== b) return { result: { a, b }, winner: a > b ? m.a : m.b }
  const penA = goals(input?.penA)
  const penB = goals(input?.penB)
  if (penA === penB) throw new TournamentError('needShootout')
  return { result: { a, b, penA, penB }, winner: penA > penB ? m.a : m.b }
}

// ---------------------------------------------------------------------------------------------------------------
// League

/** Round-robin fixtures for one group (circle method): every pair once, spread over match days. */
export function roundRobin(teams: TeamId[]): [TeamId, TeamId, number][] {
  const list: (TeamId | null)[] = [...teams]
  if (list.length % 2) list.push(null)
  const n = list.length
  const out: [TeamId, TeamId, number][] = []
  for (let day = 0; day < n - 1; day++) {
    for (let i = 0; i < n / 2; i++) {
      const x = list[i]
      const y = list[n - 1 - i]
      if (x !== null && y !== null) out.push(day % 2 ? [y, x, day + 1] : [x, y, day + 1])
    }
    list.splice(1, 0, list.pop()!)
  }
  return out
}

/**
 * Groups: teams placed by the organisers stay (locked); the rest go at random to the smallest groups.
 * "hand" = every team is placed by the organisers.
 */
export function drawGroups(teams: TeamId[], count: number, opts: { mode: 'random' | 'hand' | 'locked'; placed?: Record<string, number> }, rand: Rand): TeamId[][] {
  const unique = [...new Set(teams)]
  if (unique.length !== teams.length) throw new TournamentError('duplicateTeam')
  if (count < 1 || unique.length < count * 2) throw new TournamentError('tooFewTeams')
  const groups: TeamId[][] = Array.from({ length: count }, () => [])
  const placed = opts.mode === 'random' ? {} : opts.placed || {}
  for (const [t, g] of Object.entries(placed)) {
    const id = Number(t)
    if (!unique.includes(id) || !Number.isInteger(g) || g < 0 || g >= count) throw new TournamentError('groupPlace')
    groups[g].push(id)
  }
  const rest = shuffle(unique.filter((t) => !groups.flat().includes(t)), rand)
  if (opts.mode === 'hand' && rest.length) throw new TournamentError('handTeams')
  for (const t of rest) {
    const min = Math.min(...groups.map((g) => g.length))
    const smallest = groups.map((g, i) => [g.length, i] as const).filter(([l]) => l === min).map(([, i]) => i)
    groups[smallest[Math.floor(rand() * smallest.length)]].push(t)
  }
  if (groups.some((g) => g.length < 2)) throw new TournamentError('groupTooSmall')
  return groups
}

export function groupMatches(groups: TeamId[][]): Match[] {
  return groups.flatMap((g, gi) => roundRobin(g).map(([a, b, day], i) => ({ id: `g${gi}-${i}`, stage: 'group' as const, group: gi, round: day, slot: i, a, b, result: null, winner: null })))
}

export type Row = { team: TeamId; played: number; won: number; drawn: number; lost: number; gf: number; ga: number; gd: number; points: number }

/** League table of one group, sorted by the tie-break order (head-to-head = a mini-table of the tied teams). */
export function standings(teams: TeamId[], matches: Match[], cfg: Pick<Config, 'points' | 'tiebreakers'>): Row[] {
  const table = (ids: TeamId[], ms: Match[]) => {
    const rows = new Map(ids.map((t) => [t, { team: t, played: 0, won: 0, drawn: 0, lost: 0, gf: 0, ga: 0, gd: 0, points: 0 } as Row]))
    for (const m of ms) {
      if (!m.result || typeof m.a !== 'number' || typeof m.b !== 'number' || !rows.has(m.a) || !rows.has(m.b)) continue
      const ga = Number(m.result.a) || 0
      const gb = Number(m.result.b) || 0
      const A = rows.get(m.a)!
      const B = rows.get(m.b)!
      A.played++, B.played++
      A.gf += ga, A.ga += gb, B.gf += gb, B.ga += ga
      if (ga > gb) (A.won++, B.lost++, (A.points += cfg.points.win), (B.points += cfg.points.loss))
      else if (gb > ga) (B.won++, A.lost++, (B.points += cfg.points.win), (A.points += cfg.points.loss))
      else (A.drawn++, B.drawn++, (A.points += cfg.points.draw), (B.points += cfg.points.draw))
    }
    for (const r of rows.values()) r.gd = r.gf - r.ga
    return rows
  }
  const all = table(teams, matches)
  const key = (r: Row, t: Tiebreaker) => (t === 'points' ? r.points : t === 'goalDiff' ? r.gd : t === 'goalsFor' ? r.gf : t === 'wins' ? r.won : 0)
  const sortBy = (ids: TeamId[], tbs: Tiebreaker[]): TeamId[] => {
    if (ids.length < 2 || !tbs.length) return [...ids].sort((a, b) => a - b)
    const [t, ...rest] = tbs
    let buckets: TeamId[][]
    if (t === 'headToHead') {
      const mini = table(ids, matches.filter((m) => ids.includes(m.a as TeamId) && ids.includes(m.b as TeamId)))
      const v = (id: TeamId) => [mini.get(id)!.points, mini.get(id)!.gd, mini.get(id)!.gf]
      const sorted = [...ids].sort((a, b) => {
        const x = v(a), y = v(b)
        return y[0] - x[0] || y[1] - x[1] || y[2] - x[2]
      })
      buckets = []
      for (const id of sorted) {
        const last = buckets[buckets.length - 1]
        if (last && v(last[0]).join() === v(id).join()) last.push(id)
        else buckets.push([id])
      }
    } else {
      const sorted = [...ids].sort((a, b) => key(all.get(b)!, t) - key(all.get(a)!, t))
      buckets = []
      for (const id of sorted) {
        const last = buckets[buckets.length - 1]
        if (last && key(all.get(last[0])!, t) === key(all.get(id)!, t)) last.push(id)
        else buckets.push([id])
      }
    }
    return buckets.flatMap((b) => (b.length > 1 ? sortBy(b, rest) : b))
  }
  return sortBy(teams, cfg.tiebreakers.length ? cfg.tiebreakers : ['points']).map((id) => all.get(id)!)
}

/** Knockout pairs from the group tables: crossover A1 v B2, B1 v A2, C1 v D2… (odd group counts: next group). */
export function crossoverPairs(tables: TeamId[][], perGroup: number): [Slot, Slot][] {
  const q = tables.map((t) => t.slice(0, perGroup))
  if (q.some((t) => t.length < perGroup)) throw new TournamentError('groupTooSmall')
  const pairs: [Slot, Slot][] = []
  if (q.length === 1) {
    const t = q[0]
    for (let i = 0; i < Math.floor(t.length / 2); i++) pairs.push([t[i], t[t.length - 1 - i]])
    if (t.length % 2) pairs.push([t[Math.floor(t.length / 2)], 'BYE'])
  } else {
    for (let g = 0; g < q.length; g++) {
      const other = q[(g + 1) % q.length]
      for (let i = 0; i < perGroup; i++) if (i % 2 === 0) pairs.push([q[g][i], other[perGroup - 1 - i]])
    }
  }
  const size = nextPow2(pairs.length * 2)
  while (pairs.length < size / 2) {
    // more slots than pairs: split the last real pair into byes so nobody plays twice
    const [a, b] = pairs.pop()!
    pairs.push([a, 'BYE'], [b, 'BYE'])
  }
  return pairs
}

// ---------------------------------------------------------------------------------------------------------------
// Time trial

export type TrialRow = { team: TeamId; time: number | null; dsq: boolean; runs: number }

/** Ranking of one trial round: lowest time first; no valid time (DNF / DSQ) last. */
export function trialRanking(entries: TrialEntry[], round: TrialRound, cfg: Config): TrialRow[] {
  return entries
    .map((e) => ({ team: e.team, time: combineRuns(e.runs, cfg, round.combine), dsq: e.runs.some((r) => isDsq(r, cfg)), runs: e.runs.length }))
    .sort((a, b) => (a.time === null ? 1 : 0) - (b.time === null ? 1 : 0) || (a.time ?? 0) - (b.time ?? 0) || a.team - b.team)
}

// ---------------------------------------------------------------------------------------------------------------
// Applying results (the server does this inside one locked write)

const listOf = (state: State, matchId: string) => (matchId.startsWith('g') ? state.groupMatches : state.bracket)

/** Record a result: check it, set the winner and move them on (next match, third-place match). */
export function applyResult(state: State, matchId: string, input: any, cfg: Config): Match {
  const m = listOf(state, matchId).find((x) => x.id === matchId)
  if (!m) throw new TournamentError('noMatch')
  if (m.stage !== 'group' && feedsPlayedMatch(state.bracket, m)) throw new TournamentError('nextPlayed')
  const { result, winner } = decide(m, input, cfg)
  if (m.stage !== 'group' && m.winner !== null) clearWinner(state.bracket, m)
  m.result = result
  if (m.stage === 'group') m.winner = winner
  else if (winner !== null) setWinner(state.bracket, m, winner)
  return m
}

/** Remove a result (only while the match it feeds has none). A bye stays a bye. */
export function clearResult(state: State, matchId: string): Match {
  const m = listOf(state, matchId).find((x) => x.id === matchId)
  if (!m) throw new TournamentError('noMatch')
  if (m.stage !== 'group' && feedsPlayedMatch(state.bracket, m)) throw new TournamentError('nextPlayed')
  if (!m.result) return m
  if (m.stage === 'group') m.winner = null
  else if (m.winner !== null) clearWinner(state.bracket, m)
  m.result = null
  return m
}

/** Any result entered (group, bracket or trial)? Then the draw can only be reset on purpose. */
export const hasResults = (s: State) => s.groupMatches.some((m) => m.result) || s.bracket.some((m) => m.result) || s.trial.some((r) => r.entries.some((e) => e.runs.length))

/** Champion, runner-up and third once decided (knockout formats). */
export function podium(s: State): { first: TeamId | null; second: TeamId | null; third: TeamId | null } {
  const fr = finalRound(s.bracket)
  const fin = s.bracket.find((m) => m.stage === 'bracket' && m.round === fr)
  const third = s.bracket.find((m) => m.stage === 'third')
  const other = (m: Match | undefined) => (m && m.winner !== null ? ((m.a === m.winner ? m.b : m.a) as TeamId) : null)
  return { first: fin?.winner ?? null, second: other(fin), third: third?.winner ?? null }
}
