import test from 'node:test'
import assert from 'node:assert/strict'
import { evaluateFormula, formulaRange, FormulaError, parseFormula, roundFormula } from '../src/lib/formula'
import { aggregate, checkMarks, DEFAULT_JUDGE_VIEW, ranks, roundOf, scoringSignature, selectTeams, type TeamResult } from '../src/lib/judging'
import { JudgingRounds, JudgeScores, JudgingDecisions } from '../src/payload/collections/Judging'
import { DEFAULT_JUDGING_TEXTS, JUDGING_TEXT_GROUPS } from '../src/lib/judging-texts-defaults'
import { isHideablePath } from '../src/lib/visibility'

// Judging (owner, 20 Oct 2026): criteria + a scoring formula per round, average of the judges' scores, shortlist tools.

const calc = (src: string, marks: Record<string, number> = {}, keys = Object.keys(marks)) => evaluateFormula(parseFormula(src, keys), marks)

test('formula: arithmetic, precedence, comparisons, functions', () => {
  assert.equal(calc('a + b - pen * 2', { a: 10, b: 5, pen: 1 }), 13)
  assert.equal(calc('-2^2'), -4)
  assert.equal(calc('2^3^2'), 512)
  assert.equal(calc('(a + b) * if(pen > 0, 0.5, 1)', { a: 10, b: 10, pen: 1 }), 10)
  assert.equal(calc('a > 5 ? a : 0', { a: 6 }), 6)
  assert.equal(calc('a >= 5 && b < 2 || pen', { a: 5, b: 3, pen: 0 }), 0)
  assert.equal(calc('!a', { a: 0 }), 1)
  assert.equal(calc('round(a / 3, 2)', { a: 10 }), 3.33)
  assert.equal(calc('min(a, b, 3) + max(a, b) + sum(1, 2) + avg(2, 4)', { a: 1, b: 9 }), 1 + 9 + 3 + 3)
  assert.equal(calc('clamp(a, 0, 10) + abs(-2) + floor(2.7) + ceil(2.1) + sqrt(9)', { a: 50 }), 10 + 2 + 2 + 3 + 3)
  assert.equal(calc('total', { a: 1, b: 2, c: 3 }), 6)
  assert.equal(calc('a % 3', { a: 10 }), 1)
  assert.equal(calc('true + false'), 1)
})

test('formula: a criterion can depend on another (multiplier, gate, penalty)', () => {
  const k = ['design', 'build', 'complete', 'late']
  const f = parseFormula('(design + build) * if(complete >= 5, 1, 0.5) - late * 5', k)
  assert.equal(evaluateFormula(f, { design: 8, build: 10, complete: 6, late: 0 }), 18)
  assert.equal(evaluateFormula(f, { design: 8, build: 10, complete: 2, late: 1 }), 4)
})

test('formula: never breaks a total (division by 0, sqrt of negative, overflow) and never runs code', () => {
  assert.equal(calc('a / 0', { a: 5 }), 0)
  assert.equal(calc('a % 0', { a: 5 }), 0)
  assert.equal(calc('sqrt(0 - 4)'), 0)
  assert.equal(calc('10 ^ 400'), 0)
  for (const bad of ['constructor', 'process.exit(1)', 'a; b', '`a`', "'x'", 'a = 1', 'globalThis', '__proto__', 'eval(1)']) {
    assert.throws(() => parseFormula(bad, ['a', 'b']), FormulaError, bad)
  }
})

test('formula: refused when unknown, malformed, too long or too complex; positions point at the problem', () => {
  const err = (src: string, keys = ['a']) => {
    try {
      parseFormula(src, keys)
      return null
    } catch (e: any) {
      return e as FormulaError
    }
  }
  assert.equal(err('a + foo')?.code, 'unknownName')
  assert.equal(err('a + foo')?.at, 4)
  assert.equal(err('a +')?.code, 'syntax')
  assert.equal(err('(a')?.code, 'syntax')
  assert.equal(err('max()')?.code, 'badArgs')
  assert.equal(err('if(a, 1)')?.code, 'badArgs')
  assert.equal(err('nope(a)')?.code, 'unknownName')
  assert.equal(err('   ')?.code, 'empty')
  assert.equal(err('a'.repeat(1001))?.code, 'tooLong')
  assert.equal(err('1' + '+1'.repeat(400))?.code, 'tooComplex')
  assert.equal(err('('.repeat(30) + 'a' + ')'.repeat(30)), null, '30 nested brackets are fine')
})

