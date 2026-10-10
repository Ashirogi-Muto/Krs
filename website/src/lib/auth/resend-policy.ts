/**
 * How many confirmation emails one participant account may get (owner, 4 Oct 2026): 2 per rolling 24 hours
 * (the sign-up email + one resend) and at least 2 minutes between them, so impatient clicks don't use up the
 * shared daily email budget. Admins helping someone from the CMS Accounts screen are not limited by this.
 * Pure functions (no database) so they can be unit-tested; the times come from the email outbox.
 */
export const CONFIRMATIONS_PER_DAY = 2
export const RESEND_COOLDOWN_MS = 2 * 60_000
const DAY_MS = 86_400_000

export type ResendDecision =
  | { ok: true }
  | { ok: false; reason: 'cooldown'; retryAt: Date }
  | { ok: false; reason: 'daily'; retryAt: Date }

/** `sentAt`: when this account's earlier confirmation emails were sent or queued (any order). */
export function checkResend(sentAt: Date[], now = new Date()): ResendDecision {
  const t = now.getTime()
  const recent = sentAt
    .map((d) => d.getTime())
    .filter((x) => Number.isFinite(x) && x > t - DAY_MS && x <= t)
    .sort((a, b) => a - b)
  if (recent.length >= CONFIRMATIONS_PER_DAY) {
    // The oldest email in the window has to leave it before another one is allowed
    return { ok: false, reason: 'daily', retryAt: new Date(recent[recent.length - CONFIRMATIONS_PER_DAY] + DAY_MS) }
  }
  const last = recent[recent.length - 1]
  if (last !== undefined && t - last < RESEND_COOLDOWN_MS) return { ok: false, reason: 'cooldown', retryAt: new Date(last + RESEND_COOLDOWN_MS) }
  return { ok: true }
}

type RefusalTexts = { resendCooldown: string; resendDaily: string; unitMinutes: string; unitSeconds: string }
const DEFAULT_REFUSAL: RefusalTexts = {
  resendCooldown: 'A link was sent moments ago. Please check your inbox and spam folder; you can ask for another one in {wait}.',
  resendDaily: 'You have had {count} confirmation emails in the last 24 hours. Please check your spam folder; you can ask for a new link after {when} IST.',
  unitMinutes: '{n} minutes',
  unitSeconds: '{n} seconds',
}
const put = (s: string, vars: Record<string, string | number>) => s.replace(/\{(\w+)\}/g, (m, k) => (k in vars ? String(vars[k]) : m))

/** The participant-facing message for a refused resend (wording: CMS → Labels & messages → Messages). */
export function resendRefusal(d: Exclude<ResendDecision, { ok: true }>, now = new Date(), t: RefusalTexts = DEFAULT_REFUSAL): string {
  if (d.reason === 'cooldown') {
    const s = Math.max(1, Math.ceil((d.retryAt.getTime() - now.getTime()) / 1000))
    return put(t.resendCooldown, { wait: s > 60 ? put(t.unitMinutes, { n: Math.ceil(s / 60) }) : put(t.unitSeconds, { n: s }) })
  }
  const when = d.retryAt.toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit', timeZone: 'Asia/Kolkata' })
  return put(t.resendDaily, { count: CONFIRMATIONS_PER_DAY, when })
}
