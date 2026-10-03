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
  // Account confirmations first (they unlock team registration), then everything else, oldest first
  const verifyFirst = await payload.find({
    collection: 'email-outbox',
    overrideAccess: true,
    depth: 0,
    limit: BATCH,
    sort: 'createdAt',
    where: { and: [...(dueWhere.and as any[]), { kind: { equals: 'ACCOUNT_VERIFICATION' } }] } as any,
  })
  const { docs } = verifyFirst.docs.length
    ? verifyFirst
    : await payload.find({ collection: 'email-outbox', overrideAccess: true, depth: 0, limit: BATCH, sort: 'createdAt', where: dueWhere as any })
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
      let content = { subject: doc.subject, html: doc.html, text: doc.text || undefined }
      if (doc.kind === 'ACCOUNT_VERIFICATION') {
        // Queued confirmation: create the link now (so it cannot expire in the queue); the row stays redacted
        const { prepareQueuedVerification } = await import('@/lib/auth/participant')
        const fresh = await prepareQueuedVerification(payload, doc.reference)
        if (!fresh) {
          await payload.update({
            collection: 'email-outbox',
            id: doc.id,
            overrideAccess: true,
            data: { status: 'FAILED', attempts, lastError: 'Skipped: account already confirmed or deleted', nextAttemptAt: null },
          })
          continue
        }
        content = fresh
      }
      const { messageId } = await sendEmail({
        to: doc.to,
        subject: content.subject,
        html: content.html,
        text: content.text,
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

export type AuthEmailResult = 'sent' | 'queued' | 'limit' | 'not-configured' | 'failed'

/**
 * Account emails (confirm email, password reset) go out immediately instead of through the paced queue: their
 * links expire, so a queued copy would be useless. They still count against MAIL_DAILY_LIMIT (Oracle free tier
 * is shared with other sites). The outbox keeps only a redacted record: the link is a credential and is never
 * stored, so nobody with CMS access can reuse it.
 */
export async function sendAuthEmail(
  payload: Payload,
  email: EmailPayload & { kind: 'ACCOUNT_VERIFICATION' | 'PASSWORD_RESET'; reference: string },
): Promise<AuthEmailResult> {
  if (!isMailConfigured()) {
    // Local development: show the link in the server log instead of sending
    if (process.env.NODE_ENV !== 'production') logger.info(`[dev mail] ${email.kind} to ${email.reference}:\n${email.text}`)
    else logger.warn(`Account email not sent (mail not configured): ${email.kind} ${email.reference}`)
    return 'not-configured'
  }
  if (await dailyLimitReached(payload)) {
    logger.warn(`Daily email limit reached; ${email.kind} for ${email.reference} not sent`)
    return 'limit'
  }
  const redacted = {
    to: email.to,
    subject: email.subject,
    kind: email.kind,
    reference: email.reference,
    html: '<p>Account email (contents not stored: the link inside is a one-time credential).</p>',
    text: 'Account email (contents not stored: the link inside is a one-time credential).',
  }
  try {
    const { messageId } = await sendEmail(email)
    await payload.create({
      collection: 'email-outbox',
      overrideAccess: true,
      data: { ...redacted, status: 'SENT', attempts: 1, sentAt: new Date().toISOString(), messageId },
    })
    logger.info(`Account email sent: ${email.kind} ${email.reference}`)
    return 'sent'
  } catch (err: any) {
    logger.error(`Account email failed: ${email.kind} ${email.reference}: ${err?.message || err}`)
    await payload
      .create({
        collection: 'email-outbox',
        overrideAccess: true,
        data: { ...redacted, status: 'FAILED', attempts: 1, lastAttemptAt: new Date().toISOString(), lastError: String(err?.message || err).slice(0, 500) },
      })
      .catch(() => undefined)
    return 'failed'
  }
}

/** Emails sent in the last 24 hours (rolling, so the Oracle free tier can never be exceeded across midnight). */
export async function dailyLimitReached(payload: Payload): Promise<boolean> {
  const { dailyLimit } = pacing()
  const sent24 = await payload.count({
    collection: 'email-outbox',
    overrideAccess: true,
    where: { and: [{ status: { equals: 'SENT' } }, { sentAt: { greater_than: new Date(Date.now() - 86_400_000).toISOString() } }] },
  })
  return sent24.totalDocs >= dailyLimit
}

/** Whether a confirmation email for this account is waiting in the queue. */
export async function verificationQueued(payload: Payload, reference: string): Promise<boolean> {
  const n = await payload.count({
    collection: 'email-outbox',
    overrideAccess: true,
    where: { and: [{ kind: { equals: 'ACCOUNT_VERIFICATION' } }, { reference: { equals: reference } }, { status: { in: ['PENDING', 'SENDING'] } }] },
  })
  return n.totalDocs > 0
}

/**
 * Put a confirmation email in the queue (daily limit reached, or sending failed). Stores no link: the worker
 * creates a fresh one when it sends. One queued confirmation per account.
 */
export async function queueVerification(payload: Payload, to: string, reference: string, retryInMinutes = 0): Promise<void> {
  if (await verificationQueued(payload, reference)) return
  await payload.create({
    collection: 'email-outbox',
    overrideAccess: true,
    data: {
      to,
      subject: 'Confirm your email for your AURIX account',
      kind: 'ACCOUNT_VERIFICATION',
      reference,
      html: '<p>Queued account confirmation (the link is created when the email is sent and is never stored).</p>',
      text: 'Queued account confirmation (the link is created when the email is sent and is never stored).',
      status: 'PENDING',
      attempts: 0,
      ...(retryInMinutes ? { nextAttemptAt: new Date(Date.now() + retryInMinutes * 60_000).toISOString() } : {}),
    },
  })
  logger.info(`Account confirmation queued for ${reference}`)
}
