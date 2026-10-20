import { headers } from 'next/headers'
import { getPayload } from 'payload'
import config from '@payload-config'
import { z } from 'zod'
import { canFor, eventScope } from '@/payload/access/permissions'
import { isSameOrigin } from '@/lib/auth/same-origin'
import { rateLimitUser } from '@/lib/rateLimit'
import { logger } from '@/lib/logger'
import { csvBody } from '@/lib/csv'
import { getJudgingTexts } from '@/lib/judging-texts'
import { aggregate, ranks, roundOf, roundTo, type Round } from '@/lib/judging'
import { formulaRange, roundFormula } from '@/lib/formula'
import { judgeNames, loadRound, roundDecisions, roundScores, roundSubmissions, roundTeams } from '@/lib/judging-server'

export const dynamic = 'force-dynamic'

/**
 * Judging results desk (/judging; owner, 20 Oct 2026). "See scores & decide" (judging.results), per competition.
 *   GET                       -> rounds I may see
 *   GET ?round=<id>           -> teams, every judge's marks/score/remarks, averages, ranks, decisions
 *   GET ?round=<id>&csv=1     -> the same as a CSV file
 *   POST { round, registrations, decision } -> Qualified / Not qualified / cleared (null) for up to 500 teams of the
 *                                round; a team's submission for that round gets the same review status
 */
const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' } })

async function staff() {
  const payload = await getPayload({ config })
  const { user } = await payload.auth({ headers: await headers() })
  const scope = user ? eventScope(user as any, 'judging.results') : []
  return { payload, user: user as any, scope }
}

async function detail(payload: any, round: Round) {
  const [teams, scores, decisions, subs] = await Promise.all([roundTeams(payload, round), roundScores(payload, round.id), roundDecisions(payload, round.id), roundSubmissions(payload, round)])
  const inRound = new Set(teams.map((t) => Number(t.id)))
  const counted = scores.filter((s) => inRound.has(s.registration))
  const results = aggregate(round, counted)
  const byTeam = new Map(results.map((r) => [r.registration, r]))
  const place = ranks(results, round.decimals)
  const judgeIds = [...new Set([...round.judges, ...counted.map((s) => s.judge)])]
  const names = await judgeNames(payload, judgeIds)
  const range = formulaRange(roundFormula(round.criteria, round.formula), round.criteria)
  const rows = teams.map((t) => {
    const id = Number(t.id)
    const r = byTeam.get(id)
    const sub: any = subs.get(id)
    const d = decisions.get(id)
    const decision = d?.decision || (sub && ['QUALIFIED', 'NOT_QUALIFIED'].includes(sub.status) ? sub.status : null)
    const mine = counted.filter((s) => s.registration === id)
    return {
      id,
      code: t.registrationCode,
      team: t.teamName,
      college: t.college || '',
      project: sub?.projectTitle || '',
      rank: place.get(id) ?? null,
      average: r ? roundTo(r.average, round.decimals) : null,
      judges: r?.judges ?? 0,
      spread: r ? roundTo(r.spread, round.decimals) : null,
      criteria: r ? Object.fromEntries(Object.entries(r.criteria).map(([k, v]) => [k, roundTo(v, round.decimals)])) : {},
      decision,
      missing: round.judges.filter((j) => !mine.some((s) => s.judge === j)).map((j) => names.get(j) || String(j)),
      scores: mine.map((s) => ({ judge: s.judge, name: names.get(s.judge) || String(s.judge), marks: s.marks, total: roundTo(r?.totals.find((x) => x.judge === s.judge)?.total ?? s.total, round.decimals), remarks: s.remarks, savedAt: s.updatedAt })),
    }
  })
  rows.sort((a, b) => (a.rank ?? 1e9) - (b.rank ?? 1e9) || String(a.code).localeCompare(String(b.code)))
  return {
    round: {
      id: round.id,
      title: round.title,
      status: round.status,
      roundNumber: round.roundNumber,
      criteria: round.criteria.map((c) => ({ key: c.key, label: c.label, min: c.min, max: c.max })),
      formula: round.formula,
      decimals: round.decimals,
      range: { low: roundTo(range.low, round.decimals), high: roundTo(range.high, round.decimals) },
      judges: round.judges.map((j) => ({ id: j, name: names.get(j) || String(j) })),
    },
    teams: rows,
  }
}

