import crypto from 'node:crypto'
import type { Payload } from 'payload'
import { logger } from '@/lib/logger'
import { dailyLimitReached, queueVerification, sendAuthEmail, verificationQueued, type AuthEmailResult } from '@/lib/email/outbox'
import { accountVerification } from '@/lib/email/templates'
import { emailTexts } from '@/lib/email/texts'

/**
 * AURIX participant accounts: email confirmation, linking registrations, and deleting unconfirmed accounts.
 * Only PARTICIPANT accounts are affected; staff and admin logins never depend on any of this.
 */
export const VERIFY_HOURS = 24
export const UNVERIFIED_DELETE_DAYS = 7

const SITE = () => process.env.NEXT_PUBLIC_SITE_URL || 'https://kalamroboticssociety.com'
export const hashToken = (token: string) => crypto.createHash('sha256').update(token).digest('hex')
const istDate = (d: Date) => d.toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'Asia/Kolkata' })

/** The date an unconfirmed account will be deleted (sign-up + 7 days). */
export const deletionDate = (createdAt: string | Date) =>
  new Date(new Date(createdAt).getTime() + UNVERIFIED_DELETE_DAYS * 86_400_000)

export const deletionDateText = (createdAt: string | Date) => istDate(deletionDate(createdAt))

/** Create a fresh confirmation link (the old one stops working) and the email that carries it. */
async function buildVerification(payload: Payload, user: { id: number | string; email: string; name?: string; createdAt?: string }) {
  const token = crypto.randomBytes(32).toString('base64url')
  await payload.update({
    collection: 'users',
    id: user.id,
    overrideAccess: true,
    data: { verifyTokenHash: hashToken(token), verifyTokenExpires: new Date(Date.now() + VERIFY_HOURS * 3_600_000).toISOString() } as any,
  })
  return accountVerification(
    {
      name: user.name || 'there',
      url: `${SITE()}/verify-email?token=${token}`,
      expiresHours: VERIFY_HOURS,
      deleteOn: deletionDateText(user.createdAt || new Date()),
    },
    await emailTexts(),
  )
}

/**
 * Email a confirmation link now, or queue it when today's email limit is reached (or sending fails): queued
 * confirmations go out first when the limit frees up, with a link created at that moment.
 * Returns 'sent', 'queued' (participant is told to check tomorrow), or 'not-configured' (local development).
 */
export async function sendVerification(payload: Payload, user: { id: number | string; email: string; name?: string; createdAt?: string }): Promise<AuthEmailResult> {
  const reference = `user ${user.id}`
  if (await verificationQueued(payload, reference)) return 'queued'
  if (await dailyLimitReached(payload)) {
    await queueVerification(payload, user.email, reference)
    return 'queued'
  }
  const mail = await buildVerification(payload, user)
  const result = await sendAuthEmail(payload, { ...mail, to: user.email, kind: 'ACCOUNT_VERIFICATION', reference })
  if (result === 'limit') {
    await queueVerification(payload, user.email, reference)
    return 'queued'
  }
  if (result === 'failed') {
    await queueVerification(payload, user.email, reference, 5) // retry through the queue in 5 minutes
    return 'queued'
  }
  return result
}

/** Worker: build a queued confirmation for "user <id>" (null when the account is gone or already confirmed). */
export async function prepareQueuedVerification(payload: Payload, reference: string) {
  const id = String(reference || '').replace(/^user /, '')
  if (!id) return null
  const user: any = await payload.findByID({ collection: 'users', id, depth: 0, overrideAccess: true }).catch(() => null)
  if (!user || user.emailVerified) return null
  return buildVerification(payload, user)
}

/** When this account's confirmation emails were sent or queued in the last 24 hours (failed attempts don't count). */
export async function recentConfirmationTimes(payload: Payload, userId: number | string): Promise<Date[]> {
  const cutoff = new Date(Date.now() - 86_400_000).toISOString()
  const res = await payload.find({
    collection: 'email-outbox',
    overrideAccess: true,
    depth: 0,
    limit: 50,
    where: {
      and: [
        { kind: { equals: 'ACCOUNT_VERIFICATION' } },
        { reference: { equals: `user ${userId}` } },
        { status: { not_equals: 'FAILED' } },
        { or: [{ createdAt: { greater_than: cutoff } }, { sentAt: { greater_than: cutoff } }] },
      ],
    },
  })
  return (res.docs as any[]).map((d) => new Date(d.sentAt || d.createdAt))
}

/** Whether this account's confirmation email is waiting in the queue (shown on the "confirm your email" screen). */
export const confirmationQueued = (payload: Payload, userId: number | string) => verificationQueued(payload, `user ${userId}`)

/** The account a confirmation link belongs to (the link is not used up by looking). */
export async function findVerifyToken(
  payload: Payload,
  token: string,
): Promise<{ ok: true; user: any } | { ok: false; reason: 'invalid' | 'expired' }> {
  if (!/^[A-Za-z0-9_-]{20,100}$/.test(token)) return { ok: false, reason: 'invalid' }
  const found = await payload.find({
    collection: 'users',
    where: { verifyTokenHash: { equals: hashToken(token) } },
    limit: 1,
    depth: 0,
    overrideAccess: true,
    showHiddenFields: true,
  })
  const user: any = found.docs[0]
  if (!user) return { ok: false, reason: 'invalid' }
  if (!user.verifyTokenExpires || new Date(user.verifyTokenExpires).getTime() < Date.now()) return { ok: false, reason: 'expired' }
  return { ok: true, user }
}

