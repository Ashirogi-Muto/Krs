/**
 * Scoring formulas for judging rounds (owner, 20 Oct 2026): a round's final score per judge is an expression over the
 * round's criteria, written in the CMS, e.g. `innovation + technical - penalty * 2` or `(design + build) * if(complete, 1, 0.5)`.
 *
 * Pure module, no eval: the text is parsed into a small tree once and evaluated with the judge's marks. Bounded on
 * purpose (length, tree size, depth), so a formula cannot hang the server. Unknown names are refused when the round is
 * saved, so a typo never reaches a judge.
 *
 * Language
 *   numbers           12, 0.5
 *   criteria          their key, e.g. innovation (letters, digits, _); `total` = the sum of all marks
 *   operators         + - * / % ^ (power), comparisons < <= > >= == !=, && || !, and  cond ? a : b
 *   functions         min, max, sum, avg (any number of values), abs, round(x[, digits]), floor, ceil, sqrt,
 *                     clamp(x, lo, hi), if(cond, a, b)
 *   division by 0 = 0 and sqrt of a negative number = 0 (a missing mark never breaks a total); true = 1, false = 0
 */

export const FORMULA_MAX_LENGTH = 1000
const MAX_NODES = 400
// Parser depth: about 10 levels per bracket or function call, so ~40 nested brackets
const MAX_DEPTH = 400

export const FORMULA_FUNCTIONS = ['min', 'max', 'sum', 'avg', 'abs', 'round', 'floor', 'ceil', 'sqrt', 'clamp', 'if'] as const
/** Names a criterion key cannot have (functions and built-in values). */
export const RESERVED_NAMES = new Set<string>([...FORMULA_FUNCTIONS, 'total', 'true', 'false'])
export const CRITERION_KEY = /^[a-z][a-z0-9_]{0,31}$/

type Node =
  | { t: 'num'; v: number }
  | { t: 'var'; name: string }
  | { t: 'un'; op: '-' | '+' | '!'; a: Node }
  | { t: 'bin'; op: string; a: Node; b: Node }
  | { t: 'cond'; c: Node; a: Node; b: Node }
  | { t: 'call'; fn: string; args: Node[] }

export type Formula = { tree: Node; names: string[] }

/** Error with a code the CMS/API turns into editable wording; `at` = character position (0-based) when known. */
export class FormulaError extends Error {
  constructor(public code: 'tooLong' | 'syntax' | 'unknownName' | 'badArgs' | 'tooComplex' | 'empty', public detail = '', public at = -1) {
    super(`${code}${detail ? `: ${detail}` : ''}${at >= 0 ? ` (at ${at + 1})` : ''}`)
  }
}

type Tok = { k: 'num' | 'id' | 'op' | 'end'; v: string; at: number }

function tokenize(src: string): Tok[] {
  const out: Tok[] = []
  let i = 0
  while (i < src.length) {
    const c = src[i]
    if (/\s/.test(c)) { i++; continue }
    const num = /^(\d+(\.\d+)?|\.\d+)/.exec(src.slice(i))
    if (num) { out.push({ k: 'num', v: num[0], at: i }); i += num[0].length; continue }
    const id = /^[A-Za-z_][A-Za-z0-9_]*/.exec(src.slice(i))
    if (id) { out.push({ k: 'id', v: id[0], at: i }); i += id[0].length; continue }
    const two = src.slice(i, i + 2)
    if (['<=', '>=', '==', '!=', '&&', '||'].includes(two)) { out.push({ k: 'op', v: two, at: i }); i += 2; continue }
    if ('+-*/%^()<>!?:,'.includes(c)) { out.push({ k: 'op', v: c, at: i }); i++; continue }
    throw new FormulaError('syntax', c, i)
  }
  out.push({ k: 'end', v: '', at: src.length })
  return out
}

