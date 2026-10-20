import test from 'node:test'
import assert from 'node:assert/strict'
import {
  adjustedTime, buildBracket, cleanConfig, combineRuns, crossoverPairs, decide, DEFAULT_CONFIG, drawGroups, drawPairs, feedsPlayedMatch,
  groupMatches, nextPow2, roundRobin, standings, trialRanking, TournamentError, type Match, type Rand,
  applyResult, checkState, clearResult, displayNames, EMPTY_STATE, hasResults, podium,
} from '../src/lib/tournament'

// Sports tournaments (owner, 20 Oct 2026): draws, brackets, league tables, race timing.

/** Seeded random for repeatable draws */
const seeded = (seed: number): Rand => () => ((seed = (seed * 1103515245 + 12345) % 2 ** 31) / 2 ** 31)
const code = (e: unknown) => (e instanceof TournamentError ? e.code : String(e))
const throwsCode = (fn: () => unknown, c: string) => assert.throws(fn, (e) => code(e) === c, c)
const T = (n: number) => Array.from({ length: n }, (_, i) => i + 1)

test('random draw: every team exactly once, byes only against teams, power-of-two bracket', () => {
  for (const n of [2, 3, 5, 7, 8, 10, 13, 16]) {
    for (let s = 1; s < 25; s++) {
      const pairs = drawPairs(T(n), { mode: 'random' }, seeded(s))
      assert.equal(pairs.length, nextPow2(n) / 2, `n=${n}`)
      const teams = pairs.flat().filter((x) => x !== 'BYE')
      assert.deepEqual([...teams].sort((a: any, b: any) => a - b), T(n))
      assert.equal(pairs.flat().filter((x) => x === 'BYE').length, nextPow2(n) - n)
      assert.ok(pairs.every(([a, b]) => !(a === 'BYE' && b === 'BYE')))
    }
  }
})

test('random draw really varies (not the same order every time)', () => {
  const seen = new Set<string>()
  for (let s = 1; s < 30; s++) seen.add(JSON.stringify(drawPairs(T(8), { mode: 'random' }, seeded(s))))
  assert.ok(seen.size > 20)
})

test('locked pairs stay together; the rest is random; bad locks refused', () => {
  for (let s = 1; s < 30; s++) {
    const pairs = drawPairs(T(10), { mode: 'locked', locked: [[1, 2], [7, 3]] }, seeded(s))
    assert.ok(pairs.some(([a, b]) => (a === 1 && b === 2) || (a === 2 && b === 1)))
    assert.ok(pairs.some(([a, b]) => (a === 7 && b === 3) || (a === 3 && b === 7)))
    assert.equal(pairs.flat().filter((x) => x !== 'BYE').length, 10)
  }
  throwsCode(() => drawPairs(T(4), { mode: 'locked', locked: [[1, 2], [2, 3]] }, seeded(1)), 'lockedTeams')
  throwsCode(() => drawPairs(T(4), { mode: 'locked', locked: [[1, 1]] }, seeded(1)), 'lockedTeams')
  throwsCode(() => drawPairs(T(4), { mode: 'locked', locked: [[1, 99]] }, seeded(1)), 'lockedTeams')
  // 5 teams = 8 slots, 3 byes: locking 2 pairs leaves 1 team for 3 byes
  throwsCode(() => drawPairs(T(5), { mode: 'locked', locked: [[1, 2], [3, 4]] }, seeded(1)), 'tooManyLocked')
})

test('draw by hand: exactly the bracket the organisers set, checked', () => {
  const hand: any = [[1, 4], [2, 'BYE'], [3, 5], [6, 'BYE']]
  assert.deepEqual(drawPairs(T(6), { mode: 'hand', hand }, seeded(1)), hand)
  throwsCode(() => drawPairs(T(6), { mode: 'hand', hand: hand.slice(0, 3) }, seeded(1)), 'handPairs')
  throwsCode(() => drawPairs(T(6), { mode: 'hand', hand: [[1, 4], [2, 'BYE'], [3, 5], [5, 'BYE']] as any }, seeded(1)), 'handTeams')
  assert.deepEqual(drawPairs(T(4), { mode: 'hand', hand: [[1, 2], [3, 4]] as any }, seeded(1)), [[1, 2], [3, 4]])
  throwsCode(() => drawPairs(T(3), { mode: 'hand', hand: [[1, 2], ['BYE', 'BYE']] as any }, seeded(1)), 'handTeams')
  throwsCode(() => drawPairs([1, 1, 2], { mode: 'random' }, seeded(1)), 'duplicateTeam')
  throwsCode(() => drawPairs([1], { mode: 'random' }, seeded(1)), 'tooFewTeams')
})

const soccer = cleanConfig({ format: 'knockout', thirdPlace: true })

