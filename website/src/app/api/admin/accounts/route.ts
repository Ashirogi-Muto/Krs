import { headers } from 'next/headers'
import { getPayload } from 'payload'
import config from '@payload-config'
import { z } from 'zod'
import { isAdmin, isSuperAdmin } from '@/payload/access/roles'
import { isSameOrigin } from '@/lib/auth/same-origin'
import { linkRegistrations, sendVerification } from '@/lib/auth/participant'
import { sendPasswordReset } from '@/lib/auth/password-reset'
import { linkedRegistrationCount } from '@/lib/auth/accounts'
import { rateLimitUser } from '@/lib/rateLimit'
import { logger } from '@/lib/logger'

export const dynamic = 'force-dynamic'

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' } })

const Body = z.object({
  action: z.enum(['confirm', 'resend', 'reset', 'unlock', 'delete']),
  userId: z.union([z.number().int().positive(), z.string().regex(/^\d{1,12}$/)]),
})

const MAIL_RESULT: Record<string, [number, string]> = {
  sent: [200, 'Email sent.'],
  queued: [200, "Today's email limit is reached: the email is queued and goes out as soon as the limit allows."],
  limit: [503, "Today's email limit is reached; reset links expire within an hour, so none was sent. Try again tomorrow."],
  'not-configured': [503, 'Email is not configured on this server.'],
  failed: [502, 'The email could not be sent. Please try again later.'],
}

/**
 * Account actions from the CMS Accounts screen (/admin/accounts). Admins only; delete is Super Admin only.
 * Admins helping a participant are not limited by the 2-per-day confirmation cap (owner, 4 Oct 2026), but every
 * email still counts against the daily email limit. Every action is written to the audit log.
 */
export async function POST(req: Request) {
  if (!isSameOrigin(req)) return json({ error: 'Bad origin' }, 403)
  const payload = await getPayload({ config })
  const { user: actor } = await payload.auth({ headers: await headers() })
  if (!actor || !isAdmin(actor)) return json({ error: 'Only admins can manage accounts.' }, 403)
  if (!rateLimitUser(actor.id, 'accounts', 60, 60_000)) return json({ error: 'Too many actions. Please slow down.' }, 429)

  const parsed = Body.safeParse(await req.json().catch(() => null))
  if (!parsed.success) return json({ error: 'Invalid request.' }, 400)
  const { action } = parsed.data
  const id = Number(parsed.data.userId)

  const target: any = await payload.findByID({ collection: 'users', id, depth: 0, overrideAccess: true }).catch(() => null)
  if (!target) return json({ error: 'This account no longer exists.' }, 404)
  // Same rule as the Users collection: only the Super Admin manages Super Admin accounts
  if (target.role === 'SUPER_ADMIN' && !isSuperAdmin(actor) && String(target.id) !== String(actor.id))
    return json({ error: 'Only the Super Admin can manage this account.' }, 403)

  const who = String((actor as any).email)
  const audit = (name: string, meta?: Record<string, unknown>) => logger.audit(who, name, 'User', String(target.id), meta)
  const isParticipant = target.role === 'PARTICIPANT'

  try {
    switch (action) {
      case 'confirm': {
        if (!isParticipant) return json({ error: 'Only participant accounts need email confirmation.' }, 400)
        if (target.emailVerified) return json({ ok: true, message: 'Already confirmed.' })
        await payload.update({
          collection: 'users',
          id: target.id,
          overrideAccess: true,
          data: { emailVerified: true, emailVerifiedAt: new Date().toISOString(), verifyTokenHash: null, verifyTokenExpires: null } as any,
        })
        // Same as clicking the emailed link: earlier registrations with this leader email are attached now
        await linkRegistrations(payload, target)
        audit('EMAIL_CONFIRMED_BY_ADMIN')
        return json({ ok: true, message: 'Email confirmed. The participant can use the portal and register teams now.' })
      }
      case 'resend': {
        if (!isParticipant) return json({ error: 'Only participant accounts need email confirmation.' }, 400)
        if (target.emailVerified) return json({ error: 'This account is already confirmed.' }, 400)
        const status = await sendVerification(payload, target)
        audit('CONFIRMATION_RESENT_BY_ADMIN', { status })
        const [code, message] = MAIL_RESULT[status] || MAIL_RESULT.failed
        return json(code === 200 ? { ok: true, message } : { error: message }, code)
      }
      case 'reset': {
        const status = await sendPasswordReset(payload, target)
        audit('PASSWORD_RESET_SENT_BY_ADMIN', { status })
        const [code, message] = MAIL_RESULT[status] || MAIL_RESULT.failed
        return json(code === 200 ? { ok: true, message: status === 'sent' ? 'Password reset email sent (the link works for 60 minutes).' : message } : { error: message }, code)
      }
      case 'unlock': {
        await payload.unlock({ collection: 'users', data: { email: target.email }, overrideAccess: true } as any)
        audit('ACCOUNT_UNLOCKED_BY_ADMIN')
        return json({ ok: true, message: 'Unlocked. They can sign in again.' })
      }
      case 'delete': {
        if (!isSuperAdmin(actor)) return json({ error: 'Only the Super Admin can delete accounts.' }, 403)
        if (String(target.id) === String(actor.id)) return json({ error: "You can't delete your own account." }, 400)
        if (target.role === 'SUPER_ADMIN') return json({ error: 'Super Admin accounts are not deleted from here.' }, 400)
        const linked = await linkedRegistrationCount(payload, target)
        if (linked > 0) return json({ error: `This account is linked to ${linked} registration(s), so it is kept.` }, 400)
        await payload.delete({ collection: 'users', id: target.id, overrideAccess: true })
        audit('ACCOUNT_DELETED_BY_ADMIN', { role: target.role })
        return json({ ok: true, message: 'Account deleted.', deleted: true })
      }
    }
  } catch (err: any) {
    logger.error(`Account action ${action} on user ${target.id} failed: ${err?.message || err}`)
    return json({ error: 'The action failed. Please try again.' }, 500)
  }
}
