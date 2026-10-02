import type { Payload } from 'payload'
import { logger } from '@/lib/logger'
import { isMailConfigured, sendEmail, type EmailPayload } from './index'

/**
 * Email outbox: request handlers only queue (queueEmail); a background worker inside the app sends.
 *   PENDING --worker--> SENDING --ok--> SENT
 *                               --error--> PENDING (retry after 1, 5, 15, 60 min) ... FAILED after 5 attempts
 * A queueing error is logged and never fails the caller (a registration must not fail because of email).
 * While MAIL_* is not configured, emails stay PENDING and go out once it is.
 */
export const MAX_ATTEMPTS = 5
export const RETRY_MINUTES = [1, 5, 15, 60]
const INTERVAL_MS = 15_000
const BATCH = 5 // per tick: at most ~20 emails a minute, well inside Gmail's limits

type QueueInput = EmailPayload & { kind: 'REGISTRATION_CONFIRMATION'; registration?: number | string }

export async function queueEmail(payload: Payload, email: QueueInput): Promise<boolean> {
  try {
    await payload.create({
      collection: 'email-outbox',
      overrideAccess: true,
      data: { ...email, registration: email.registration as number | undefined, status: 'PENDING', attempts: 0 },
    })
    return true
  } catch (err: any) {
    logger.error(`Could not queue email "${email.subject}" to ${email.to}: ${err?.message || err}`)
    return false
  }
}

/** Retry delay after the n-th failed attempt (1-based). */
export const retryDelayMinutes = (attempt: number) => RETRY_MINUTES[Math.min(attempt, RETRY_MINUTES.length) - 1]

/** One pass over due PENDING emails. Exported for tests and manual runs. */
export async function processOutbox(payload: Payload, now = new Date()): Promise<{ sent: number; failed: number; retried: number }> {
  const stats = { sent: 0, failed: 0, retried: 0 }
  if (!isMailConfigured()) return stats
  const { docs } = await payload.find({
    collection: 'email-outbox',
    overrideAccess: true,
    depth: 0,
    limit: BATCH,
    sort: 'createdAt',
    where: {
      and: [
        { status: { equals: 'PENDING' } },
        { or: [{ nextAttemptAt: { exists: false } }, { nextAttemptAt: { less_than_equal: now.toISOString() } }] },
      ],
    },
  })
  for (const doc of docs as any[]) {
    // Claim the row so a second worker (or a manual run) never sends it twice
    const claimed = await payload.update({
      collection: 'email-outbox',
      overrideAccess: true,
      where: { and: [{ id: { equals: doc.id } }, { status: { equals: 'PENDING' } }] },
      data: { status: 'SENDING' },
    })
    if (!claimed.docs.length) continue
    const attempts = (doc.attempts || 0) + 1
    try {
      const { messageId } = await sendEmail({ to: doc.to, subject: doc.subject, html: doc.html, text: doc.text || undefined })
      await payload.update({
        collection: 'email-outbox',
        id: doc.id,
        overrideAccess: true,
        data: { status: 'SENT', attempts, sentAt: new Date().toISOString(), messageId, lastError: null, nextAttemptAt: null },
      })
      stats.sent += 1
    } catch (err: any) {
      const error = String(err?.message || err).slice(0, 500)
      const final = attempts >= MAX_ATTEMPTS
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
      logger.warn(`Email to ${doc.to} failed (attempt ${attempts}/${MAX_ATTEMPTS}${final ? ', giving up' : ''}): ${error}`)
      if (final) stats.failed += 1
      else stats.retried += 1
    }
  }
  return stats
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
  setTimeout(tick, 5_000).unref?.()
  setInterval(tick, INTERVAL_MS).unref?.()
  logger.info('Email worker started')
}