test('bracket: byes go straight through; winners move on; semi losers play for third; podium', () => {
  const s = { ...EMPTY_STATE, bracket: buildBracket([[1, 'BYE'], [2, 3], [4, 5], [6, 'BYE']], true) }
  const at = (id: string) => s.bracket.find((m) => m.id === id)!
  assert.equal(at('b2-0').a, 1, 'bye winner placed')
  assert.equal(at('b2-1').b, 6)
  assert.equal(applyResult(s, 'b1-1', { a: 2, b: 1 }, soccer).winner, 2)
  assert.equal(at('b2-0').b, 2)
  applyResult(s, 'b1-2', { a: 0, b: 3 }, soccer)
  assert.equal(at('b2-1').a, 5)
  // correct a result before the next match: the new winner replaces the old one
  applyResult(s, 'b1-1', { a: 0, b: 1 }, soccer)
  assert.equal(at('b2-0').b, 3)
  applyResult(s, 'b2-0', { a: 1, b: 1, penA: 5, penB: 4 }, soccer)
  applyResult(s, 'b2-1', { a: 2, b: 0 }, soccer)
  assert.deepEqual([at('b3-0').a, at('b3-0').b, at('third').a, at('third').b], [1, 5, 3, 6])
  applyResult(s, 'b3-0', { a: 0, b: 2 }, soccer)
  throwsCode(() => applyResult(s, 'b2-0', { a: 0, b: 1 }, soccer), 'nextPlayed')
  throwsCode(() => clearResult(s, 'b2-1'), 'nextPlayed')
  applyResult(s, 'third', { a: 3, b: 1 }, soccer)
  assert.deepEqual(podium(s), { first: 5, second: 1, third: 3 })
  clearResult(s, 'b3-0')
  assert.equal(at('b3-0').winner, null)
  assert.ok(hasResults(s))
  throwsCode(() => applyResult(s, 'b9-9', { a: 1, b: 0 }, soccer), 'noMatch')
})

test('soccer: knockout draw needs a shoot-out winner; group draw is fine; bad scores refused', () => {
  const ko: Match = { id: 'x', stage: 'bracket', round: 1, slot: 0, a: 1, b: 2, result: null, winner: null }
  assert.equal(decide(ko, { a: 2, b: 1 }, soccer).winner, 1)
  throwsCode(() => decide(ko, { a: 1, b: 1 }, soccer), 'badScore')
  throwsCode(() => decide(ko, { a: 1, b: 1, penA: 3, penB: 3 }, soccer), 'needShootout')
  assert.deepEqual(decide(ko, { a: 1, b: 1, penA: 4, penB: 3 }, soccer), { result: { a: 1, b: 1, penA: 4, penB: 3 }, winner: 1 })
  const g: Match = { ...ko, stage: 'group' }
  assert.equal(decide(g, { a: 0, b: 0 }, soccer).winner, null)
  for (const bad of [-1, 1.5, 'x', 1000]) throwsCode(() => decide(g, { a: bad, b: 0 }, soccer), 'badScore')
  throwsCode(() => decide({ ...ko, b: null }, { a: 1, b: 0 }, soccer), 'notReady')
  throwsCode(() => decide({ ...ko, b: 'BYE' }, { a: 1, b: 0 }, soccer), 'notReady')
})

const race = cleanConfig({ format: 'race_bracket' })

test('race: adjusted time = time + penalties; second false start disqualifies; lower time wins', () => {
  assert.deepEqual(race.penalties.map((p) => [p.key, p.seconds]), [['touch', 10], ['offcourse', 5]], 'brochure penalties')
  assert.equal(adjustedTime({ time: 42.5, penalties: { touch: 2, offcourse: 1 }, falseStarts: 1, dnf: false }, race), 42.5 + 20 + 5)
  assert.equal(adjustedTime({ time: 30, penalties: {}, falseStarts: 2, dnf: false }, race), null, 'second false start = DSQ')
  assert.equal(adjustedTime({ time: null, penalties: {}, falseStarts: 0, dnf: true }, race), null)
  const m: Match = { id: 'r', stage: 'bracket', round: 1, slot: 0, a: 1, b: 2, result: null, winner: null }
  assert.equal(decide(m, { runsA: [{ time: 40, penalties: { touch: 1 } }], runsB: [{ time: 45 }] }, race).winner, 2, '50 vs 45')
  assert.equal(decide(m, { runsA: [{ time: 40 }], runsB: [{ time: 30, falseStarts: 2 }] }, race).winner, 1, 'B disqualified')
  assert.equal(decide(m, { runsA: [{ dnf: true }], runsB: [{ time: 99 }] }, race).winner, 2)
  throwsCode(() => decide(m, { runsA: [{ dnf: true }], runsB: [{ dnf: true }] }, race), 'bothOut')
  throwsCode(() => decide(m, { runsA: [{ time: 40 }], runsB: [{ time: 40 }] }, race), 'raceTie')
  throwsCode(() => decide(m, { runsA: [{ time: -1 }], runsB: [{ time: 40 }] }, race), 'badTime')
  throwsCode(() => decide(m, { runsA: [{ time: 40, penalties: { touch: 1.5 } }], runsB: [{ time: 40 }] }, race), 'badPenalty')
  throwsCode(() => decide(m, { runsA: [{}], runsB: [{ time: 40 }] }, race), 'badTime')
  throwsCode(() => decide(m, { runsA: [], runsB: [{ time: 40 }] }, race), 'runsNeeded')
  const two = cleanConfig({ format: 'race_bracket', runsPerHeat: 2, heatCombine: 'sum' })
  assert.equal(combineRuns([{ time: 10, penalties: {}, falseStarts: 0, dnf: false }, { time: 12, penalties: { offcourse: 1 }, falseStarts: 0, dnf: false }], two, 'sum'), 27)
  assert.equal(combineRuns([{ time: 10, penalties: {}, falseStarts: 0, dnf: false }, { time: 12, penalties: {}, falseStarts: 0, dnf: true }], two, 'best'), 10)
  assert.equal(combineRuns([{ time: 10, penalties: {}, falseStarts: 0, dnf: false }, { time: 12, penalties: {}, falseStarts: 0, dnf: true }], two, 'sum'), null)
})

