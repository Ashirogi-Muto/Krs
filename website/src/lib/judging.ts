/**
 * Judging (owner, 20 Oct 2026): Hackathon and Robo Ideathon rounds are scored by judges at /judge; staff see the
 * averages and decide at /judging. Pure module (no Payload): marks checks, per-judge totals through the round's
 * formula (lib/formula.ts), averages across judges and the shortlist tools. Unit-tested (tests/judging.test.ts).
 */
import { evaluateFormula, roundFormula, type Criterion, type Formula } from './formula'

export type JudgeView = {
  teamName: boolean
  college: boolean
  members: boolean
  project: boolean
  file: boolean
  otherScores: boolean
  editAfterSubmit: boolean
  remarksRequired: boolean
}
export const DEFAULT_JUDGE_VIEW: JudgeView = {
  teamName: true,
  college: true,
  members: true,
  project: true,
  file: true,
  otherScores: false,
  editAfterSubmit: true,
  remarksRequired: false,
}

/** Who may score at /judge (when picked on a round): Judge accounts and the Super Admin (owner, 20 Oct 2026). */
export const JUDGE_ROLES = ['JUDGE', 'SUPER_ADMIN']
export const mayJudge = (user: unknown) => Boolean(user && JUDGE_ROLES.includes(String((user as any).role)))

export type RoundTeams = 'submitted' | 'qualified' | 'confirmed'
export type RoundStatus = 'DRAFT' | 'OPEN' | 'CLOSED'

export type Round = {
  id: number
  title: string
  event: number
  roundNumber: number
  status: RoundStatus
  teams: RoundTeams
  judges: number[]
  criteria: (Criterion & { label: string; guidance?: string })[]
  formula: string
  decimals: number
  view: JudgeView
}

const idOf = (x: any): number => Number(x && typeof x === 'object' ? x.id : x)
const num = (x: unknown, d: number) => (x === null || x === undefined || x === '' || !Number.isFinite(Number(x)) ? d : Number(x))

/** A judging-rounds document → Round (missing values get safe defaults; a round without criteria scores 0). */
export function roundOf(doc: any): Round {
  const v = doc?.judgeView || {}
  return {
    id: idOf(doc?.id),
    title: String(doc?.title || ''),
    event: idOf(doc?.event),
    roundNumber: num(doc?.roundNumber, 1),
    status: (['DRAFT', 'OPEN', 'CLOSED'].includes(doc?.status) ? doc.status : 'DRAFT') as RoundStatus,
    teams: (['submitted', 'qualified', 'confirmed'].includes(doc?.teams) ? doc.teams : 'confirmed') as RoundTeams,
    judges: (Array.isArray(doc?.judges) ? doc.judges : []).map(idOf).filter((x: number) => Number.isSafeInteger(x) && x > 0),
    criteria: (Array.isArray(doc?.criteria) ? doc.criteria : [])
      .filter((c: any) => c && typeof c.key === 'string' && c.key)
      .map((c: any) => ({ key: c.key, label: String(c.label || c.key), min: num(c.min, 0), max: num(c.max, 0), step: num(c.step, 1), guidance: c.guidance || '' })),
    formula: String(doc?.formula || ''),
    decimals: Math.max(0, Math.min(4, Math.trunc(num(doc?.decimals, 2)))),
    view: Object.fromEntries(Object.entries(DEFAULT_JUDGE_VIEW).map(([k, d]) => [k, typeof v[k] === 'boolean' ? v[k] : d])) as JudgeView,
  }
}

/** What fixes how marks become a score: once a judge has scored, none of this may change (the label/guidance may). */
export function scoringSignature(doc: any): string {
  const r = roundOf(doc)
  return JSON.stringify({ e: r.event, n: r.roundNumber, c: r.criteria.map((c) => [c.key, c.min, c.max, c.step]), f: r.formula.trim() })
}

export type MarksResult = { ok: true; marks: Record<string, number> } | { ok: false; key: string; reason: 'missing' | 'range' | 'step' }

/** A judge's marks: one finite number per criterion, within min..max, on the criterion's step. Extra keys are dropped. */
export function checkMarks(criteria: Criterion[], input: unknown): MarksResult {
  const src = input && typeof input === 'object' ? (input as Record<string, unknown>) : {}
  const marks: Record<string, number> = {}
  for (const c of criteria) {
    const raw = src[c.key]
    if (raw === null || raw === undefined || raw === '' || typeof raw === 'boolean' || !Number.isFinite(Number(raw))) return { ok: false, key: c.key, reason: 'missing' }
    const v = Number(raw)
    if (v < c.min || v > c.max) return { ok: false, key: c.key, reason: 'range' }
    const step = Number(c.step) > 0 ? Number(c.step) : 0
    if (step) {
      const k = (v - c.min) / step
      if (Math.abs(k - Math.round(k)) > 1e-9) return { ok: false, key: c.key, reason: 'step' }
    }
    marks[c.key] = v
  }
  return { ok: true, marks }
}

/** Marks as the CMS shows them (Super Admin edits): one "key: mark" per line. */
export const marksToText = (marks: unknown) =>
  marks && typeof marks === 'object' ? Object.entries(marks as Record<string, unknown>).map(([k, v]) => `${k}: ${v}`).join('\n') : ''

