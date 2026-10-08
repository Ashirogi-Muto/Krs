import { headers } from 'next/headers'
import { getPayload } from 'payload'
import config from '@payload-config'
import { PAYMENT_MATCHERS, hasRole } from '@/payload/access/roles'
import { matchPayments, type PaymentRow, type RegForMatch } from '@/lib/payments/match'
import { isSameOrigin } from '@/lib/auth/same-origin'
import { logger } from '@/lib/logger'
// Per-user limits only: organisers often share one campus IP, and these routes already require a staff login
import { rateLimitUser } from '@/lib/rateLimit'
import { getStaffTexts } from '@/lib/staff-texts'
import { fill } from '@/lib/form-texts-defaults'

export const dynamic = 'force-dynamic'

/**
 * Razorpay report matching (used by /payment-matching; Finance and registration managers only).
 *   POST { rows: PaymentRow[] }                                  -> preview: each row classified (nothing is saved)
 *   POST { apply: [{ id, paymentId, paidAt? }] }                 -> mark those registrations Paid (verified)
 */
const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' } })

const MAX_ROWS = 5000

export async function POST(req: Request) {
  const A = (await getStaffTexts()).adminApi // wording: CMS → Admin tools → Staff & admin texts
  if (!isSameOrigin(req)) return json({ error: A.badOrigin }, 403)
  const payload = await getPayload({ config })
  const { user } = await payload.auth({ headers: await headers() })
  if (!user || !hasRole(user, PAYMENT_MATCHERS)) return json({ error: A.notAllowed }, 403)

  if (!rateLimitUser(user.id, 'payment-match', 30, 60 * 1000)) {
    return json({ error: A.slowDown }, 429)
  }

  const body = await req.json().catch(() => null)

  const actor = String((user as any).email)

  if (Array.isArray(body?.apply)) {
    const done: string[] = []
    const skipped: string[] = []
    for (const a of body.apply.slice(0, MAX_ROWS)) {
      const paymentId = String(a?.paymentId || '').trim().slice(0, 64)
      if (!a?.id || !paymentId) continue
      const reg: any = await payload.findByID({ collection: 'event-registrations', id: a.id, overrideAccess: true, depth: 0 }).catch(() => null)
      if (!reg) continue
      if (reg.paymentStatus === 'PAID_VERIFIED' && reg.paymentReference && reg.paymentReference !== paymentId) {
        skipped.push(`${reg.registrationCode} (already paid with ${reg.paymentReference})`)
        continue
      }
      const paidAt = a.paidAt && !Number.isNaN(Date.parse(a.paidAt)) ? new Date(a.paidAt).toISOString() : new Date().toISOString()
      await payload.update({
        collection: 'event-registrations',
        id: reg.id,
        overrideAccess: true,
        data: { paymentStatus: 'PAID_VERIFIED', paymentReference: paymentId, verifiedAt: paidAt },
      })
      logger.audit(actor, 'PAYMENT_MATCHED', 'EventRegistration', String(reg.id), { code: reg.registrationCode, paymentId })
      done.push(reg.registrationCode)
    }
    return json({ updated: done, skipped })
  }

  if (!Array.isArray(body?.rows)) return json({ error: A.badRequest }, 400)
  const rows: PaymentRow[] = body.rows.slice(0, MAX_ROWS).map((r: any) => ({
    paymentId: String(r?.paymentId ?? '').slice(0, 64),
    email: String(r?.email ?? '').slice(0, 200),
    phone: String(r?.phone ?? '').slice(0, 40),
    amount: typeof r?.amount === 'number' && Number.isFinite(r.amount) ? r.amount : null,
    event: String(r?.event ?? '').slice(0, 120),
    status: String(r?.status ?? '').slice(0, 40),
    paidAt: r?.paidAt ? String(r.paidAt).slice(0, 60) : undefined,
  }))
  const { docs } = await payload.find({
    collection: 'event-registrations',
    overrideAccess: true,
    depth: 1,
    pagination: false,
    select: { registrationCode: true, teamName: true, leaderEmail: true, leaderPhone: true, event: true, amountDue: true, paymentStatus: true, paymentReference: true, status: true },
  })
  const regs: RegForMatch[] = (docs as any[])
    .filter((r) => r.status !== 'CANCELLED')
    .map((r) => ({
      id: r.id,
      code: r.registrationCode,
      team: r.teamName,
      leaderEmail: r.leaderEmail,
      leaderPhone: r.leaderPhone,
      eventLabel: typeof r.event === 'object' ? r.event?.paymentEventLabel || '' : '',
      eventTitle: typeof r.event === 'object' ? r.event?.title || '' : '',
      amountDue: r.amountDue ?? null,
      paymentStatus: r.paymentStatus,
      paymentReference: r.paymentReference,
    }))
  const results = matchPayments(rows, regs, (await getStaffTexts(payload)).payments).map((m) => ({
    row: m.row,
    kind: m.kind,
    reasons: m.reasons,
    reg: m.reg ? { id: m.reg.id, code: m.reg.code, team: m.reg.team, event: m.reg.eventTitle, amountDue: m.reg.amountDue, paymentStatus: m.reg.paymentStatus } : null,
  }))
  logger.audit(actor, 'PAYMENT_REPORT_PREVIEWED', 'EventRegistration', '-', { rows: rows.length })
  return json({ results })
}
