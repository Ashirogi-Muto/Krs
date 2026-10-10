import type { Payload } from 'payload'
import { dailyLimitReached, sendAuthEmail, type AuthEmailResult } from '@/lib/email/outbox'
import { passwordReset } from '@/lib/email/templates'
import { getFormTexts } from '@/lib/form-texts'
import { logger } from '@/lib/logger'

export const RESET_MINUTES = 60

/**
 * Email a one-time link to choose a new password. Reset links expire in an hour, so they are never queued:
 * at the daily email limit nothing is sent ('limit'). Used by /api/auth/forgot-password and the CMS Accounts screen.
 */
export async function sendPasswordReset(payload: Payload, user: { id: number | string; email: string; name?: string }): Promise<AuthEmailResult> {
  if (await dailyLimitReached(payload)) return 'limit'
  try {
    // Payload creates and stores the reset token (expiry set here); we send the email ourselves
    const token = await payload.forgotPassword({
      collection: 'users',
      data: { email: user.email },
      disableEmail: true,
      expiration: RESET_MINUTES * 60 * 1000,
    } as any)
    if (!token) return 'failed'
    const site = process.env.NEXT_PUBLIC_SITE_URL || 'https://kalamroboticssociety.com'
    const mail = passwordReset({ name: user.name || 'there', url: `${site}/reset-password?token=${token}`, expiresMinutes: RESET_MINUTES }, (await getFormTexts()).emails)
    return await sendAuthEmail(payload, { ...mail, to: user.email, kind: 'PASSWORD_RESET', reference: `user ${user.id}` })
  } catch (err: any) {
    logger.error(`Password reset email failed for user ${user.id}: ${err?.message || err}`)
    return 'failed'
  }
}
