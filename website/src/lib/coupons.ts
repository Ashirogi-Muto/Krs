import type { Payload } from 'payload'
import { sql } from '@payloadcms/db-postgres'
import { checkApply, normalizeCode, COUPON_CODE_RE, type ApplyCheck } from './coupon-rules'
import { receiptRegistrations } from './receipts'
import { buildRazorpayPaymentUrl } from './payments/razorpayPage'
import { logger } from './logger'

/**
 * Checkout step (owner, 13 Oct 2026): the logged-in team leader sees the fee, applies or removes a coupon, then goes to
 * the payment page with the amount the server worked out. The coupon is written in one database transaction that locks
 * the registration and the coupon rows, so a usage limit holds even when teams apply at the same moment. The discount
 * lowers `amountDue`, which is what payment matching expects. Error results are keys of the CMS wording
 * (Labels & messages → Payment & coupons).
 */
export type CheckoutError =
  | 'errNoTeam'
  | 'errPaid'
  | 'errInactive'
  | 'errNotFound'
  | 'errOff'
  | 'errNotStarted'
  | 'errExpired'
  | 'errUsedUp'
  | 'errWrongEvent'
  | 'errNoDiscount'

type User = { id: number | string; email?: string }
const ACTIVE = ['PENDING', 'CONFIRMED']
const REASON: Record<Exclude<ApplyCheck, { ok: true }>['reason'], CheckoutError> = {
  notFound: 'errNotFound',
  off: 'errOff',
  notStarted: 'errNotStarted',
  expired: 'errExpired',
  usedUp: 'errUsedUp',
  wrongEvent: 'errWrongEvent',
  noDiscount: 'errNoDiscount',
}
const num = (v: unknown) => (v === null || v === undefined || v === '' ? null : Number(v))

/** The leader's own active registration with this code (null = not theirs / not found). */
export async function checkoutRegistration(payload: Payload, user: User, code: unknown) {
  const c = String(code || '').trim().toUpperCase()
  return (await receiptRegistrations(payload, user)).find((r) => r.registrationCode === c) || null
}

/** What the checkout page shows, and the payment link for the server's amount (null when nothing is to be paid). */
export function checkoutView(reg: any) {
  const event = reg.event && typeof reg.event === 'object' ? reg.event : null
  const due = num(reg.amountDue) ?? num(event?.registrationFee)
  const fee = num(reg.originalFee) ?? due
  const canPay = reg.paymentStatus === 'AWAITING_PAYMENT' && ACTIVE.includes(String(reg.status)) && Number(due) > 0
  return {
    code: String(reg.registrationCode),
    team: String(reg.teamName || ''),
    eventTitle: String(event?.title || ''),
    fee,
    couponCode: reg.couponCode ? String(reg.couponCode) : null,
    discount: num(reg.discountAmount) || 0,
    due,
    paid: reg.paymentStatus === 'PAID_VERIFIED',
    canPay,
    paymentUrl: canPay
      ? buildRazorpayPaymentUrl({
          name: String(reg.leaderName || ''),
          email: String(reg.leaderEmail || ''),
          phone: reg.leaderPhone || undefined,
          college: String(reg.college || ''),
          eventLabel: event?.paymentEventLabel || undefined,
          amountInRupees: Number(due),
        })
      : null,
  }
}

const rowsOf = (r: any): any[] => (Array.isArray(r) ? r : r?.rows || [])

