import { headers } from 'next/headers'
import { getPayload } from 'payload'
import config from '@payload-config'
import { z } from 'zod'
import { isAdmin, isSuperAdmin } from '@/payload/access/roles'
import { can } from '@/payload/access/permissions'
import { isSameOrigin } from '@/lib/auth/same-origin'
import { linkRegistrations, sendVerification } from '@/lib/auth/participant'
import { sendPasswordReset } from '@/lib/auth/password-reset'
import { linkedRegistrationCount } from '@/lib/auth/accounts'
import { rateLimitUser } from '@/lib/rateLimit'
import { logger } from '@/lib/logger'
import { getStaffTexts } from '@/lib/staff-texts'
import { fill } from '@/lib/form-texts-defaults'

export const dynamic = 'force-dynamic'

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' } })

const Body = z.object({
  action: z.enum(['confirm', 'resend', 'reset', 'unlock', 'delete']),
  userId: z.union([z.number().int().positive(), z.string().regex(/^\d{1,12}$/)]),
})

const mailResult = (A: { mailSent: string; mailQueued: string; mailLimit: string; mailNotConfigured: string; mailFailed: string }): Record<string, [number, string]> => ({
  sent: [200, A.mailSent],
  queued: [200, A.mailQueued],
  limit: [503, A.mailLimit],
  'not-configured': [503, A.mailNotConfigured],
  failed: [502, A.mailFailed],
})

/**
 * Account actions from the CMS screens Participants / Team accounts. Admins, or the matching access-role permission
 * (never on an admin's account); delete: Super Admin or "Delete accounts".
 * Admins helping a participant are not limited by the 2-per-day confirmation cap (owner, 4 Oct 2026), but every
 * email still counts against the daily email limit. Every action is written to the audit log.
 */
export async function POST(req: Request) {
  const A = (await getStaffTexts()).adminApi // wording: CMS → Admin tools → Staff & admin texts
  if (!isSameOrigin(req)) return json({ error: A.badOrigin }, 403)
  const payload = await getPayload({ config })
  const { user: actor } = await payload.auth({ headers: await headers() })
  // Admins: every account. Access roles: "Participants" (participant accounts), "Team accounts" (team member and judge
  // accounts), "Delete accounts" (delete only; checked per action below)
  const KEYS = ['admin.participants', 'accounts.team', 'accounts.delete']
  if (!actor || !(isAdmin(actor) || KEYS.some((k) => can(actor as any, k)))) return json({ error: A.accountsAdminsOnly }, 403)
  if (!rateLimitUser(actor.id, 'accounts', 60, 60_000)) return json({ error: A.accountsTooMany }, 429)

  const parsed = Body.safeParse(await req.json().catch(() => null))
  if (!parsed.success) return json({ error: A.invalidRequest }, 400)
  const { action } = parsed.data
  const id = Number(parsed.data.userId)

  const target: any = await payload.findByID({ collection: 'users', id, depth: 0, overrideAccess: true }).catch(() => null)
  if (!target) return json({ error: A.accountGone }, 404)
  // Same rule as the Users collection: only the Super Admin manages Super Admin accounts
  if (target.role === 'SUPER_ADMIN' && !isSuperAdmin(actor) && String(target.id) !== String(actor.id))
    return json({ error: A.accountSuperOnly }, 403)

  const who = String((actor as any).email)
  const audit = (name: string, meta?: Record<string, unknown>) => logger.audit(who, name, 'User', String(target.id), meta)
  const isParticipant = target.role === 'PARTICIPANT'
  const isTeam = target.role === 'STAFF' || target.role === 'JUDGE'
  if (!isAdmin(actor)) {
    // Never an admin's account; otherwise the permission for this kind of account (delete has its own)
    const mayHelp = (isParticipant && can(actor as any, 'admin.participants')) || (isTeam && can(actor as any, 'accounts.team'))
    const mayDelete = (isParticipant || isTeam) && can(actor as any, 'accounts.delete')
    if (!(action === 'delete' ? mayDelete : mayHelp)) return json({ error: A.accountsAdminsOnly }, 403)
  }

  try {
    switch (action) {
      case 'confirm': {
        if (!isParticipant) return json({ error: A.onlyParticipants }, 400)
        if (target.emailVerified) return json({ ok: true, message: A.alreadyConfirmed })
        await payload.update({
          collection: 'users',
          id: target.id,
          overrideAccess: true,
          data: { emailVerified: true, emailVerifiedAt: new Date().toISOString(), verifyTokenHash: null, verifyTokenExpires: null } as any,
        })
        // Same as clicking the emailed link: earlier registrations with this leader email are attached now
        await linkRegistrations(payload, target)
        audit('EMAIL_CONFIRMED_BY_ADMIN')
        return json({ ok: true, message: A.confirmedByAdmin })
      }
      case 'resend': {
        if (!isParticipant) return json({ error: A.onlyParticipants }, 400)
        if (target.emailVerified) return json({ error: A.alreadyConfirmedError }, 400)
        const status = await sendVerification(payload, target)
        audit('CONFIRMATION_RESENT_BY_ADMIN', { status })
        const [code, message] = mailResult(A)[status] || mailResult(A).failed
        return json(code === 200 ? { ok: true, message } : { error: message }, code)
      }
      case 'reset': {
        const status = await sendPasswordReset(payload, target)
        audit('PASSWORD_RESET_SENT_BY_ADMIN', { status })
        const [code, message] = mailResult(A)[status] || mailResult(A).failed
        return json(code === 200 ? { ok: true, message: status === 'sent' ? A.resetSent : message } : { error: message }, code)
      }
      case 'unlock': {
        await payload.unlock({ collection: 'users', data: { email: target.email }, overrideAccess: true } as any)
        audit('ACCOUNT_UNLOCKED_BY_ADMIN')
        return json({ ok: true, message: A.unlocked })
      }
      case 'delete': {
        if (!isSuperAdmin(actor) && !(can(actor as any, 'accounts.delete') && (isParticipant || isTeam))) return json({ error: A.deleteSuperOnly }, 403)
        if (String(target.id) === String(actor.id)) return json({ error: A.deleteSelf }, 400)
        if (target.role === 'SUPER_ADMIN') return json({ error: A.deleteSuper }, 400)
        const linked = await linkedRegistrationCount(payload, target)
        if (linked > 0) return json({ error: fill(A.deleteLinked, { count: linked }) }, 400)
        await payload.delete({ collection: 'users', id: target.id, overrideAccess: true })
        audit('ACCOUNT_DELETED_BY_ADMIN', { role: target.role })
        return json({ ok: true, message: A.deleted, deleted: true })
      }
    }
  } catch (err: any) {
    logger.error(`Account action ${action} on user ${target.id} failed: ${err?.message || err}`)
    return json({ error: A.actionFailed }, 500)
  }
}