export async function GET(req: Request) {
  const T = await getJudgingTexts()
  const { payload, user, scope } = await staff()
  if (!user || (Array.isArray(scope) && !scope.length)) return json({ error: T.api.notAllowed }, 403)
  if (!rateLimitUser(user.id, 'judging-get', 120, 60_000)) return json({ error: T.api.slowDown }, 429)
  const url = new URL(req.url)
  const roundParam = url.searchParams.get('round')

  if (!roundParam) {
    const { docs } = await payload.find({
      collection: 'judging-rounds' as any,
      overrideAccess: true,
      depth: 1,
      pagination: false,
      sort: 'title',
      where: scope === 'all' ? undefined : { event: { in: scope } },
    })
    return json({ rounds: (docs as any[]).map((d) => ({ id: d.id, title: d.title, event: d.event?.title || '', status: roundOf(d).status })) })
  }

  const round = await loadRound(payload, roundParam)
  if (!round || !canFor(user, 'judging.results', round.event)) return json({ error: T.api.notAllowed }, 404)
  const data = await detail(payload, round)

  if (!url.searchParams.get('csv')) return json(data)
  const D = T.desk
  const label = (x: string | null) => (x === 'QUALIFIED' ? D.decisionQ : x === 'NOT_QUALIFIED' ? D.decisionNQ : '')
  const judges = data.round.judges
  const head = [D.colRank, D.colTeam, D.colCode, D.colAvg, D.colJudges, D.colSpread, ...data.round.criteria.map((c) => c.label), ...judges.map((j) => j.name), D.colDecision, D.colRemarks]
  const body = data.teams.map((t) => [
    t.rank ?? '',
    t.team,
    t.code,
    t.average ?? '',
    t.judges,
    t.spread ?? '',
    ...data.round.criteria.map((c) => t.criteria[c.key] ?? ''),
    ...judges.map((j) => t.scores.find((s) => s.judge === j.id)?.total ?? ''),
    label(t.decision),
    t.scores.filter((s) => s.remarks).map((s) => `${s.name}: ${s.remarks}`).join(' | '),
  ])
  logger.audit(String(user.email), 'JUDGING_CSV_EXPORTED', 'JudgingRound', String(round.id), { teams: body.length })
  const name = `judging-${round.id}-${new Date().toISOString().slice(0, 10)}.csv`
  return new Response(csvBody([head, ...body]), {
    headers: { 'Content-Type': 'text/csv; charset=utf-8', 'Content-Disposition': `attachment; filename="${name}"`, 'Cache-Control': 'no-store' },
  })
}

const Body = z.object({
  round: z.number().int().positive(),
  registrations: z.array(z.number().int().positive()).min(1).max(500),
  decision: z.enum(['QUALIFIED', 'NOT_QUALIFIED']).nullable(),
})

export async function POST(req: Request) {
  const T = (await getJudgingTexts()).api
  if (!isSameOrigin(req)) return json({ error: T.badOrigin }, 403)
  const { payload, user, scope } = await staff()
  if (!user || (Array.isArray(scope) && !scope.length)) return json({ error: T.notAllowed }, 403)
  if (!rateLimitUser(user.id, 'judging-post', 30, 60_000)) return json({ error: T.slowDown }, 429)
  const parsed = Body.safeParse(await req.json().catch(() => null))
  if (!parsed.success) return json({ error: T.badRequest }, 400)
  const { decision } = parsed.data
  const round = await loadRound(payload, parsed.data.round)
  if (!round || !canFor(user, 'judging.results', round.event)) return json({ error: T.notAllowed }, 404)

  // Every team must be in this round (the whole batch is refused otherwise)
  const ids = [...new Set(parsed.data.registrations)]
  const inRound = new Set((await roundTeams(payload, round)).map((t) => Number(t.id)))
  if (ids.some((id) => !inRound.has(id))) return json({ error: T.notInRound }, 400)

  const [decisions, subs] = await Promise.all([roundDecisions(payload, round.id), roundSubmissions(payload, round)])
  const who = String(user.name || user.email)
  const now = new Date().toISOString()
  for (const id of ids) {
    const d = decisions.get(id)
    if (decision === null) {
      if (d) await payload.delete({ collection: 'judging-decisions' as any, id: d.id, overrideAccess: true })
    } else if (d) {
      if (d.decision !== decision) await payload.update({ collection: 'judging-decisions' as any, id: d.id, overrideAccess: true, data: { decision, decidedBy: who, decidedAt: now } })
    } else {
      await payload.create({ collection: 'judging-decisions' as any, overrideAccess: true, data: { round: round.id, registration: id, event: round.event, decision, decidedBy: who, decidedAt: now } })
    }
    // The submission's review status is what opens the next round in the portal
    const sub: any = subs.get(id)
    const status = decision || 'UNDER_REVIEW'
    if (sub && sub.status !== status) await payload.update({ collection: 'round-submissions', id: sub.id, overrideAccess: true, data: { status } })
  }
  logger.audit(String(user.email), 'JUDGING_DECISIONS_SET', 'JudgingRound', String(round.id), { decision: decision || 'CLEARED', teams: ids.length, ids })
  return json({ ok: true, count: ids.length })
}