test('formula: empty = sum of the criteria; range over the lowest/highest marks', () => {
  const cr = [
    { key: 'a', min: 0, max: 20 },
    { key: 'b', min: 0, max: 5 },
  ]
  assert.equal(evaluateFormula(roundFormula(cr, ''), { a: 3, b: 4 }), 7)
  assert.deepEqual(formulaRange(roundFormula(cr, ''), cr), { low: 0, high: 25 })
  assert.deepEqual(formulaRange(roundFormula(cr, 'a - b * 2'), cr), { low: -10, high: 20 })
})

const CRIT = [
  { key: 'innovation', label: 'Innovation', min: 0, max: 20, step: 1 },
  { key: 'demo', label: 'Demo', min: 0, max: 10, step: 0.5 },
]

test('marks: every criterion, within range, on the step; extra keys dropped', () => {
  assert.deepEqual(checkMarks(CRIT, { innovation: 15, demo: 7.5, extra: 99 }), { ok: true, marks: { innovation: 15, demo: 7.5 } })
  assert.deepEqual(checkMarks(CRIT, { innovation: '15', demo: '7' }), { ok: true, marks: { innovation: 15, demo: 7 } })
  assert.deepEqual(checkMarks(CRIT, { innovation: 15 }), { ok: false, key: 'demo', reason: 'missing' })
  assert.deepEqual(checkMarks(CRIT, { innovation: 21, demo: 1 }), { ok: false, key: 'innovation', reason: 'range' })
  assert.deepEqual(checkMarks(CRIT, { innovation: -1, demo: 1 }), { ok: false, key: 'innovation', reason: 'range' })
  assert.deepEqual(checkMarks(CRIT, { innovation: 14.5, demo: 1 }), { ok: false, key: 'innovation', reason: 'step' })
  assert.deepEqual(checkMarks(CRIT, { innovation: 'x', demo: 1 }), { ok: false, key: 'innovation', reason: 'missing' })
  assert.deepEqual(checkMarks(CRIT, { innovation: true, demo: 1 }), { ok: false, key: 'innovation', reason: 'missing' })
  assert.deepEqual(checkMarks(CRIT, { innovation: Infinity, demo: 1 }), { ok: false, key: 'innovation', reason: 'missing' })
  assert.equal(checkMarks([{ key: 'x', min: 0, max: 1, step: 0 }], { x: 0.123 }).ok, true, 'step 0 = any value')
})

test('results: average of each judge\'s formula score; per-criterion averages; spread; ranks share ties', () => {
  const round = { criteria: CRIT, formula: 'innovation * if(demo >= 5, 1, 0.5)' }
  const res = aggregate(round, [
    { registration: 1, judge: 10, marks: { innovation: 20, demo: 6 } }, // 20
    { registration: 1, judge: 11, marks: { innovation: 10, demo: 2 } }, // 5
    { registration: 2, judge: 10, marks: { innovation: 12, demo: 9 } }, // 12
    { registration: 3, judge: 10, marks: { innovation: 12, demo: 5 } }, // 12
  ])
  assert.deepEqual(res.map((r) => [r.registration, r.average, r.judges, r.spread]), [[1, 12.5, 2, 15], [2, 12, 1, 0], [3, 12, 1, 0]])
  assert.deepEqual(res[0].criteria, { innovation: 15, demo: 4 })
  assert.deepEqual([...ranks(res)], [[1, 1], [2, 2], [3, 2]])
})