/** "key: mark" lines (or a JSON object) → marks; `line` = the first line that cannot be read (1-based). */
export function marksFromText(text: string): { ok: true; marks: Record<string, number> } | { ok: false; line: number } {
  const t = String(text ?? '').trim()
  if (t.startsWith('{')) {
    try {
      const o = JSON.parse(t)
      if (o && typeof o === 'object' && !Array.isArray(o)) return { ok: true, marks: Object.fromEntries(Object.entries(o).map(([k, v]) => [k, Number(v)])) }
    } catch {
      /* fall through */
    }
    return { ok: false, line: 1 }
  }
  const marks: Record<string, number> = {}
  const lines = t.split(/\r?\n/)
  for (let i = 0; i < lines.length; i++) {
    if (!lines[i].trim()) continue
    const m = /^\s*([a-z][a-z0-9_]{0,31})\s*[:=]\s*(-?\d+(?:\.\d+)?)\s*$/.exec(lines[i])
    if (!m) return { ok: false, line: i + 1 }
    marks[m[1]] = Number(m[2])
  }
  return { ok: true, marks }
}

export const roundTo = (x: number, decimals: number) => {
  const f = Math.pow(10, decimals)
  return Math.round(x * f) / f
}

/** One judge's score for a team: the round's formula over the marks. */
export function judgeTotal(round: Pick<Round, 'criteria' | 'formula'>, marks: Record<string, number>, compiled?: Formula): number {
  return evaluateFormula(compiled || roundFormula(round.criteria, round.formula), marks)
}

export type ScoreRow = { registration: number; judge: number; marks: Record<string, number>; remarks?: string }
export type TeamResult = {
  registration: number
  judges: number
  average: number
  totals: { judge: number; total: number }[]
  criteria: Record<string, number>
  spread: number
}

/** Per team: each judge's total (the formula), the average of those totals, per-criterion averages and the spread. */
export function aggregate(round: Pick<Round, 'criteria' | 'formula'>, scores: ScoreRow[]): TeamResult[] {
  const f = roundFormula(round.criteria, round.formula)
  const byTeam = new Map<number, ScoreRow[]>()
  for (const s of scores) byTeam.set(s.registration, [...(byTeam.get(s.registration) || []), s])
  const out: TeamResult[] = []
  for (const [registration, rows] of byTeam) {
    const totals = rows.map((s) => ({ judge: s.judge, total: judgeTotal(round, s.marks, f) }))
    const crit: Record<string, number> = {}
    for (const c of round.criteria) crit[c.key] = rows.reduce((t, s) => t + num(s.marks?.[c.key], 0), 0) / rows.length
    const vals = totals.map((t) => t.total)
    out.push({
      registration,
      judges: rows.length,
      average: vals.reduce((a, b) => a + b, 0) / vals.length,
      totals,
      criteria: crit,
      spread: Math.max(...vals) - Math.min(...vals),
    })
  }
  return out.sort((a, b) => b.average - a.average || b.judges - a.judges || a.registration - b.registration)
}

/** Shortlist tools; every rule set is applied together (AND). Empty rules select nobody. */
export type SelectRules = {
  topN?: number | null
  /** with topN: also take teams tied with the last one */
  includeTies?: boolean
  minAverage?: number | null
  maxAverage?: number | null
  minJudges?: number | null
  maxSpread?: number | null
  /** per-criterion minimum of the judges' average mark */
  criterionMin?: Record<string, number | null | undefined>
}

const given = (x: unknown): x is number => x !== null && x !== undefined && (x as any) !== '' && Number.isFinite(Number(x))

/** Registration ids matching the rules, best first; `cutTie` = teams tied at the top-N cut-off (to decide by hand). */
export function selectTeams(results: TeamResult[], rules: SelectRules, decimals = 2): { ids: number[]; cutTie: number[] } {
  const r = (x: number) => roundTo(x, decimals)
  const any = given(rules.topN) || given(rules.minAverage) || given(rules.maxAverage) || given(rules.minJudges) || given(rules.maxSpread) || Object.values(rules.criterionMin || {}).some(given)
  if (!any) return { ids: [], cutTie: [] }
  let rows = results.filter((t) => {
    if (given(rules.minAverage) && r(t.average) < Number(rules.minAverage)) return false
    if (given(rules.maxAverage) && r(t.average) > Number(rules.maxAverage)) return false
    if (given(rules.minJudges) && t.judges < Number(rules.minJudges)) return false
    if (given(rules.maxSpread) && r(t.spread) > Number(rules.maxSpread)) return false
    for (const [k, v] of Object.entries(rules.criterionMin || {})) if (given(v) && r(t.criteria[k] ?? 0) < Number(v)) return false
    return true
  })
  rows = [...rows].sort((a, b) => b.average - a.average || a.registration - b.registration)
  let cutTie: number[] = []
  if (given(rules.topN)) {
    const n = Math.max(0, Math.trunc(Number(rules.topN)))
    if (n < rows.length && n > 0) {
      const last = r(rows[n - 1].average)
      const tied = rows.filter((t) => r(t.average) === last)
      if (tied.length > 1 && r(rows[n].average) === last) cutTie = tied.map((t) => t.registration)
      rows = rules.includeTies ? rows.filter((t, i) => i < n || r(t.average) === last) : rows.slice(0, n)
    } else if (n === 0) rows = []
  }
  return { ids: rows.map((t) => t.registration), cutTie }
}

/** Ranks with ties sharing a place (1, 2, 2, 4) on the rounded average. */
export function ranks(results: TeamResult[], decimals = 2): Map<number, number> {
  const out = new Map<number, number>()
  let prev: number | null = null
  let place = 0
  results.forEach((t, i) => {
    const v = roundTo(t.average, decimals)
    if (prev === null || v !== prev) place = i + 1
    prev = v
    out.set(t.registration, place)
  })
  return out
}
