import { headers } from 'next/headers'
import { getPayload } from 'payload'
import config from '@payload-config'
import { canFor, eventIdOf, eventScope } from '@/payload/access/permissions'
import { guessColumns, matchPayments, type PaymentRow, type RegForMatch } from '@/lib/payments/match'
import { parsePaidAt, readReport, REPORT_LIMITS, ReportFileError, type ReportErrorCode } from '@/lib/payments/report-file'
import { paymentIdsOf, previousReport, saveReport, setReportPaymentIds } from '@/lib/payments/reports'
import { isSameOrigin } from '@/lib/auth/same-origin'
import { logger } from '@/lib/logger'
// Per-user limits only: organisers often share one campus IP, and these routes already require a staff login
import { rateLimitUser } from '@/lib/rateLimit'
import { getStaffTexts } from '@/lib/staff-texts'
import { fill } from '@/lib/form-texts-defaults'

export const dynamic = 'force-dynamic'

/**
 * Razorpay report matching (CMS → Registrations → Payment matching; "Payment matching" permission, per event).
 *   POST multipart { file }                                      -> read + store the report (.xlsx / .csv), return its table
 *   POST { rows: PaymentRow[], reportId? }                       -> preview: each row classified (no team changes)
 *   POST { apply: [{ id, paymentId, paidAt? }] }                 -> mark those registrations Paid (verified)
 * Reports are cumulative, so the same payments come back every day: a payment already stored on a team, or a team
 * already paid, is never offered or recorded again (match.ts rules + the checks in apply + a unique index).
 * No email is sent (owner, 9 Oct 2026).
 */
const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' } })

const MAX_ROWS = REPORT_LIMITS.maxRows
const PAYMENT_ID = /^[A-Za-z0-9_-]{1,64}$/

