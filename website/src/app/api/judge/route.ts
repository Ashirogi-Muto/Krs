import { headers } from 'next/headers'
import { getPayload, type Where } from 'payload'
import config from '@payload-config'
import { z } from 'zod'
import { isSameOrigin } from '@/lib/auth/same-origin'
import { rateLimitUser } from '@/lib/rateLimit'
import { logger } from '@/lib/logger'
import { fill } from '@/lib/form-texts-defaults'
import { getJudgingTexts } from '@/lib/judging-texts'
import { checkMarks, judgeTotal, roundTo, roundOf, type Round } from '@/lib/judging'
import { formulaRange, roundFormula } from '@/lib/formula'
import { loadRound, roundScores, roundSubmissions, roundTeams } from '@/lib/judging-server'

export const dynamic = 'force-dynamic'

/**
 * Judge portal API (/judge; owner, 20 Oct 2026). Only Judge accounts, only rounds they are picked for, never drafts.
 *   GET                 -> my rounds (open or closed) with progress
 *   GET ?round=<id>     -> the round's criteria and teams, showing only what the round lets judges see, plus my scores
 *   POST { round, registration, marks, remarks } -> save my score (round open; team in the round; marks checked and
 *                          the score worked out here with the round's formula, never taken from the browser)
 */
const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' } })

async function judge() {
  const payload = await getPayload({ config })
  const { user } = await payload.auth({ headers: await headers() })
  return { payload, user: user && (user as any).role === 'JUDGE' ? (user as any) : null }
}

const mine = (r: Round, userId: number) => r.judges.includes(Number(userId)) && r.status !== 'DRAFT'

export async function GET(req: Request) {
  const T = (await getJudgingTexts()).api
  const { payload, user } = await judge()
  if (!user) return json({ error: T.notAllowed }, 403)
  if (!rateLimitUser(user.id, 'judge-get', 240, 60_000)) return json({ error: T.slowDown }, 429)
  const roundParam = new URL(req.url).searchParams.get('round')

  if (!roundParam) {
    const { docs } = await payload.find({
      collection: 'judging-rounds' as any,
      overrideAccess: true,
      depth: 1,
      pagination: false,
      sort: 'title',
      where: { and: [{ judges: { in: [user.id] } }, { status: { in: ['OPEN', 'CLOSED'] } }] },
    })
    const rounds = []
    for (const d of docs as any[]) {
      const r = roundOf(d)
      if (!mine(r, user.id)) continue
      const [teams, scores] = await Promise.all([roundTeams(payload, r), roundScores(payload, r.id, user.id)])
      const ids = new Set(teams.map((t) => Number(t.id)))
      rounds.push({ id: r.id, title: r.title, event: d.event?.title || '', status: r.status, teams: ids.size, done: scores.filter((s) => ids.has(s.registration)).length })
    }
    return json({ rounds })
  }

  const round = await loadRound(payload, roundParam)
  if (!round || !mine(round, user.id)) return json({ error: T.notAllowed }, 404)
  const v = round.view
  const [teams, subs, scores] = await Promise.all([roundTeams(payload, round), roundSubmissions(payload, round), roundScores(payload, round.id)])
  const myScores = new Map(scores.filter((s) => s.judge === Number(user.id)).map((s) => [s.registration, s]))
  // Other judges are numbered, never named
  const otherJudges = [...new Set(scores.map((s) => s.judge).filter((j) => j !== Number(user.id)))].sort((a, b) => a - b)
  const f = roundFormula(round.criteria, round.formula)
  const range = formulaRange(f, round.criteria)

  return json({
    round: {
      id: round.id,
      title: round.title,
      status: round.status,
      criteria: round.criteria.map((c) => ({ key: c.key, label: c.label, min: c.min, max: c.max, step: c.step, guidance: c.guidance })),
      formula: round.formula,
      decimals: round.decimals,
      range: { low: roundTo(range.low, round.decimals), high: roundTo(range.high, round.decimals) },
      view: { editAfterSubmit: v.editAfterSubmit, remarksRequired: v.remarksRequired, otherScores: v.otherScores },
    },
    teams: teams.map((t) => {
      const s: any = subs.get(Number(t.id))
      const me = myScores.get(Number(t.id))
      return {
        id: Number(t.id),
        code: t.registrationCode,
        team: v.teamName ? t.teamName : null,
        college: v.college ? t.college || null : null,
        members: v.members ? (t.members || []).map((m: any) => m?.name).filter(Boolean) : null,
        project: v.project && s ? { title: s.projectTitle || null, track: s.track || null, repo: s.repositoryUrl || null, demo: s.demoUrl || null } : null,
        // The file opens through /api/admin/submissions/<id>/file, which checks this round's "Download the submitted file"
        file: v.file && s?.file?.key ? { id: s.id, name: s.file.filename || null } : null,
        mine: me ? { marks: me.marks, remarks: me.remarks, total: roundTo(me.total, round.decimals), savedAt: me.updatedAt || me.submittedAt } : null,
        others: v.otherScores
          ? scores.filter((x) => x.registration === Number(t.id) && x.judge !== Number(user.id)).map((x) => ({ n: otherJudges.indexOf(x.judge) + 1, total: roundTo(x.total, round.decimals) }))
          : null,
      }
    }),
  })
}

