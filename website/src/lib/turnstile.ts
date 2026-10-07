import { logger } from '@/lib/logger'

/**
 * Cloudflare Turnstile (bot check) on the public forms that send email or store data: sign-up, forgot password,
 * resend confirmation, website forms. OFF until both keys are set in /opt/krs/deploy/.env:
 *   TURNSTILE_SITE_KEY=...    (public; the browser gets it from /api/turnstile-config)
 *   TURNSTILE_SECRET_KEY=...  (server only)
 * The browser sends the widget's answer in the `cf-turnstile-response` header.
 */
export const turnstileSiteKey = () => (process.env.TURNSTILE_SECRET_KEY ? (process.env.TURNSTILE_SITE_KEY || '').trim() : '')
export const turnstileOn = () => Boolean((process.env.TURNSTILE_SECRET_KEY || '').trim() && turnstileSiteKey())

/** True when the check is off, or Cloudflare confirms the token. Fails closed if Cloudflare can't be reached. */
export async function turnstileOk(req: Request, ip: string): Promise<boolean> {
  if (!turnstileOn()) return true
  const token = (req.headers.get('cf-turnstile-response') || '').trim()
  if (!token || token.length > 2048) return false
  try {
    const body = new URLSearchParams({ secret: String(process.env.TURNSTILE_SECRET_KEY).trim(), response: token })
    if (ip && ip !== 'unknown' && !ip.includes('/')) body.set('remoteip', ip)
    const res = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
      method: 'POST',
      body,
      signal: AbortSignal.timeout(5_000),
    })
    const data = (await res.json().catch(() => ({}))) as { success?: boolean; 'error-codes'?: string[] }
    if (!data.success) logger.warn(`Turnstile refused: ${(data['error-codes'] || []).join(',') || res.status}`)
    return Boolean(data.success)
  } catch (err: any) {
    logger.error(`Turnstile check failed: ${err?.message || err}`)
    return false
  }
}

export const TURNSTILE_FAILED = 'The anti-bot check did not pass. Please wait for the check to finish (or reload the page) and try again.'