/** Apply `couponCode` to the leader's registration `regCode` (replacing a coupon applied earlier). */
export async function applyCoupon(payload: Payload, user: User, regCode: unknown, couponCode: unknown, now = new Date()) {
  const reg = await checkoutRegistration(payload, user, regCode)
  if (!reg) return { error: 'errNoTeam' as const }
  const code = normalizeCode(couponCode)
  if (!COUPON_CODE_RE.test(code)) return { error: 'errNotFound' as const }
  const db = (payload.db as any).drizzle
  const result: { error: CheckoutError } | { discount: number; final: number; code: string } = await db.transaction(async (tx: any) => {
    const r = rowsOf(await tx.execute(sql`select id, event_id, status, payment_status, amount_due, original_fee, coupon_id from event_registrations where id = ${reg.id} for update`))[0]
    if (!r || !ACTIVE.includes(String(r.status))) return { error: 'errInactive' as const }
    if (r.payment_status === 'PAID_VERIFIED') return { error: 'errPaid' as const }
    const c = rowsOf(await tx.execute(sql`select id, code, active, type, percent, amount, starts_at, expires_at, usage_limit, discount_cap from coupons where code = ${code} for update`))[0]
    if (!c) return { error: 'errNotFound' as const }
    const events = rowsOf(await tx.execute(sql`select events_id from coupons_rels where parent_id = ${c.id} and path = 'events' and events_id is not null`)).map((e) => String(e.events_id))
    const used = Number(rowsOf(await tx.execute(sql`select count(*)::int as n from event_registrations where coupon_id = ${c.id} and status in ('PENDING', 'CONFIRMED') and id <> ${r.id}`))[0]?.n || 0)
    // The fee before any coupon: kept from the first coupon, else what the team owes now (staff may have set a price)
    let base = num(r.original_fee) ?? num(r.amount_due)
    if (base === null) {
      const ev = rowsOf(await tx.execute(sql`select registration_fee from events where id = ${r.event_id}`))[0]
      base = num(ev?.registration_fee)
    }
    const check = checkApply(
      {
        id: c.id,
        active: c.active,
        type: c.type,
        percent: num(c.percent),
        amount: num(c.amount),
        startsAt: c.starts_at ? new Date(c.starts_at).toISOString() : null,
        expiresAt: c.expires_at ? new Date(c.expires_at).toISOString() : null,
        usageLimit: num(c.usage_limit),
        discountCap: num(c.discount_cap),
        events,
      },
      r.event_id,
      Number(base || 0),
      used,
      now,
    )
    if (!check.ok) return { error: REASON[check.reason] }
    await tx.execute(sql`update event_registrations set coupon_id = ${c.id}, coupon_code = ${c.code}, original_fee = ${base}, discount_amount = ${check.discount}, amount_due = ${check.final}, coupon_applied_at = ${now.toISOString()}, updated_at = ${now.toISOString()} where id = ${r.id}`)
    return { discount: check.discount, final: check.final, code: String(c.code) }
  })
  if ('error' in result) return result
  logger.audit(String(user.email || user.id), 'COUPON_APPLIED', 'EventRegistration', String(reg.registrationCode), { coupon: result.code, discount: result.discount, amountDue: result.final })
  return result
}

/** Remove the coupon: the team owes the fee from before the coupon again. */
export async function removeCoupon(payload: Payload, user: User, regCode: unknown, now = new Date()) {
  const reg = await checkoutRegistration(payload, user, regCode)
  if (!reg) return { error: 'errNoTeam' as const }
  const db = (payload.db as any).drizzle
  const result: { error: CheckoutError } | { removed: string | null } = await db.transaction(async (tx: any) => {
    const r = rowsOf(await tx.execute(sql`select id, status, payment_status, original_fee, coupon_code from event_registrations where id = ${reg.id} for update`))[0]
    if (!r || !ACTIVE.includes(String(r.status))) return { error: 'errInactive' as const }
    if (r.payment_status === 'PAID_VERIFIED') return { error: 'errPaid' as const }
    if (!r.coupon_code) return { removed: null }
    await tx.execute(sql`update event_registrations set amount_due = coalesce(original_fee, amount_due), coupon_id = null, coupon_code = null, original_fee = null, discount_amount = null, coupon_applied_at = null, updated_at = ${now.toISOString()} where id = ${r.id}`)
    return { removed: String(r.coupon_code) }
  })
  if ('error' in result) return result
  if (result.removed) logger.audit(String(user.email || user.id), 'COUPON_REMOVED', 'EventRegistration', String(reg.registrationCode), { coupon: result.removed })
  return result
}