const R = (registration: number, average: number, judges = 3, spread = 0, criteria: Record<string, number> = {}): TeamResult => ({ registration, average, judges, spread, criteria, totals: [] })

test('shortlist tools: top N (with/without ties), minimum/maximum average, judges, spread, per criterion', () => {
  const rows = [R(1, 90, 3, 5, { demo: 9 }), R(2, 80, 3, 20, { demo: 4 }), R(3, 80, 2, 2, { demo: 8 }), R(4, 70, 3, 1, { demo: 9 }), R(5, 60, 3, 0, { demo: 2 })]
  assert.deepEqual(selectTeams(rows, {}), { ids: [], cutTie: [] }, 'no rules = nobody')
  assert.deepEqual(selectTeams(rows, { topN: 2 }), { ids: [1, 2], cutTie: [2, 3] })
  assert.deepEqual(selectTeams(rows, { topN: 2, includeTies: true }).ids, [1, 2, 3])
  assert.deepEqual(selectTeams(rows, { topN: 3 }).cutTie, [])
  assert.deepEqual(selectTeams(rows, { minAverage: 75 }).ids, [1, 2, 3])
  assert.deepEqual(selectTeams(rows, { maxAverage: 70 }).ids, [4, 5])
  assert.deepEqual(selectTeams(rows, { minJudges: 3, minAverage: 75 }).ids, [1, 2])
  assert.deepEqual(selectTeams(rows, { maxSpread: 5 }).ids, [1, 3, 4, 5])
  assert.deepEqual(selectTeams(rows, { criterionMin: { demo: 8 } }).ids, [1, 3, 4])
  assert.deepEqual(selectTeams(rows, { topN: 2, criterionMin: { demo: 8 } }).ids, [1, 3], 'rules apply before top N')
  assert.deepEqual(selectTeams(rows, { topN: 0 }).ids, [])
  assert.deepEqual(selectTeams(rows, { topN: 50 }).ids, [1, 2, 3, 4, 5])
})

test('round defaults: judges see names, colleges, project and file; not other judges; can edit until closed', () => {
  assert.deepEqual(DEFAULT_JUDGE_VIEW, { teamName: true, college: true, members: true, project: true, file: true, otherScores: false, editAfterSubmit: true, remarksRequired: false })
  const r = roundOf({ id: 4, event: { id: 1 }, judges: [{ id: 7 }, 8, 'x'], criteria: [{ key: 'a', label: 'A', min: 0, max: 5 }, { label: 'no key' }], judgeView: { college: false } })
  assert.deepEqual([r.id, r.event, r.status, r.teams, r.judges, r.criteria.length, r.view.college, r.view.teamName, r.decimals], [4, 1, 'DRAFT', 'confirmed', [7, 8], 1, false, true, 2])
})

const fieldOf = (name: string): any => JudgingRounds.fields.find((f: any) => f.name === name)
const keyField = (): any => fieldOf('criteria').fields.flatMap((f: any) => (f.fields ? f.fields : [f])).find((f: any) => f.name === 'key')

test('CMS: the formula is checked against the criteria on save; keys must be valid, unique and not reserved', () => {
  const validate = fieldOf('formula').validate
  const data = { criteria: [{ key: 'innovation', label: 'Innovation', min: 0, max: 20 }, { label: 'Demo & pitch', min: 0, max: 10 }] }
  assert.equal(validate('innovation + demo_and_pitch * 2', { data }), true, 'a key made from the name works')
  assert.equal(validate('', { data }), true)
  assert.match(String(validate('innovation + creativity', { data })), /"creativity" is not a criterion key/)
  assert.match(String(validate('innovation +', { data })), /mistake/)
  assert.equal(keyField().validate('innovation'), true)
  assert.match(String(keyField().validate('Total Score')), /lowercase/)
  assert.match(String(keyField().validate('total')), /reserved/)
  assert.match(String(keyField().validate('max')), /reserved/)
  assert.match(String(fieldOf('criteria').validate([{ key: 'a' }, { key: 'a' }])), /Two criteria have the key "a"/)
  // beforeValidate fills a missing key from the name
  const filled: any = JudgingRounds.hooks!.beforeValidate![0]({ data: { criteria: [{ label: 'UI / UX' }, { label: '3D design' }] } } as any)
  assert.deepEqual(filled.criteria.map((c: any) => c.key), ['ui_ux', 'c_3d_design'])
})