const Body = z.object({
  round: z.number().int().positive(),
  registration: z.number().int().positive(),
  marks: z.record(z.string().max(40), z.union([z.number(), z.string().max(20), z.null()])).refine((m) => Object.keys(m).length <= 40),
  remarks: z.string().max(2000).optional().default(''),
})

export async function POST(req: Request) {
  const T = (await getJudgingTexts()).api
  if (!isSameOrigin(req)) return json({ error: T.badOrigin }, 403)
  const { payload, user } = await judge()
  if (!user) return json({ error: T.notAllowed }, 403)
  if (!rateLimitUser(user.id, 'judge-post', 60, 60_000)) return json({ error: T.slowDown }, 429)
  if (Number(req.headers.get('content-length') || 0) > 32_000) return json({ error: T.badRequest }, 413)
  const parsed = Body.safeParse(await req.json().catch(() => null))
  if (!parsed.success) return json({ error: T.badRequest }, 400)
  const body = parsed.data

  const round = await loadRound(payload, body.round)
  if (!round || !mine(round, user.id)) return json({ error: T.notAllowed }, 404)
  if (round.status !== 'OPEN') return json({ error: T.notOpen }, 409)
  const teams = await roundTeams(payload, round)
  if (!teams.some((t) => Number(t.id) === body.registration)) return json({ error: T.notInRound }, 404)

  const checked = checkMarks(round.criteria, body.marks)
  if (!checked.ok) {
    const c = round.criteria.find((x) => x.key === checked.key)!
    const msg = checked.reason === 'missing' ? T.markMissing : checked.reason === 'range' ? T.markRange : T.markStep
    return json({ error: fill(msg, { criterion: c.label, min: String(c.min), max: String(c.max), step: String(c.step) }), key: c.key }, 400)
  }
  const remarks = body.remarks.trim()
  if (round.view.remarksRequired && !remarks) return json({ error: T.remarksNeeded }, 400)

  const total = judgeTotal(round, checked.marks)
  const now = new Date().toISOString()
  const where: Where = { and: [{ round: { equals: round.id } }, { registration: { equals: body.registration } }, { judge: { equals: user.id } }] }
  const find = async () => (await payload.find({ collection: 'judge-scores' as any, overrideAccess: true, depth: 0, limit: 1, where })).docs[0] as any
  let existing = await find()
  if (existing && !round.view.editAfterSubmit) return json({ error: T.final }, 409)
  const data = { marks: checked.marks, total, remarks, submittedAt: existing?.submittedAt || now }
  let saved: any
  try {
    saved = existing
      ? await payload.update({ collection: 'judge-scores' as any, id: existing.id, overrideAccess: true, depth: 0, data })
      : await payload.create({ collection: 'judge-scores' as any, overrideAccess: true, depth: 0, data: { ...data, round: round.id, registration: body.registration, judge: user.id, event: round.event } })
  } catch (err: any) {
    // Two saves at once (double click, two tabs): the unique index lets one create win; the other becomes an update
    existing = await find()
    if (!existing) throw err
    if (!round.view.editAfterSubmit) return json({ error: T.final }, 409)
    saved = await payload.update({ collection: 'judge-scores' as any, id: existing.id, overrideAccess: true, depth: 0, data })
  }
  logger.audit(String(user.email), existing ? 'JUDGE_SCORE_UPDATED' : 'JUDGE_SCORE_SAVED', 'JudgeScore', String(saved.id), {
    round: round.id,
    registration: body.registration,
    total,
  })
  return json({ ok: true, mine: { marks: checked.marks, remarks, total: roundTo(total, round.decimals), savedAt: saved.updatedAt || now } })
}
