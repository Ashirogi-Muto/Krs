import type { Payload } from 'payload'
import { logger } from '@/lib/logger'
import { isMailConfigured, sendEmail, type EmailPayload } from './index'

/**
 * Email outbox: request handlers only queue (queueEmail); a background worker inside the app sends.
 *   PENDING --worker--> SENDING --ok--> SENT
 *                               --temporary error--> PENDING (retry after 1, 5, 15, 60 min) ... FAILED after 5 attempts
 *                               --permanent error (bad address, 5xx rejection)--> FAILED at once
 * A queueing error is logged and never fails the caller (a registration must not fail because of email).
 * While MAIL_* is not configured, emails stay PENDING and go out once it is.
 *
 * Duplicates: one row per purpose + registration (unique dedupeKey), rows are claimed before sending, and every email
 * has a fixed Message-ID. A crash between "SMTP accepted" and "marked SENT" re-sends once after restart (at-least-once);
 * Gmail and most mailboxes drop the second copy because the Message-ID is the same.
 *
 * Pacing (adjustable in the environment):
 *   - one email per MAIL_INTERVAL_SECONDS (default 60) — no bursts
 *   - MAIL_SEND_WINDOW (IST "HH:MM-HH:MM", default "always" = any time of day)
 *   - outside a window only while MAIL_BACKLOG_OVERRIDE emails are due (default 150)
 *   - never more than MAIL_DAILY_LIMIT in any 24 hours (default 450; Gmail caps an account's daily sending)
 */
export const MAX_ATTEMPTS = 5
export const RETRY_MINUTES = [1, 5, 15, 60]
const BATCH = 1

const num = (k: string, d: number) => {
  const n = Number(process.env[k])
  return Number.isFinite(n) && n > 0 ? n : d
}
export const pacing = () => ({
  intervalMs: num('MAIL_INTERVAL_SECONDS', 60) * 1000,
  window: (process.env.MAIL_SEND_WINDOW || 'always').trim(),
  backlogOverride: num('MAIL_BACKLOG_OVERRIDE', 150),
  dailyLimit: num('MAIL_DAILY_LIMIT', 450),
})

/** Minutes since midnight in India time. */
const istMinutes = (d: Date) => (d.getUTCHours() * 60 + d.getUTCMinutes() + 330) % 1440

/** True when `now` falls in the window "HH:MM-HH:MM" (IST; may wrap past midnight). "always" = no window. */
export function inSendWindow(now: Date, window: string): boolean {
  if (window.toLowerCase() === 'always') return true
  const m = window.match(/^(\d{1,2}):(\d{2})\s*-\s*(\d{1,2}):(\d{2})$/)
  if (!m) return true // unreadable setting: do not silently stop all email
  const start = Number(m[1]) * 60 + Number(m[2])
  const end = Number(m[3]) * 60 + Number(m[4])
  const t = istMinutes(now)
  return start <= end ? t >= start && t < end : t >= start || t < end
}

/** Whether the worker may send now (pure; exported for tests). */
export function maySend(o: { now: Date; window: string; due: number; backlogOverride: number; sentLast24h: number; dailyLimit: number }) {
  if (o.due === 0) return { ok: false, reason: 'nothing due' }
  if (o.sentLast24h >= o.dailyLimit) return { ok: false, reason: `daily limit reached (${o.dailyLimit} in 24 h)` }
  if (inSendWindow(o.now, o.window)) return { ok: true, reason: 'inside sending window' }
  if (o.due >= o.backlogOverride) return { ok: true, reason: `backlog of ${o.due} (≥ ${o.backlogOverride}) outside the window` }
  return { ok: false, reason: 'outside sending window' }
}

type QueueInput = EmailPayload & { kind: 'REGISTRATION_CONFIRMATION'; registration?: number | string; reference?: string }

