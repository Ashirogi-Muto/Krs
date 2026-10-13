/**
 * Discount coupons (owner, 13 Oct 2026): pure rules, unit-tested (tests/coupons.test.ts).
 * - A coupon takes a percentage or a flat amount (₹) off a team's fee; a team always pays at least ₹1 (owner: no free
 *   entries), so payment matching and receipts work as for every other team.
 * - One coupon per team, never stacked. Optional controls: starts at, expires at, usage limit, chosen competitions.
 * - Staff may only make coupons whose largest discount per team stays within their limit (couponLimit): the
 *   site-wide limit (required: a ₹ amount and/or a % of the fee), its ₹ part lowered by an optional per-person and
 *   an optional per-access-role limit.
 *   Admins and the Super Admin have no limit.
 */
export const COUPON_CODE_RE = /^[A-Z0-9][A-Z0-9-]{2,29}$/
export const MIN_PAYABLE = 1

/** "  summer-25 " → "SUMMER-25" (codes are not case-sensitive). */
export const normalizeCode = (v: unknown) => String(v ?? '').trim().toUpperCase()

export type CouponType = 'PERCENT' | 'FLAT'
export type CouponLike = {
  id?: number | string
  active?: boolean | null
  type?: CouponType | string | null
  percent?: number | null
  amount?: number | null
  startsAt?: string | null
  expiresAt?: string | null
  usageLimit?: number | null
  /** Event ids the coupon is limited to (empty = every competition) */
  events?: unknown
  /** Largest discount per team allowed when a team member made or last edited it (null = an admin did) */
  discountCap?: number | null
  /** Largest discount as a % of the team's fee, from the same moment (null = none / an admin) */
  percentCap?: number | null
}

const idOf = (v: unknown): string | null => {
  if (v === null || v === undefined) return null
  if (typeof v === 'object') return idOf((v as any).id ?? (v as any).value)
  return String(v)
}
export const couponEventIds = (c: CouponLike): string[] => (Array.isArray(c.events) ? c.events.map(idOf).filter((x): x is string => Boolean(x)) : [])

/** The discount (whole rupees) a coupon gives on `base`, keeping at least ₹1 to pay. */
export function discountFor(c: CouponLike, base: number): number {
  if (!Number.isFinite(base) || base <= MIN_PAYABLE) return 0
  let d = 0
  if (c.type === 'PERCENT') d = Math.round((base * Number(c.percent || 0)) / 100)
  else if (c.type === 'FLAT') d = Math.round(Number(c.amount || 0))
  if (c.discountCap !== null && c.discountCap !== undefined && Number.isFinite(Number(c.discountCap))) d = Math.min(d, Number(c.discountCap))
  if (c.percentCap !== null && c.percentCap !== undefined && Number.isFinite(Number(c.percentCap))) d = Math.min(d, Math.floor((base * Number(c.percentCap)) / 100))
  return Math.max(0, Math.min(d, base - MIN_PAYABLE))
}

export type CouponState = 'ACTIVE' | 'OFF' | 'NOT_STARTED' | 'EXPIRED' | 'USED_UP'
/** Where a coupon stands now (the CMS list column, and the first check when a team applies it). */
export function couponState(c: CouponLike, uses: number, now = new Date()): CouponState {
  if (c.active === false) return 'OFF'
  if (c.startsAt && new Date(c.startsAt).getTime() > now.getTime()) return 'NOT_STARTED'
  if (c.expiresAt && new Date(c.expiresAt).getTime() <= now.getTime()) return 'EXPIRED'
  if (c.usageLimit && uses >= c.usageLimit) return 'USED_UP'
  return 'ACTIVE'
}

export type ApplyCheck =
  | { ok: true; discount: number; final: number }
  | { ok: false; reason: 'notFound' | 'off' | 'notStarted' | 'expired' | 'usedUp' | 'wrongEvent' | 'noDiscount' }

/** Can this team use the coupon now? `usesByOthers` excludes the team itself (re-applying the same code). */
export function checkApply(c: CouponLike | null, eventId: unknown, base: number, usesByOthers: number, now = new Date()): ApplyCheck {
  if (!c) return { ok: false, reason: 'notFound' }
  const state = couponState(c, usesByOthers, now)
  if (state === 'OFF') return { ok: false, reason: 'off' }
  if (state === 'NOT_STARTED') return { ok: false, reason: 'notStarted' }
  if (state === 'EXPIRED') return { ok: false, reason: 'expired' }
  if (state === 'USED_UP') return { ok: false, reason: 'usedUp' }
  const events = couponEventIds(c)
  if (events.length && !events.includes(String(idOf(eventId)))) return { ok: false, reason: 'wrongEvent' }
  const discount = discountFor(c, base)
  if (discount <= 0) return { ok: false, reason: 'noDiscount' }
  return { ok: true, discount, final: base - discount }
}

/**
 * The largest discount one team can get from this coupon: the most expensive competition it covers (`fees`: event id →
 * fee; all competitions when the coupon names none). Used to hold staff coupons to their limit.
 */
export function maxDiscountOf(c: CouponLike, fees: Map<string, number>): number {
  const ids = couponEventIds(c)
  const pool = (ids.length ? ids.map((id) => fees.get(id) ?? 0) : [...fees.values()]).filter((f) => f > 0)
  const top = pool.length ? Math.max(...pool) : 0
  if (c.type === 'PERCENT') return Math.round((top * Number(c.percent || 0)) / 100)
  return Math.min(Math.round(Number(c.amount || 0)), Math.max(0, top - MIN_PAYABLE))
}

/** The largest % off any team can get from this coupon (flat: against the cheapest competition it covers). */
export function maxPercentOf(c: CouponLike, fees: Map<string, number>): number {
  if (c.type === 'PERCENT') return Number(c.percent || 0)
  const ids = couponEventIds(c)
  const pool = (ids.length ? ids.map((id) => fees.get(id) ?? 0) : [...fees.values()]).filter((f) => f > 0)
  if (!pool.length) return 0
  return (Math.round(Number(c.amount || 0)) / Math.min(...pool)) * 100
}

export type Limit = { amount: number | null; percent: number | null }
/**
 * A team member's limit: the site-wide limit (required: a ₹ amount and/or a % of the fee; neither = no coupons for team
 * members), its ₹ part lowered by their own limit and by their access roles' limit (the highest among their coupon roles
 * that set one), whichever is strictest. null = no limit (admins).
 */
export function couponLimit(o: {
  isAdmin: boolean
  site: number | null | undefined
  sitePercent?: number | null
  person?: number | null
  roles?: (number | null | undefined)[]
}): Limit | null | 'NO_SITE_LIMIT' {
  if (o.isAdmin) return null
  const site = o.site && o.site > 0 ? o.site : null
  const percent = o.sitePercent && o.sitePercent > 0 ? o.sitePercent : null
  if (site === null && percent === null) return 'NO_SITE_LIMIT'
  let amount: number | null = site
  const lower = (v: number) => (amount = amount === null ? v : Math.min(amount, v))
  if (o.person !== null && o.person !== undefined && o.person >= 0) lower(o.person)
  const roleLimits = (o.roles || []).filter((r): r is number => typeof r === 'number' && r >= 0)
  if (roleLimits.length) lower(Math.max(...roleLimits))
  return { amount, percent }
}