/** Parse a formula. `known` = the round's criterion keys; any other name is refused. */
export function parseFormula(src: string, known: Iterable<string>): Formula {
  const text = String(src ?? '')
  if (text.length > FORMULA_MAX_LENGTH) throw new FormulaError('tooLong', String(FORMULA_MAX_LENGTH))
  if (!text.trim()) throw new FormulaError('empty')
  const keys = new Set(known)
  const toks = tokenize(text)
  let p = 0
  let nodes = 0
  const names = new Set<string>()
  const peek = () => toks[p]
  const take = () => toks[p++]
  const isOp = (v: string) => peek().k === 'op' && peek().v === v
  const expect = (v: string) => {
    if (!isOp(v)) throw new FormulaError('syntax', peek().v || 'end', peek().at)
    take()
  }
  const node = <T extends Node>(n: T, depth: number): T => {
    if (++nodes > MAX_NODES || depth > MAX_DEPTH) throw new FormulaError('tooComplex')
    return n
  }

  const ternary = (d: number): Node => {
    const c = or(d + 1)
    if (!isOp('?')) return c
    take()
    const a = ternary(d + 1)
    expect(':')
    const b = ternary(d + 1)
    return node({ t: 'cond', c, a, b }, d)
  }
  const binary = (ops: string[], next: (d: number) => Node) => (d: number): Node => {
    let a = next(d + 1)
    while (peek().k === 'op' && ops.includes(peek().v)) {
      const op = take().v
      a = node({ t: 'bin', op, a, b: next(d + 1) }, d)
    }
    return a
  }
  const unary = (d: number): Node => {
    if (peek().k === 'op' && ['-', '+', '!'].includes(peek().v)) {
      const op = take().v as '-' | '+' | '!'
      return node({ t: 'un', op, a: unary(d + 1) }, d)
    }
    return power(d + 1)
  }
  // Right-associative; binds tighter than unary minus on its left (-2^2 = -4)
  const power = (d: number): Node => {
    const a = primary(d + 1)
    if (!isOp('^')) return a
    take()
    return node({ t: 'bin', op: '^', a, b: unary(d + 1) }, d)
  }
  const primary = (d: number): Node => {
    const tok = take()
    if (tok.k === 'num') return node({ t: 'num', v: Number(tok.v) }, d)
    if (tok.k === 'op' && tok.v === '(') {
      const e = ternary(d + 1)
      expect(')')
      return e
    }
    if (tok.k === 'id') {
      const name = tok.v
      if (isOp('(')) {
        take()
        if (!(FORMULA_FUNCTIONS as readonly string[]).includes(name)) throw new FormulaError('unknownName', name, tok.at)
        const args: Node[] = []
        if (!isOp(')')) {
          args.push(ternary(d + 1))
          while (isOp(',')) { take(); args.push(ternary(d + 1)) }
        }
        expect(')')
        const n = args.length
        const ok =
          name === 'if' || name === 'clamp' ? n === 3
          : name === 'round' ? n === 1 || n === 2
          : ['abs', 'floor', 'ceil', 'sqrt'].includes(name) ? n === 1
          : n >= 1
        if (!ok) throw new FormulaError('badArgs', name, tok.at)
        return node({ t: 'call', fn: name, args }, d)
      }
      if (name === 'true' || name === 'false') return node({ t: 'num', v: name === 'true' ? 1 : 0 }, d)
      if (name !== 'total' && !keys.has(name)) throw new FormulaError('unknownName', name, tok.at)
      names.add(name)
      return node({ t: 'var', name }, d)
    }
    throw new FormulaError('syntax', tok.v || 'end', tok.at)
  }
  const or = binary(['||'], (d) => and(d))
  const and = binary(['&&'], (d) => eq(d))
  const eq = binary(['==', '!='], (d) => cmp(d))
  const cmp = binary(['<', '<=', '>', '>='], (d) => add(d))
  const add = binary(['+', '-'], (d) => mul(d))
  const mul = binary(['*', '/', '%'], (d) => unary(d))

  const tree = ternary(0)
  if (peek().k !== 'end') throw new FormulaError('syntax', peek().v, peek().at)
  return { tree, names: [...names] }
}