/** Queue one email (idempotent per kind + registration). Never throws. */
export async function queueEmail(payload: Payload, email: QueueInput): Promise<boolean> {
  const ref = email.reference || email.kind
  const dedupeKey = email.registration ? `${email.kind}:${email.registration}` : undefined
  try {
    if (dedupeKey) {
      const existing = await payload.count({ collection: 'email-outbox', overrideAccess: true, where: { dedupeKey: { equals: dedupeKey } } })
      if (existing.totalDocs > 0) {
        logger.info(`Email already queued for ${ref} (${email.kind}); not queued again`)
        return true
      }
    }
    await payload.create({
      collection: 'email-outbox',
      overrideAccess: true,
      data: {
        to: email.to,
        subject: email.subject,
        html: email.html,
        text: email.text,
        kind: email.kind,
        registration: email.registration as number | undefined,
        reference: email.reference,
        dedupeKey,
        status: 'PENDING',
        attempts: 0,
      },
    })
    await syncRegistration(payload, email.kind, email.registration, 'PENDING')
    logger.info(`Email queued for ${ref} (${email.kind})`)
    return true
  } catch (err: any) {
    logger.error(`Could not queue email for ${ref} (${email.kind}): ${err?.message || err}`)
    return false
  }
}

/** Keep the registration's "Confirmation email" status in step with the outbox (best effort). */
async function syncRegistration(payload: Payload, kind: string, registration: unknown, status: 'PENDING' | 'RETRYING' | 'SENT' | 'FAILED') {
  if (kind !== 'REGISTRATION_CONFIRMATION' || !registration) return
  const id = typeof registration === 'object' ? (registration as any).id : registration
  await payload
    .update({ collection: 'event-registrations', id, overrideAccess: true, data: { confirmationEmail: status } })
    .catch(() => undefined)
}

/**
 * Permanent failures are not retried: the address or message itself is rejected (5xx, invalid recipient).
 * Authentication/configuration errors (530/534/535) and anything temporary (4xx, timeouts, network) are retried.
 */
export function isPermanentFailure(err: any): boolean {
  const code = Number(err?.responseCode)
  if (err?.code === 'EENVELOPE') return true // no valid recipient
  if (Number.isFinite(code) && code >= 500) return ![530, 534, 535, 554].includes(code)
  return false
}

/** Retry delay after the n-th failed attempt (1-based). */
export const retryDelayMinutes = (attempt: number) => RETRY_MINUTES[Math.min(attempt, RETRY_MINUTES.length) - 1]