export async function POST(req: Request) {
  const A = (await getStaffTexts()).adminApi // wording: CMS → Admin tools → Staff & admin texts
  if (!isSameOrigin(req)) return json({ error: A.badOrigin }, 403)
  const payload = await getPayload({ config })
  const { user } = await payload.auth({ headers: await headers() })
  // "Payment matching" (access roles: all events or only theirs); the report is matched against those events only
  const scope = user ? eventScope(user as any, 'tools.paymentMatching') : []
  if (!user || (Array.isArray(scope) && !scope.length)) return json({ error: A.notAllowed }, 403)

  if (!rateLimitUser(user.id, 'payment-match', 30, 60 * 1000)) {
    return json({ error: A.slowDown }, 429)
  }
  const P = (await getStaffTexts(payload)).payments
  const actor = String((user as any).email)

  // ---- Upload: the file is read here (never trusted from the browser) and stored in the private volume
  if ((req.headers.get('content-type') || '').toLowerCase().startsWith('multipart/form-data')) {
    // Refuse oversized bodies before reading them (the form adds a little on top of the file)
    if (Number(req.headers.get('content-length') || 0) > REPORT_LIMITS.maxFileBytes + 64 * 1024) return json({ error: P.errTooBig }, 413)
    const form = await req.formData().catch(() => null)
    const file = form?.get('file')
    if (!file || typeof file === 'string') return json({ error: A.badRequest }, 400)
    if (file.size > REPORT_LIMITS.maxFileBytes) return json({ error: P.errTooBig }, 413)
    const buf = Buffer.from(await file.arrayBuffer())
    let parsed
    try {
      parsed = readReport(buf, file.name || '')
    } catch (err) {
      if (!(err instanceof ReportFileError)) throw err
      const msg: Record<ReportErrorCode, string> = {
        type: P.notCsv,
        broken: P.errBroken,
        tooBig: P.errTooBig,
        empty: P.errEmpty,
        tooMany: fill(P.errTooMany, { max: REPORT_LIMITS.maxRows }),
      }
      logger.audit(actor, 'PAYMENT_REPORT_REFUSED', 'PaymentReport', '-', { reason: err.code, bytes: buf.length })
      return json({ error: msg[err.code] }, 400)
    }
    const [head, ...data] = parsed.table
    const idCol = head.indexOf(guessColumns(head).paymentId || '')
    const report = await saveReport(payload, {
      buf,
      kind: parsed.kind,
      originalName: String(file.name || ''),
      uploadedBy: actor,
      rowCount: data.length,
      paymentIds: idCol >= 0 ? paymentIdsOf(data.map((r) => r[idCol] ?? '')) : [],
    })
    const previous = await previousReport(payload, report.id)
    logger.audit(actor, 'PAYMENT_REPORT_UPLOADED', 'PaymentReport', String(report.id), { rows: data.length, kind: parsed.kind })
    return json({
      report: { id: report.id, createdAt: report.createdAt },
      previous: previous ? { id: previous.id, createdAt: previous.createdAt } : null,
      table: parsed.table,
    })
  }

  const body = await req.json().catch(() => null)

  // ---- Apply: every team is re-read and re-checked here, whatever the preview said
  if (Array.isArray(body?.apply)) {
    const done: string[] = []
    const skipped: string[] = []
    for (const a of body.apply.slice(0, MAX_ROWS)) {
      const paymentId = String(a?.paymentId || '').trim()
      const id = Number(a?.id)
      if (!Number.isInteger(id) || id <= 0 || !PAYMENT_ID.test(paymentId)) continue
      const reg: any = await payload.findByID({ collection: 'event-registrations', id, overrideAccess: true, depth: 0 }).catch(() => null)
      if (!reg || !canFor(user as any, 'tools.paymentMatching', eventIdOf(reg))) continue
      const code = reg.registrationCode
      if (reg.status === 'CANCELLED') {
        skipped.push(fill(P.skipCancelled, { code }))
        continue
      }
      if (reg.paymentStatus === 'PAID_VERIFIED') {
        // Same payment, or marked paid by hand (no payment ID): already recorded; another payment ID: a second payment
        skipped.push(!reg.paymentReference || reg.paymentReference === paymentId ? fill(P.skipRecorded, { code }) : fill(P.skipPaid, { code, ref: reg.paymentReference }))
        continue
      }
      // One Razorpay payment pays for one team only
      const { docs: holders } = await payload.find({
        collection: 'event-registrations',
        overrideAccess: true,
        depth: 0,
        limit: 1,
        where: { paymentReference: { equals: paymentId }, id: { not_equals: reg.id } },
        select: { registrationCode: true },
      })
      if (holders.length) {
        skipped.push(fill(P.skipOtherTeam, { code, ref: paymentId, other: (holders[0] as any).registrationCode }))
        continue
      }
      const paidAt = parsePaidAt(a?.paidAt) || new Date().toISOString()
      try {
        await payload.update({
          collection: 'event-registrations',
          id: reg.id,
          overrideAccess: true,
          data: { paymentStatus: 'PAID_VERIFIED', paymentReference: paymentId, verifiedAt: paidAt },
        })
      } catch (err) {
        // The unique index on paymentReference: someone recorded this payment on another team a moment ago
        logger.warn('payment-matching: update refused', { code, paymentId, error: String((err as Error)?.message || err).slice(0, 200) })
        skipped.push(fill(P.skipOtherTeam, { code, ref: paymentId, other: '?' }))
        continue
      }
      logger.audit(actor, 'PAYMENT_MATCHED', 'EventRegistration', String(reg.id), { code, paymentId })
      done.push(code)
    }
    return json({ updated: done, skipped })
  }

  // ---- Preview
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
    ...(scope === 'all' ? {} : { where: { event: { in: scope } } }),
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

  // Rows already in the earlier report are marked, so staff see what is new since then
  const reportId = Number(body?.reportId)
  let earlier = new Set<string>()
  if (Number.isInteger(reportId) && reportId > 0) {
    await setReportPaymentIds(payload, reportId, paymentIdsOf(rows.map((r) => r.paymentId)))
    const prev = await previousReport(payload, reportId)
    if (prev) earlier = new Set(prev.paymentIds)
  }

  const results = matchPayments(rows, regs, P).map((m) => ({
    row: m.row,
    kind: m.kind,
    reasons: m.reasons,
    seenBefore: !!m.row.paymentId && earlier.has(m.row.paymentId.trim()),
    reg: m.reg ? { id: m.reg.id, code: m.reg.code, team: m.reg.team, event: m.reg.eventTitle, amountDue: m.reg.amountDue, paymentStatus: m.reg.paymentStatus } : null,
  }))
  logger.audit(actor, 'PAYMENT_REPORT_PREVIEWED', 'EventRegistration', '-', { rows: rows.length })
  return json({ results })
}
