import crypto from 'node:crypto'
import type { Payload, Where } from 'payload'
import { logger } from './logger'
import { deleteObject, headObject, isR2Configured, readRange, signedPutUrl } from './r2'
import {
  FINISH_GRACE_MS,
  SUBMITTABLE,
  checkUpload,
  cleanFilename,
  eligible,
  isHttpsUrl,
  realSubmissionType,
  roundOpen,
  signUploadToken,
  verifyUploadToken,
  type Round,
} from './submission-rules'

/**
 * Round submissions for the logged-in team leader (participant portal). Error results are keys of the portal texts
 * (CMS → Participant portal → Submissions), so every message stays editable.
 */
export type SubmissionError =
  | 'errNotConfigured'
  | 'errNoTeam'
  | 'errClosed'
  | 'errNotQualified'
  | 'errType'
  | 'errSize'
  | 'errTitle'
  | 'errTrack'
  | 'errRepo'
  | 'errDemo'
  | 'errFileMissing'
  | 'errUploadMissing'
  | 'errFileContent'
  | 'errFailed'

type User = { id: number | string; email?: string }
const secret = () => process.env.PAYLOAD_SECRET || ''

/** The user's registrations they lead (linked account or leader email), with their event. */
export async function leaderRegistrations(payload: Payload, user: User) {
  const { docs } = await payload.find({
    collection: 'event-registrations',
    where: { or: [{ participants: { contains: user.id } }, { leaderEmail: { equals: String(user.email || '').toLowerCase() } }] } as Where,
    depth: 1,
    limit: 50,
    overrideAccess: true,
  })
  return docs as any[]
}

export const submittableRounds = (event: any): Round[] =>
  ((event?.rounds || []) as any[])
    .filter((r) => SUBMITTABLE.includes(String(r.submissionType)))
    .map((r) => ({ number: Number(r.number), name: r.name, startDate: r.startDate, endDate: r.endDate, submissionType: r.submissionType }))

export async function submissionsOf(payload: Payload, regIds: (number | string)[]) {
  if (!regIds.length) return [] as any[]
  const { docs } = await payload.find({ collection: 'round-submissions', where: { registration: { in: regIds } }, depth: 0, limit: 200, overrideAccess: true })
  return docs as any[]
}

async function context(payload: Payload, user: User, code: unknown, roundNumber: unknown) {
  const reg = (await leaderRegistrations(payload, user)).find((r) => r.registrationCode === String(code || '').toUpperCase())
  const event = reg?.event && typeof reg.event === 'object' ? reg.event : null
  const round = event ? submittableRounds(event).find((r) => r.number === Number(roundNumber)) : undefined
  if (!reg || !event || !round) return { error: 'errNoTeam' as const }
  const subs = await submissionsOf(payload, [reg.id])
  const existing = subs.find((s) => s.roundNumber === round.number) || null
  const previous = subs.find((s) => s.roundNumber === round.number - 1) || null
  const ok = eligible(reg, round.number, previous)
  if (!ok.ok) return { error: (ok.reason === 'notQualified' ? 'errNotQualified' : 'errNoTeam') as SubmissionError }
  return { reg, event, round, existing }
}

/** Step 1: a signed link to upload the file straight to R2 (exact size and type), plus the token for step 2. */
export async function startUpload(payload: Payload, user: User, body: any, now = new Date()) {
  if (!isR2Configured()) return { error: 'errNotConfigured' as const }
  const c = await context(payload, user, body?.code, body?.round)
  if ('error' in c) return c
  if (!roundOpen(c.round, now)) return { error: 'errClosed' as const }
  const check = checkUpload(String(body?.filename || ''), body?.size)
  // An empty file is "not a real PPT/PPTX/PDF" (no separate CMS text needed)
  if (!check.ok) return { error: ({ type: 'errType', size: 'errSize', empty: 'errFileContent' } as const)[check.reason] }
  const key = `submissions/${c.event.slug}/round-${c.round.number}/${c.reg.registrationCode}/${crypto.randomUUID()}.${check.ext}`
  const url = await signedPutUrl(key, check.contentType, body.size)
  const token = signUploadToken(
    { r: Number(c.reg.id), n: c.round.number, k: key, s: body.size, e: check.ext, f: cleanFilename(String(body.filename)), iat: now.getTime(), exp: now.getTime() + 30 * 60_000 },
    secret(),
  )
  return { url, token, contentType: check.contentType }
}