test('league: round robin plays every pair once; groups balanced, placed teams kept', () => {
  for (const n of [3, 4, 5, 6]) {
    const f = roundRobin(T(n))
    assert.equal(f.length, (n * (n - 1)) / 2)
    const keys = new Set(f.map(([a, b]) => [a, b].sort().join('-')))
    assert.equal(keys.size, f.length)
  }
  for (let s = 1; s < 20; s++) {
    const g = drawGroups(T(10), 3, { mode: 'locked', placed: { 1: 0, 2: 0, 9: 2 } }, seeded(s))
    assert.deepEqual(g.map((x) => x.length).sort(), [3, 3, 4])
    assert.ok(g[0].includes(1) && g[0].includes(2) && g[2].includes(9))
  }
  const random = drawGroups(T(8), 2, { mode: 'random', placed: { 1: 0 } }, seeded(3))
  assert.equal(random.flat().length, 8, 'random ignores placements')
  throwsCode(() => drawGroups(T(8), 2, { mode: 'hand', placed: { 1: 0 } }, seeded(1)), 'handTeams')
  throwsCode(() => drawGroups(T(5), 3, { mode: 'random' }, seeded(1)), 'tooFewTeams')
  throwsCode(() => drawGroups(T(6), 2, { mode: 'locked', placed: { 1: 5 } }, seeded(1)), 'groupPlace')
  assert.equal(groupMatches([[1, 2, 3], [4, 5, 6]]).length, 6)
})

test('league table: 3/1/0, then goal difference, head-to-head, goals scored', () => {
  const ms = groupMatches([[1, 2, 3, 4]])
  const res = (a: number, b: number, ga: number, gb: number) => {
    const m = ms.find((x) => (x.a === a && x.b === b) || (x.a === b && x.b === a))!
    m.result = m.a === a ? { a: ga, b: gb } : { a: gb, b: ga }
  }
  res(1, 2, 2, 0) // 1 wins
  res(3, 4, 1, 1)
  res(1, 3, 0, 1) // 3 wins
  res(2, 4, 3, 0) // 2 wins
  res(1, 4, 1, 1)
  res(2, 3, 1, 0) // 2 wins
  // points: 1: 4 (W D L), 2: 6, 3: 4, 4: 2. 1 v 3 tied on 4 points, GD 1: +1(2-0)+(-1)+0 = +1... 3: +1 (0 draw,1 win,0 loss) = 0+1-1 = 0
  const t = standings([1, 2, 3, 4], ms, DEFAULT_CONFIG)
  assert.deepEqual(t.map((r) => [r.team, r.points, r.gd]), [[2, 6, 2], [1, 4, 1], [3, 4, 0], [4, 2, -3]])
  // head-to-head first: 3 beat 1
  const h2h = standings([1, 2, 3, 4], ms, { ...DEFAULT_CONFIG, tiebreakers: ['points', 'headToHead', 'goalDiff'] })
  assert.deepEqual(h2h.map((r) => r.team), [2, 3, 1, 4])
  // custom points (win 2)
  assert.equal(standings([1, 2, 3, 4], ms, { ...DEFAULT_CONFIG, points: { win: 2, draw: 1, loss: 0 } })[0].points, 4)
})