/**
 * Confirm an email from the link. Single use; expired or unknown tokens fail.
 * The account password is required as well (owner, 7 Oct 2026): someone who signs up with another person's address
 * cannot get that account confirmed by the address owner clicking the email, because the owner doesn't know the
 * password (they use "Forgot password" instead, which confirms the address and sets their own password).
 * After confirmation, registrations made earlier with this leader email are linked to the account
 * (only now, so nobody can take over a team by signing up with someone else's address).
 * Returns a fresh session token for the confirmed account.
 */
export async function confirmEmail(
  payload: Payload,
  token: string,
  password: string,
): Promise<{ ok: true; userId: number | string; sessionToken?: string } | { ok: false; reason: 'invalid' | 'expired' | 'password' }> {
  const found = await findVerifyToken(payload, token)
  if (!found.ok) return found
  const user = found.user
  let sessionToken: string | undefined
  try {
    // Checks the password hash and Payload's lockout (5 wrong passwords lock the account for 10 minutes)
    const login = await payload.login({ collection: 'users', data: { email: user.email, password } })
    sessionToken = login.token
  } catch {
    logger.warn(`Email confirmation refused for user ${user.id}: wrong password`)
    return { ok: false, reason: 'password' }
  }
  await payload.update({
    collection: 'users',
    id: user.id,
    overrideAccess: true,
    data: { emailVerified: true, emailVerifiedAt: new Date().toISOString(), verifyTokenHash: null, verifyTokenExpires: null } as any,
  })
  await linkRegistrations(payload, user)
  logger.audit(String(user.email), 'EMAIL_CONFIRMED', 'User', String(user.id))
  return { ok: true, userId: user.id, sessionToken }
}

/** Attach registrations whose leader email is this (confirmed) account's email. */
export async function linkRegistrations(payload: Payload, user: { id: number | string; email: string }) {
  const regs = await payload.find({
    collection: 'event-registrations',
    where: { leaderEmail: { equals: String(user.email).toLowerCase() } },
    limit: 50,
    depth: 0,
    overrideAccess: true,
  })
  for (const r of regs.docs as any[]) {
    const ids = (r.participants || []).map((p: any) => (typeof p === 'object' ? p.id : p))
    if (ids.some((id: any) => String(id) === String(user.id))) continue
    await payload.update({ collection: 'event-registrations', id: r.id, overrideAccess: true, data: { participants: [...ids, user.id] } as any })
    logger.audit(String(user.email), 'REGISTRATION_LINKED', 'EventRegistration', String(r.id), { code: r.registrationCode })
  }
}

/** Delete participant accounts that were never confirmed within 7 days (they cannot have registrations). */
export async function deleteUnverifiedParticipants(payload: Payload): Promise<number> {
  const cutoff = new Date(Date.now() - UNVERIFIED_DELETE_DAYS * 86_400_000).toISOString()
  const stale = await payload.find({
    collection: 'users',
    where: {
      and: [
        { role: { equals: 'PARTICIPANT' } },
        { or: [{ emailVerified: { equals: false } }, { emailVerified: { exists: false } }] },
        { createdAt: { less_than: cutoff } },
      ],
    },
    limit: 200,
    depth: 0,
    overrideAccess: true,
  })
  let deleted = 0
  for (const u of stale.docs as any[]) {
    // Safety net: never delete an account that is linked to a registration
    const linked = await payload.count({ collection: 'event-registrations', where: { participants: { contains: u.id } }, overrideAccess: true })
    if (linked.totalDocs > 0) continue
    // ...or one whose confirmation email is still queued (the daily limit delayed it); deleted after it is sent
    if (await verificationQueued(payload, `user ${u.id}`)) continue
    await payload.delete({ collection: 'users', id: u.id, overrideAccess: true })
    logger.audit('SYSTEM', 'UNVERIFIED_ACCOUNT_DELETED', 'User', String(u.id))
    deleted++
  }
  if (deleted) logger.info(`Deleted ${deleted} unconfirmed participant account(s) older than ${UNVERIFIED_DELETE_DAYS} days`)
  return deleted
}

/** Run the cleanup shortly after start and then every 6 hours (single app container). */
export function startUnverifiedCleanup(payload: Payload) {
  if (process.env.NEXT_PHASE === 'phase-production-build') return
  const g = globalThis as any
  if (g.__krsUnverifiedCleanup) return
  const run = () => deleteUnverifiedParticipants(payload).catch((err) => logger.error(`Unverified-account cleanup failed: ${err?.message || err}`))
  g.__krsUnverifiedCleanup = setInterval(run, 6 * 3_600_000)
  setTimeout(run, 60_000)
}

/**
 * Account names: letters of any language, spaces and . ' - (2–80 characters). The name is put into emails ("Hi …"),
 * so links or other text can't be smuggled into a message sent from the society's address.
 */
/** Team registration needs a confirmed account unless AURIX_REQUIRE_ACCOUNT=0 is set explicitly (fail closed). */
export const accountRequired = () => process.env.AURIX_REQUIRE_ACCOUNT !== '0'

export const PERSON_NAME = /^[\p{L}\p{M}][\p{L}\p{M} .'-]{1,79}$/u
export const PERSON_NAME_MESSAGE = "Use letters, spaces and . ' - only in the name (2–80 characters)."

/** Only site paths are allowed as "where to go after login" (no open redirect to other sites). */
export function safeNext(next: unknown, fallback = '/aurix/portal'): string {
  const v = typeof next === 'string' ? next : ''
  return /^\/(?!\/)[A-Za-z0-9/_\-?=&.%]*$/.test(v) && !v.startsWith('/api') ? v : fallback
}