const finite = (x: number) => (Number.isFinite(x) ? x : 0)

function run(n: Node, vars: Record<string, number>): number {
  switch (n.t) {
    case 'num':
      return n.v
    case 'var':
      return finite(Number(vars[n.name] ?? 0))
    case 'un': {
      const a = run(n.a, vars)
      return n.op === '-' ? -a : n.op === '!' ? (a ? 0 : 1) : a
    }
    case 'cond':
      return run(n.c, vars) ? run(n.a, vars) : run(n.b, vars)
    case 'bin': {
      if (n.op === '&&') return run(n.a, vars) && run(n.b, vars) ? 1 : 0
      if (n.op === '||') return run(n.a, vars) || run(n.b, vars) ? 1 : 0
      const a = run(n.a, vars)
      const b = run(n.b, vars)
      switch (n.op) {
        case '+': return a + b
        case '-': return a - b
        case '*': return a * b
        case '/': return b === 0 ? 0 : a / b
        case '%': return b === 0 ? 0 : a % b
        case '^': return finite(Math.pow(a, b))
        case '<': return a < b ? 1 : 0
        case '<=': return a <= b ? 1 : 0
        case '>': return a > b ? 1 : 0
        case '>=': return a >= b ? 1 : 0
        case '==': return a === b ? 1 : 0
        case '!=': return a !== b ? 1 : 0
      }
      return 0
    }
    case 'call': {
      if (n.fn === 'if') return run(n.args[0], vars) ? run(n.args[1], vars) : run(n.args[2], vars)
      const v = n.args.map((x) => run(x, vars))
      switch (n.fn) {
        case 'min': return Math.min(...v)
        case 'max': return Math.max(...v)
        case 'sum': return v.reduce((s, x) => s + x, 0)
        case 'avg': return v.reduce((s, x) => s + x, 0) / v.length
        case 'abs': return Math.abs(v[0])
        case 'round': {
          const f = Math.pow(10, Math.max(0, Math.min(6, Math.trunc(v[1] ?? 0))))
          return Math.round(v[0] * f) / f
        }
        case 'floor': return Math.floor(v[0])
        case 'ceil': return Math.ceil(v[0])
        case 'sqrt': return v[0] < 0 ? 0 : Math.sqrt(v[0])
        case 'clamp': return Math.min(Math.max(v[0], v[1]), v[2])
      }
      return 0
    }
  }
}

/** Evaluate with the marks (key → number); `total` = their sum. Always a finite number. */
export function evaluateFormula(f: Formula, marks: Record<string, number>): number {
  const total = Object.values(marks).reduce((s, x) => s + finite(Number(x)), 0)
  const r = run(f.tree, { ...marks, total })
  return finite(r)
}

export type Criterion = { key: string; label?: string; min: number; max: number; step?: number }

/** The round's formula, or "sum of all criteria" when it is left empty. */
export function roundFormula(criteria: Criterion[], formula?: string | null): Formula {
  const keys = criteria.map((c) => c.key)
  if (!String(formula ?? '').trim()) return parseFormula(keys.length ? keys.join(' + ') : '0', keys)
  return parseFormula(String(formula), keys)
}

/** Lowest and highest result over every all-min / all-max corner of the marks (exact for sums; a guide otherwise). */
export function formulaRange(f: Formula, criteria: Criterion[]): { low: number; high: number } {
  const used = criteria.slice(0, 10) // 2^10 corners at most
  let low = Infinity
  let high = -Infinity
  for (let mask = 0; mask < 1 << used.length; mask++) {
    const marks: Record<string, number> = {}
    criteria.forEach((c, i) => (marks[c.key] = i < used.length && mask & (1 << i) ? c.max : c.min))
    const v = evaluateFormula(f, marks)
    low = Math.min(low, v)
    high = Math.max(high, v)
  }
  return { low: Number.isFinite(low) ? low : 0, high: Number.isFinite(high) ? high : 0 }
}
