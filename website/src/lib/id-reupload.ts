import type { Payload, Where } from 'payload'
import { logger } from './logger'
import { queueEmail } from './email/outbox'
import { idReuploadRequest, registrationCancelledNoId } from './email/templates'

/**
 * Student ID re-upload (owner, 8 Oct 2026). Staff mark a team's ID check "Rejected" (+ a reason) and send the request
 * from the CMS (Registrations → ID re-upload). The team leader uploads new cards at /aurix/update-id before the
 * deadline; registrations still rejected after it are cancelled automatically and told by email.
 */

import { ACTIVE, canReupload, formatDeadline } from './id-reupload-rules'
import { emailTexts } from './email/texts'
export { canReupload, deadlineEndIST, formatDeadline, parseDeadline } from './id-reupload-rules'

const REJECTED_ACTIVE: Where = { and: [{ idVerification: { equals: 'REJECTED' } }, { status: { in: ACTIVE } }] }

/** Teams with a rejected ID that are still active (CMS screen). */
/** Rejected, still-active registrations; `events` = only these events (access roles limited to chosen events). */
export async function listRejected(payload: Payload, events: 'all' | (number | string)[] = 'all') {
  const where: Where = events === 'all' ? REJECTED_ACTIVE : { and: [REJECTED_ACTIVE, { event: { in: events.length ? events : [-1] } }] }
  const { docs } = await payload.find({ collection: 'event-registrations', where, depth: 1, limit: 500, sort: 'createdAt', overrideAccess: true })
  return docs as any[]
}

const eventTitle = (reg: any) => (reg.event && typeof reg.event === 'object' ? reg.event.title : '') || 'AURIX 2026'

/** Email every rejected team not emailed yet for this rejection. Returns how many were queued. */
export async function requestReuploads(payload: Payload, deadline: Date, actor: string, events: 'all' | (number | string)[] = 'all'): Promise<number> {
  const texts = await emailTexts()
  const due = (await listRejected(payload, events)).filter((r) => !r.idReuploadRequestedAt)
  const now = new Date()
  let queued = 0
  for (const reg of due) {
    const email = idReuploadRequest(
      { name: reg.leaderName, team: reg.teamName, code: reg.registrationCode, event: eventTitle(reg), reason: reg.idRejectReason, deadline: formatDeadline(deadline) },
      texts,
    )
    const ok = await queueEmail(payload, {
      kind: 'ID_REUPLOAD_REQUEST',
      registration: reg.id,
      reference: reg.registrationCode,
      to: reg.leaderEmail,
      dedupeKey: `ID_REUPLOAD_REQUEST:${reg.id}:${now.getTime()}`,
      ...email,
    })
    if (!ok) continue
    await payload.update({
      collection: 'event-registrations',
      id: reg.id,
      overrideAccess: true,
      data: { idReuploadRequestedAt: now.toISOString(), idReuploadDeadline: deadline.toISOString() } as any,
    })
    logger.audit(actor, 'ID_REUPLOAD_REQUESTED', 'EventRegistration', reg.registrationCode, { deadline: deadline.toISOString() })
    queued++
  }
  return queued
}

/** Cancel registrations still rejected after their deadline, and tell the team. Returns how many. */
export async function cancelOverdue(payload: Payload, now = new Date()): Promise<number> {
  const { docs } = await payload.find({
    collection: 'event-registrations',
    where: { and: [...(REJECTED_ACTIVE.and as Where[]), { idReuploadDeadline: { less_than: now.toISOString() } }] },
    depth: 1,
    limit: 200,
    overrideAccess: true,
  })
  if (!docs.length) return 0
  const texts = await emailTexts()
  for (const reg of docs as any[]) {
    await payload.update({ collection: 'event-registrations', id: reg.id, overrideAccess: true, data: { status: 'CANCELLED' } as any })
    logger.audit('system', 'REGISTRATION_CANCELLED_NO_ID', 'EventRegistration', reg.registrationCode, { deadline: reg.idReuploadDeadline })
    const email = registrationCancelledNoId(
      { name: reg.leaderName, team: reg.teamName, code: reg.registrationCode, event: eventTitle(reg), deadline: formatDeadline(reg.idReuploadDeadline) },
      texts,
    )
    await queueEmail(payload, { kind: 'REGISTRATION_CANCELLED', registration: reg.id, reference: reg.registrationCode, to: reg.leaderEmail, ...email })
  }
  return docs.length
}

/** The logged-in leader's registrations that may upload new cards now. */
export async function reuploadableFor(payload: Payload, user: { id: number | string; email?: string }) {
  const { docs } = await payload.find({
    collection: 'event-registrations',
    where: {
      and: [
        ...(REJECTED_ACTIVE.and as Where[]),
        { or: [{ participants: { contains: user.id } }, { leaderEmail: { equals: String(user.email || '').toLowerCase() } }] },
      ],
    },
    depth: 1,
    limit: 20,
    overrideAccess: true,
  })
  return (docs as any[]).filter((r) => canReupload(r))
}

type IdFile = { data: Buffer; mimetype: string; size: number; ext: string }

/**
 * Replace the chosen members' ID cards (index → file). The rejected files are deleted, the ID check goes back to
 * "Pending" and the deadline is cleared. Throws 'closed' if the registration may not be changed.
 */
export async function replaceIds(payload: Payload, reg: any, files: Map<number, IdFile>, actor: string) {
  if (!canReupload(reg)) throw new Error('closed')
  const members = (reg.members || []) as any[]
  const created: (number | string)[] = []
  const replaced: (number | string)[] = []
  try {
    const next = []
    for (let i = 0; i < members.length; i++) {
      const m = members[i]
      const old = m.idDocument && typeof m.idDocument === 'object' ? m.idDocument.id : m.idDocument
      const f = files.get(i)
      if (!f) {
        next.push({ ...m, idDocument: old ?? undefined })
        continue
      }
      const doc = await payload.create({
        collection: 'id-documents',
        overrideAccess: true,
        data: { memberName: m.name, registrationCode: reg.registrationCode },
        file: { data: f.data, mimetype: f.mimetype, name: `${reg.registrationCode}-${i + 1}-new-${Date.now()}.${f.ext}`, size: f.size },
      })
      created.push(doc.id)
      if (old) replaced.push(old)
      next.push({ ...m, idDocument: doc.id })
    }
    await payload.update({
      collection: 'event-registrations',
      id: reg.id,
      overrideAccess: true,
      data: { members: next, idVerification: 'PENDING', idReuploadedAt: new Date().toISOString(), idReuploadDeadline: null } as any,
    })
  } catch (err) {
    for (const id of created) await payload.delete({ collection: 'id-documents', id, overrideAccess: true }).catch(() => undefined)
    throw err
  }
  for (const id of replaced) await payload.delete({ collection: 'id-documents', id, overrideAccess: true }).catch(() => undefined)
  logger.audit(actor, 'ID_REUPLOADED', 'EventRegistration', reg.registrationCode, { files: files.size })
}
