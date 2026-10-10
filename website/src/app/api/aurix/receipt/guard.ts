import { NextResponse } from 'next/server'
import { getPayload } from 'payload'
import config from '@payload-config'
import { getSessionUser } from '@/lib/auth/session'
import { isSameOrigin } from '@/lib/auth/same-origin'
import { clientIp, rateLimit } from '@/lib/rateLimit'
import { getFormTexts } from '@/lib/form-texts'

export const json = (body: unknown, status = 200) => NextResponse.json(body, { status, headers: { 'Cache-Control': 'no-store' } })

/**
 * Checks for the receipt APIs (/aurix/payment-done): same-origin, a confirmed account, per-user and per-IP limits.
 * Works whether or not the participant portal is shown. Returns the user, Payload and the receipt texts.
 */
export async function guard(req: Request, limitKey: string, perHour: number) {
  const F = await getFormTexts()
  const M = F.messages
  if (!isSameOrigin(req)) return { res: json({ success: false, message: M.badOrigin }, 403) }
  const user = await getSessionUser()
  if (!user) return { res: json({ success: false, message: M.authRequired }, 401) }
  if (!user.emailVerified) return { res: json({ success: false, message: M.regConfirm }, 403) }
  const T = F.receipt
  if (!rateLimit(`${limitKey}:${user.id}`, perHour, 3_600_000) || !rateLimit(`${limitKey}-ip:${clientIp(req)}`, perHour * 3, 3_600_000)) {
    return { res: json({ success: false, message: T.errTooMany }, 429) }
  }
  return { user: { id: Number(user.id), email: user.email }, payload: await getPayload({ config }), T }
}