test('knockout from groups: crossover A1 v B2 and B1 v A2', () => {
  assert.deepEqual(crossoverPairs([[1, 2, 3], [4, 5, 6]], 2), [[1, 5], [4, 2]])
  assert.deepEqual(crossoverPairs([[1, 2, 3, 4]], 4), [[1, 4], [2, 3]])
  assert.equal(crossoverPairs([[1, 2], [3, 4], [5, 6]], 2).length, 4, '3 groups x 2 = 6 → 8 slots')
  throwsCode(() => crossoverPairs([[1], [2, 3]], 2), 'groupTooSmall')
})

test('a result cannot change once the next match was played', () => {
  const b = buildBracket([[1, 2], [3, 4]], false)
  const semi = b.find((m) => m.id === 'b1-0')!
  const fin = b.find((m) => m.id === 'b2-0')!
  assert.equal(feedsPlayedMatch(b, semi), false)
  fin.result = { a: 1, b: 0 }
  assert.equal(feedsPlayedMatch(b, semi), true)
})

test('time trial: lowest adjusted time first; DNF / disqualified last', () => {
  const cfg = cleanConfig({ format: 'time_trial' })
  const r = trialRanking(
    [
      { team: 1, runs: [{ attempt: 1, time: 50, penalties: {}, falseStarts: 0, dnf: false }] },
      { team: 2, runs: [{ attempt: 1, time: 40, penalties: { touch: 2 }, falseStarts: 0, dnf: false }] },
      { team: 3, runs: [{ attempt: 1, time: 30, penalties: {}, falseStarts: 2, dnf: false }] },
      { team: 4, runs: [{ attempt: 1, time: 45, penalties: {}, falseStarts: 1, dnf: false }] },
    ],
    cfg.trialRounds[0],
    cfg,
  )
  assert.deepEqual(r.map((x) => [x.team, x.time, x.dsq]), [[4, 45, false], [1, 50, false], [2, 60, false], [3, null, true]])
})

test('config: bad input falls back to safe values', () => {
  const c = cleanConfig({ format: 'chess', groups: 999, points: { win: 'x' }, tiebreakers: ['points', 'luck', 'points'], penalties: [{ key: 'Bad Key', label: 'x', seconds: 5 }, { key: 'touch', label: 'Touch', seconds: 1e9 }], trialRounds: [{ name: 'Only', attempts: 99, advance: 0 }] })
  assert.equal(c.format, 'knockout')
  assert.equal(c.groups, 16)
  assert.equal(c.points.win, 3)
  assert.deepEqual(c.tiebreakers, ['points'])
  assert.deepEqual(c.penalties, [{ key: 'touch', label: 'Touch', seconds: 3600 }])
  assert.deepEqual(c.trialRounds, [{ name: 'Only', attempts: 5, combine: 'best', advance: 1 }])
})

test('duplicate team names: code for organisers, a number on the public page', () => {
  const e = [{ id: 9, name: 'Robogyan', code: 'AX26-RS-B' }, { id: 4, name: 'robogyan ', code: 'AX26-RS-A' }, { id: 5, name: 'N3xus', code: 'AX26-RS-C' }]
  assert.deepEqual(displayNames(e, 'staff'), { 4: 'robogyan  · AX26-RS-A', 5: 'N3xus', 9: 'Robogyan · AX26-RS-B' })
  assert.deepEqual(displayNames(e, 'public'), { 4: 'robogyan  (1)', 5: 'N3xus', 9: 'Robogyan (2)' })
})

test('hand-edited bracket data (Super Admin, CMS): teams must be entrants, ids unique, winners real', () => {
  const s = { ...EMPTY_STATE, entrants: [{ id: 1, name: 'A', code: '' }, { id: 2, name: 'B', code: '' }, { id: 3, name: 'C', code: '' }], bracket: buildBracket([[1, 2], [3, 'BYE']], false) }
  assert.equal(checkState(s), null)
  assert.equal(checkState({ ...s, entrants: [...s.entrants, { id: 1, name: 'A', code: '' }] })?.code, 'entrantTwice')
  assert.equal(checkState({ ...s, bracket: s.bracket.map((m) => (m.id === 'b1-0' ? { ...m, b: 99 } : m)) })?.code, 'matchTeam')
  assert.equal(checkState({ ...s, bracket: s.bracket.map((m) => (m.id === 'b1-0' ? { ...m, b: 1 } : m)) })?.code, 'sameTeam')
  assert.equal(checkState({ ...s, bracket: s.bracket.map((m) => (m.id === 'b1-0' ? { ...m, winner: 3 } : m)) })?.code, 'winner')
  assert.equal(checkState({ ...s, bracket: [...s.bracket, s.bracket[0]] })?.code, 'matchId')
  assert.equal(checkState({ ...s, groups: [[1, 7]] })?.code, 'groupTeam')
  assert.equal(checkState({ ...s, entrants: [{ id: 1, name: ' ', code: '' }] as any })?.code, 'entrant')
})
