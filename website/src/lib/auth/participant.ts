import crypto from 'node:crypto'
import type { Payload } from 'payload'
import { logger } from '@/lib/logger'
import { sendAuthEmail, type AuthEmailResult } from '@/lib/email/outbox'
import { accountVerification } from '@/lib/email/templates'

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

/** Issue a fresh confirmation link (the old one stops working) and email it. */
export async function sendVerification(payload: Payload, user: { id: number | string; email: string; name?: string; createdAt?: string }): Promise<AuthEmailResult> {
  const token = crypto.randomBytes(32).toString('base64url')
  await payload.update({
    collection: 'users',
    id: user.id,
    overrideAccess: true,
    data: { verifyTokenHash: hashToken(token), verifyTokenExpires: new Date(Date.now() + VERIFY_HOURS * 3_600_000).toISOString() } as any,
  })
  const mail = accountVerification({
    name: user.name || 'there',
    url: `${SITE()}/verify-email?token=${token}`,
    expiresHours: VERIFY_HOURS,
    deleteOn: deletionDateText(user.createdAt || new Date()),
  })
  return sendAuthEmail(payload, { ...mail, to: user.email, kind: 'ACCOUNT_VERIFICATION', reference: `user ${user.id}` })
}

/**
 * Confirm an email from the link. Single use; expired or unknown tokens fail.
 * After confirmation, registrations made earlier with this leader email are linked to the account
 * (only now, so nobody can take over a team by signing up with someone else's address).
 */
export async function confirmEmail(payload: Payload, token: string): Promise<{ ok: true; userId: number | string } | { ok: false; reason: 'invalid' | 'expired' }> {
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
  await payload.update({
    collection: 'users',
    id: user.id,
    overrideAccess: true,
    data: { emailVerified: true, emailVerifiedAt: new Date().toISOString(), verifyTokenHash: null, verifyTokenExpires: null } as any,
  })
  await linkRegistrations(payload, user)
  logger.audit(String(user.email), 'EMAIL_CONFIRMED', 'User', String(user.id))
  return { ok: true, userId: user.id }
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

/** Only site paths are allowed as "where to go after login" (no open redirect to other sites). */
export function safeNext(next: unknown, fallback = '/aurix/portal'): string {
  const v = typeof next === 'string' ? next : ''
  return /^\/(?!\/)[A-Za-z0-9/_\-?=&.%]*$/.test(v) && !v.startsWith('/api') ? v : fallback
}
