import { NextResponse } from 'next/server'
import { getPayload } from 'payload'
import config from '@payload-config'
import { getSessionUser } from '@/lib/auth/session'
import { isSameOrigin } from '@/lib/auth/same-origin'
import { clientIp, rateLimit } from '@/lib/rateLimit'
import { getFormTexts } from '@/lib/form-texts'
import { fill } from '@/lib/form-texts-defaults'
import { getEventLabels } from '@/lib/event-labels'
import { applyCoupon, removeCoupon } from '@/lib/coupons'
import { logger } from '@/lib/logger'

export const dynamic = 'force-dynamic'

const json = (body: unknown, status = 200) => NextResponse.json(body, { status, headers: { 'Cache-Control': 'no-store' } })

/**
 * Checkout step (/aurix/pay/<code>), team leader only (owner, 13 Oct 2026):
 *   POST   { code, coupon } → apply the coupon (10 tries per hour per account, 30 per IP: codes can't be guessed)
 *   DELETE { code }         → remove it
 * The amount is worked out and stored on the server (lib/coupons.ts); the page then links to the payment page with it.
 */
async function guard(req: Request, apply: boolean) {
  const F = await getFormTexts()
  const M = F.messages
  if (!isSameOrigin(req)) return { res: json({ success: false, message: M.badOrigin }, 403) }
  const user = await getSessionUser()
  if (!user) return { res: json({ success: false, message: M.authRequired }, 401) }
  if (!user.emailVerified) return { res: json({ success: false, message: M.regConfirm }, 403) }
  const T = F.checkout
  const key = apply ? 'coupon-apply' : 'coupon-remove'
  if (!rateLimit(`${key}:${user.id}`, apply ? 10 : 20, 3_600_000) || !rateLimit(`${key}-ip:${clientIp(req)}`, apply ? 30 : 60, 3_600_000)) {
    return { res: json({ success: false, message: T.errTooMany }, 429) }
  }
  return { user: { id: Number(user.id), email: user.email }, payload: await getPayload({ config }), T }
}

export async function POST(req: Request) {
  const g = await guard(req, true)
  if ('res' in g) return g.res
  const body = await req.json().catch(() => null)
  try {
    const r = await applyCoupon(g.payload, g.user, body?.code, body?.coupon)
    if ('error' in r) {
      // Entry option without coupons (e.g. BGMI Solo): wording from Event pages → Entry options
      const message = r.error === 'errOptionNoCoupon' ? fill((await getEventLabels()).entryNoCoupon, { option: (r as { option?: string }).option || '' }) : g.T[r.error]
      return json({ success: false, message }, r.error === 'errNoTeam' ? 403 : 400)
    }
    return json({ success: true, message: fill(g.T.applied, { code: r.code, discount: r.discount, amount: r.final }) })
  } catch (err: any) {
    logger.error(`Coupon apply failed: ${err?.message || err}`)
    return json({ success: false, message: g.T.errFailed }, 500)
  }
}

export async function DELETE(req: Request) {
  const g = await guard(req, false)
  if ('res' in g) return g.res
  const body = await req.json().catch(() => null)
  try {
    const r = await removeCoupon(g.payload, g.user, body?.code)
    if ('error' in r) return json({ success: false, message: (g.T as Record<string, string>)[r.error] }, r.error === 'errNoTeam' ? 403 : 400)
    return json({ success: true, message: g.T.removed })
  } catch (err: any) {
    logger.error(`Coupon remove failed: ${err?.message || err}`)
    return json({ success: false, message: g.T.errFailed }, 500)
  }
}