/** Step 2: save title/track/links and (if a file was uploaded) check the stored file's real type. */
export async function saveSubmission(payload: Payload, user: User, body: any, now = new Date()) {
  const c = await context(payload, user, body?.code, body?.round)
  if ('error' in c) return c
  const { reg, event, round, existing } = c
  const token = body?.token ? verifyUploadToken(body.token, secret(), now.getTime()) : null
  if (body?.token && (!token || token.r !== Number(reg.id) || token.n !== round.number)) return { error: 'errUploadMissing' as const }
  // Deadline (server time). A file whose upload started before the end may finish within the grace period.
  const end = new Date(round.endDate!).getTime()
  const inTime = token ? token.iat <= end && now.getTime() <= end + FINISH_GRACE_MS && (!round.startDate || new Date(round.startDate).getTime() <= token.iat) : roundOpen(round, now)
  if (!inTime) return { error: 'errClosed' as const }

  const title = String(body?.title || '').trim()
  if (title.length < 2 || title.length > 150) return { error: 'errTitle' as const }
  const tracks = ((event.tracks || []) as any[]).map((t) => String(t.name))
  const track = String(body?.track || '').trim()
  if (tracks.length ? !tracks.includes(track) : track.length > 100) return { error: 'errTrack' as const }
  const code = round.submissionType === 'CODE_AND_DEMO'
  const repositoryUrl = String(body?.repositoryUrl || '').trim()
  const demoUrl = String(body?.demoUrl || '').trim()
  if (code && !isHttpsUrl(repositoryUrl)) return { error: 'errRepo' as const }
  if (demoUrl && !isHttpsUrl(demoUrl)) return { error: 'errDemo' as const }
  if (round.submissionType === 'PROPOSAL' && !token && !existing?.file?.key) return { error: 'errFileMissing' as const }

  let file = existing?.file?.key ? existing.file : null
  if (token) {
    if (!isR2Configured()) return { error: 'errNotConfigured' as const }
    const head = await headObject(token.k)
    if (!head || head.size !== token.s) {
      if (head) await deleteObject(token.k).catch(() => undefined)
      return { error: 'errUploadMissing' as const }
    }
    const first = await readRange(token.k, 'bytes=0-15')
    const tail = token.e === 'pptx' ? await readRange(token.k, `bytes=-${Math.min(65536, token.s)}`) : Buffer.alloc(0)
    if (!realSubmissionType(token.e, first, tail)) {
      await deleteObject(token.k).catch(() => undefined)
      logger.warn(`Submission refused (content does not match .${token.e}): ${reg.registrationCode} round ${round.number}`)
      return { error: 'errFileContent' as const }
    }
    file = { key: token.k, filename: token.f, size: token.s, contentType: head.contentType || '' }
  }

  const data = {
    registration: reg.id,
    event: event.id,
    roundNumber: round.number,
    registrationCode: reg.registrationCode,
    teamName: reg.teamName,
    projectTitle: title,
    track,
    repositoryUrl: code ? repositoryUrl : undefined,
    demoUrl: demoUrl || undefined,
    ...(file ? { file } : {}),
    submittedAt: now.toISOString(),
    submittedBy: user.id,
  }
  const oldKey = existing?.file?.key
  const saved = existing
    ? await payload.update({ collection: 'round-submissions', id: existing.id, data: data as any, overrideAccess: true })
    : await payload.create({ collection: 'round-submissions', data: { ...data, status: 'SUBMITTED' } as any, overrideAccess: true })
  if (token && oldKey && oldKey !== token.k) await deleteObject(oldKey).catch((err) => logger.error(`Old submission file not deleted (${oldKey}): ${err?.message || err}`))
  logger.audit(String(user.email || user.id), existing ? 'SUBMISSION_UPDATED' : 'SUBMISSION_CREATED', 'RoundSubmission', `${reg.registrationCode}#${round.number}`, {
    file: Boolean(token),
    size: token?.s,
  })
  return { ok: true as const, id: saved.id }
}