test('CMS: criteria, marks, formula, competition and round number lock once a judge has scored (labels stay editable)', async () => {
  const hook = JudgingRounds.hooks!.beforeChange![0] as any
  const original = { id: 3, event: 1, roundNumber: 1, criteria: [{ key: 'a', label: 'A', min: 0, max: 10, step: 1 }], formula: '' }
  const req = (scores: number) => ({ user: { id: 1, role: 'ADMIN' }, payload: { count: async () => ({ totalDocs: scores }) } })
  const change = (data: any, scores: number) => hook({ data, originalDoc: original, operation: 'update', req: req(scores) })
  await assert.doesNotReject(change({ criteria: [{ key: 'a', label: 'A', min: 0, max: 20, step: 1 }] }, 0), 'before scoring: free')
  await assert.rejects(change({ criteria: [{ key: 'a', label: 'A', min: 0, max: 20, step: 1 }] }, 2), /already scored/)
  await assert.rejects(change({ formula: 'a * 2' }, 1), /locked/)
  await assert.rejects(change({ criteria: [...original.criteria, { key: 'b', label: 'B', min: 0, max: 5, step: 1 }] }, 1), /locked/)
  await assert.rejects(change({ criteria: [] }, 1), /locked/)
  await assert.rejects(change({ event: 2 }, 1), /locked/)
  await assert.doesNotReject(change({ criteria: [{ key: 'a', label: 'Renamed', min: 0, max: 10, step: 1, guidance: 'new' }], status: 'OPEN', judges: [5] }, 9))
  assert.equal(scoringSignature(original), scoringSignature({ ...original, title: 'x', status: 'CLOSED' }))
  // A role limited to another competition cannot move a round onto (or create one for) a competition it doesn't hold
  const limited = { id: 9, role: 'STAFF', accessRoles: { docs: [{ permissions: ['judging.manage'], eventLimit: 'chosen', events: [2] }] } }
  await assert.rejects(hook({ data: { event: 1 }, operation: 'create', req: { user: limited, payload: { count: async () => ({ totalDocs: 0 }) } } }), /your own competitions/)
  await assert.doesNotReject(hook({ data: { event: 2 }, operation: 'create', req: { user: limited, payload: { count: async () => ({ totalDocs: 0 }) } } }))
})

test('scores and decisions are never written through the CMS or REST; a round with scores cannot be deleted', async () => {
  for (const c of [JudgeScores, JudgingDecisions]) {
    for (const u of [null, { id: 1, role: 'SUPER_ADMIN' }, { id: 2, role: 'JUDGE' }]) {
      assert.equal((c.access!.create as any)({ req: { user: u } }), false, `${c.slug} create`)
      assert.equal((c.access!.update as any)({ req: { user: u } }), false, `${c.slug} update`)
    }
  }
  const del = JudgingRounds.hooks!.beforeDelete![0] as any
  await assert.rejects(del({ id: 3, req: { payload: { count: async () => ({ totalDocs: 4 }) } } }), /4 judge scores/)
  await assert.doesNotReject(del({ id: 3, req: { payload: { count: async () => ({ totalDocs: 0 }) } } }))
})

test('judging wording: every text has a default; /judge and /judging cannot be hidden from the CMS', () => {
  for (const g of JUDGING_TEXT_GROUPS) for (const [k, , d] of g.fields) assert.ok(d && (DEFAULT_JUDGING_TEXTS as any)[g.key][k] === d, `${g.key}.${k}`)
  assert.equal(isHideablePath('/judge'), false)
  assert.equal(isHideablePath('/judging'), false)
})