/** One pass over due PENDING emails. Exported for tests and manual runs. */
export async function processOutbox(payload: Payload, now = new Date()): Promise<{ sent: number; failed: number; retried: number }> {
  const stats = { sent: 0, failed: 0, retried: 0 }
  if (!isMailConfigured()) return stats
  const dueWhere = {
    and: [
      { status: { equals: 'PENDING' } },
      { or: [{ nextAttemptAt: { exists: false } }, { nextAttemptAt: { less_than_equal: now.toISOString() } }] },
    ],
  }
  const p = pacing()
  const [due, sent24] = await Promise.all([
    payload.count({ collection: 'email-outbox', overrideAccess: true, where: dueWhere as any }),
    payload.count({
      collection: 'email-outbox',
      overrideAccess: true,
      where: { and: [{ status: { equals: 'SENT' } }, { sentAt: { greater_than: new Date(now.getTime() - 86_400_000).toISOString() } }] },
    }),
  ])
  const gate = maySend({ now, window: p.window, due: due.totalDocs, backlogOverride: p.backlogOverride, sentLast24h: sent24.totalDocs, dailyLimit: p.dailyLimit })
  if (!gate.ok) return stats
  const { docs } = await payload.find({
    collection: 'email-outbox',
    overrideAccess: true,
    depth: 0,
    limit: BATCH,
    sort: 'createdAt',
    where: dueWhere as any,
  })
  for (const doc of docs as any[]) {
    // Claim the row so a second worker (or a manual run) never sends it twice
    const claimed = await payload.update({
      collection: 'email-outbox',
      overrideAccess: true,
      where: { and: [{ id: { equals: doc.id } }, { status: { equals: 'PENDING' } }] },
      data: { status: 'SENDING', lastAttemptAt: new Date().toISOString() },
    })
    if (!claimed.docs.length) continue
    const attempts = (doc.attempts || 0) + 1
    const ref = doc.reference || `email ${doc.id}`
    try {
      logger.info(`Sending ${doc.kind} for ${ref} (attempt ${attempts})`)
      const { messageId } = await sendEmail({
        to: doc.to,
        subject: doc.subject,
        html: doc.html,
        text: doc.text || undefined,
        messageId: stableMessageId(doc),
      })
      await payload.update({
        collection: 'email-outbox',
        id: doc.id,
        overrideAccess: true,
        data: { status: 'SENT', attempts, sentAt: new Date().toISOString(), messageId, lastError: null, nextAttemptAt: null },
      })
      await syncRegistration(payload, doc.kind, doc.registration, 'SENT')
      logger.info(`${doc.kind} sent for ${ref}`)
      stats.sent += 1
    } catch (err: any) {
      const error = String(err?.message || err).slice(0, 500)
      const final = attempts >= MAX_ATTEMPTS || isPermanentFailure(err)
      await syncRegistration(payload, doc.kind, doc.registration, final ? 'FAILED' : 'RETRYING')
      await payload.update({
        collection: 'email-outbox',
        id: doc.id,
        overrideAccess: true,
        data: {
          status: final ? 'FAILED' : 'PENDING',
          attempts,
          lastError: error,
          nextAttemptAt: final ? null : new Date(Date.now() + retryDelayMinutes(attempts) * 60_000).toISOString(),
        },
      })
      logger.warn(`${doc.kind} for ${ref} failed (attempt ${attempts}/${MAX_ATTEMPTS}${final ? ', not retrying' : ', will retry'}): ${error}`)
      if (final) stats.failed += 1
      else stats.retried += 1
    }
  }
  return stats
}

/** Same Message-ID for every attempt of one outbox row. */
function stableMessageId(doc: any): string {
  const from = (process.env.MAIL_FROM || process.env.MAIL_USERNAME || '').split('@')[1] || 'kalamroboticssociety.com'
  return `<outbox-${doc.id}-${new Date(doc.createdAt).getTime()}@${from.trim()}>`
}

const state = globalThis as unknown as { __krsEmailWorker?: boolean }

/** Starts the background sender once per server process (called from Payload onInit). */
export function startEmailWorker(payload: Payload) {
  if (state.__krsEmailWorker || process.env.EMAIL_WORKER === '0' || process.env.NEXT_PHASE === 'phase-production-build') return
  state.__krsEmailWorker = true
  let running = false
  let warned = false
  const tick = async () => {
    if (running) return
    running = true
    try {
      if (!isMailConfigured()) {
        if (!warned) logger.warn('Email is not configured (MAIL_USERNAME / MAIL_PASSWORD); queued emails will wait.')
        warned = true
        return
      }
      await processOutbox(payload)
    } catch (err: any) {
      logger.error(`Email worker error: ${err?.message || err}`)
    } finally {
      running = false
    }
  }
  // Emails left "Sending" by a crash or restart go back to the queue
  payload
    .update({ collection: 'email-outbox', overrideAccess: true, where: { status: { equals: 'SENDING' } }, data: { status: 'PENDING' } })
    .catch(() => undefined)
  const p = pacing()
  setTimeout(tick, 5_000).unref?.()
  setInterval(tick, p.intervalMs).unref?.()
  logger.info(`Email worker started: 1 email per ${p.intervalMs / 1000}s, window ${p.window} IST, backlog override ${p.backlogOverride}, daily limit ${p.dailyLimit}`)
}
