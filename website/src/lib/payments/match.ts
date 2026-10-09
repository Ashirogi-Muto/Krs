/**
 * Matching Razorpay payment-report rows to AURIX registrations.
 * The Razorpay Payment Page has no field for our registration code, so a payment matches a registration on
 * leader email + leader phone + event (Payment event label) + amount. Pure functions; unit-tested.
 */
export type PaymentRow = {
  paymentId: string
  email: string
  phone: string
  amount: number | null
  event: string
  status: string
  paidAt?: string
}
export type RegForMatch = {
  id: number | string
  code: string
  team: string
  leaderEmail: string
  leaderPhone: string
  eventLabel: string // the event's "Payment event label" (Razorpay dropdown text)
  eventTitle: string
  amountDue: number | null
  paymentStatus: string
  paymentReference?: string | null
}
export type MatchKind = 'MATCH' | 'ALREADY_RECORDED' | 'CHECK' | 'NO_MATCH' | 'NOT_PAID' | 'DUPLICATE'
export type MatchResult = {
  row: PaymentRow
  kind: MatchKind
  reg?: RegForMatch
  reasons: string[] // what did not line up (for CHECK) or why it was skipped
}

export const normEmail = (s: string) => (s || '').trim().toLowerCase()
/** Last 10 digits (drops +91 / 0 prefixes, spaces and dashes). */
export const normPhone = (s: string) => (s || '').replace(/\D/g, '').slice(-10)
export const normLabel = (s: string) => (s || '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim()
/** "₹ 1,499.00", "1499", "149900" (paise if `paise`) -> rupees */
export const parseAmount = (s: string | number, paise = false): number | null => {
  if (typeof s === 'number') return paise ? s / 100 : s
  const n = Number(String(s || '').replace(/[^0-9.]/g, ''))
  if (!String(s || '').match(/\d/) || Number.isNaN(n)) return null
  return paise ? n / 100 : n
}
const PAID = new Set(['captured', 'paid', 'success', 'successful', 'settled', 'authorized'])
export const isPaidStatus = (s: string) => !s || PAID.has(s.trim().toLowerCase())

/** Guess which report column holds which value from the header names. */
export function guessColumns(headers: string[]): Partial<Record<keyof PaymentRow, string>> {
  const find = (...tests: RegExp[]) => {
    for (const t of tests) {
      const h = headers.find((x) => t.test(x.trim().toLowerCase()))
      if (h) return h
    }
    return undefined
  }
  // Razorpay Payment Page report (9 Oct 2026): "payment id", "email", "phone", "total payment amount",
  // "select_event-" (our dropdown), "payment status", "payment date"; "item name" is always "Amount", never the event
  return {
    paymentId: find(/^payment.?id$/, /^id$/, /^razorpay.?payment.?id$/, /payment.?id/, /transaction.?id/),
    email: find(/^email$/, /e-?mail/),
    phone: find(/^(contact|phone|mobile)( number)?$/, /phone|mobile|contact/),
    amount: find(/^amount$/, /^total.?payment.?amount$/, /total.*amount/, /amount.*(inr|rs|₹)/, /payment.?amount/, /amount/),
    event: find(/select.?event/, /event|competition|category/, /select/, /item|product/),
    status: find(/^status$/, /payment.?status/, /status/),
    paidAt: find(/^created.?at$/, /^payment.?date$/, /captured|paid.?at|date/),
  }
}

/**
 * Classify each payment:
 *   MATCH             email + phone + event + amount all agree with exactly one unpaid registration
 *   ALREADY_RECORDED  that payment ID is already stored on a registration, or it fits a team verified earlier
 *                     by hand (Paid, no payment ID): reports are cumulative, so earlier days' payments come back daily
 *   CHECK             email or phone agrees but something else differs (reasons listed) — a person decides
 *   NOT_PAID          report status is failed / refunded / created
 *   DUPLICATE         same payment ID appears twice in the report, or a second payment for an already-matched team
 *   NO_MATCH          nothing agrees
 */
/** Wording of the reasons (CMS: Admin tools → Staff & admin texts → Payment matching). */
export type MatchReasonTexts = {
  whyDuplicateId: string
  whyStatus: string
  whyEmail: string
  whyPhone: string
  whyEvent: string
  whyAmount: string
  whyNoContact: string
  whyAlreadyPaid: string
  whyTwice: string
  whyVerifiedByHand: string
}
export const DEFAULT_REASONS: MatchReasonTexts = {
  whyDuplicateId: 'Same payment ID appears earlier in this report',
  whyStatus: 'Status "{status}"',
  whyEmail: 'email differs',
  whyPhone: 'phone differs',
  whyEvent: 'event "{paid}" ≠ "{due}"',
  whyAmount: 'amount ₹{paid} ≠ due ₹{due}',
  whyNoContact: 'No registration with this email or phone',
  whyAlreadyPaid: 'Team is already marked paid — possible second payment',
  whyTwice: '{count} registrations fit (same leader registered twice for this event?)',
  whyVerifiedByHand: 'Team was marked paid earlier without a payment ID',
}
const put = (s: string, v: Record<string, string | number>) => s.replace(/\{(\w+)\}/g, (m, k) => (k in v ? String(v[k]) : m))

export function matchPayments(rows: PaymentRow[], regs: RegForMatch[], W: MatchReasonTexts = DEFAULT_REASONS): MatchResult[] {
  const byRef = new Map(regs.filter((r) => r.paymentReference).map((r) => [String(r.paymentReference).trim(), r]))
  const seen = new Set<string>()
  const claimed = new Set<string | number>()
  const out: MatchResult[] = []

  for (const row of rows) {
    const pid = (row.paymentId || '').trim()
    if (pid && seen.has(pid)) {
      out.push({ row, kind: 'DUPLICATE', reasons: [W.whyDuplicateId] })
      continue
    }
    if (pid) seen.add(pid)
    if (pid && byRef.has(pid)) {
      out.push({ row, kind: 'ALREADY_RECORDED', reg: byRef.get(pid), reasons: [] })
      continue
    }
    if (!isPaidStatus(row.status)) {
      out.push({ row, kind: 'NOT_PAID', reasons: [put(W.whyStatus, { status: row.status })] })
      continue
    }
    const email = normEmail(row.email)
    const phone = normPhone(row.phone)
    const label = normLabel(row.event)
    const scored = regs
      .map((r) => {
        const misses: string[] = []
        const emailOk = !!email && normEmail(r.leaderEmail) === email
        const phoneOk = !!phone && normPhone(r.leaderPhone) === phone
        const eventOk = !!label && (normLabel(r.eventLabel) === label || normLabel(r.eventTitle) === label)
        const amountOk = row.amount !== null && r.amountDue !== null && Math.abs(row.amount - r.amountDue) < 0.01
        if (!emailOk) misses.push(W.whyEmail)
        if (!phoneOk) misses.push(W.whyPhone)
        if (!eventOk) misses.push(put(W.whyEvent, { paid: row.event, due: r.eventLabel || r.eventTitle }))
        if (!amountOk) misses.push(put(W.whyAmount, { paid: row.amount ?? '?', due: r.amountDue ?? '?' }))
        return { r, misses, contact: emailOk || phoneOk }
      })
      .filter((x) => x.contact)
      .sort((a, b) => a.misses.length - b.misses.length)

    if (!scored.length) {
      out.push({ row, kind: 'NO_MATCH', reasons: [W.whyNoContact] })
      continue
    }
    const perfect = scored.filter((x) => x.misses.length === 0)
    const open = perfect.filter((x) => x.r.paymentStatus !== 'PAID_VERIFIED' && !claimed.has(x.r.id))
    if (perfect.length && open.length === 1 && perfect.length === 1) {
      claimed.add(open[0].r.id)
      out.push({ row, kind: 'MATCH', reg: open[0].r, reasons: [] })
    } else if (perfect.length === 1 && !open.length && perfect[0].r.paymentStatus === 'PAID_VERIFIED' && !perfect[0].r.paymentReference && !claimed.has(perfect[0].r.id)) {
      // Verified by hand earlier: this payment is (almost certainly) that one, so it is not offered again
      claimed.add(perfect[0].r.id)
      out.push({ row, kind: 'ALREADY_RECORDED', reg: perfect[0].r, reasons: [W.whyVerifiedByHand] })
    } else if (perfect.length && !open.length) {
      out.push({ row, kind: 'DUPLICATE', reg: perfect[0].r, reasons: [W.whyAlreadyPaid] })
    } else if (perfect.length > 1) {
      out.push({ row, kind: 'CHECK', reg: open[0]?.r || perfect[0].r, reasons: [put(W.whyTwice, { count: perfect.length })] })
    } else {
      out.push({ row, kind: 'CHECK', reg: scored[0].r, reasons: scored[0].misses })
    }
  }
  return out
}

/** Minimal RFC 4180 CSV parser (quoted fields, commas/newlines inside quotes, BOM). */
export function parseCsv(text: string): string[][] {
  const rows: string[][] = []
  let row: string[] = []
  let field = ''
  let quoted = false
  const s = text.replace(/^﻿/, '')
  for (let i = 0; i < s.length; i++) {
    const c = s[i]
    if (quoted) {
      if (c === '"' && s[i + 1] === '"') {
        field += '"'
        i++
      } else if (c === '"') quoted = false
      else field += c
    } else if (c === '"') quoted = true
    else if (c === ',') {
      row.push(field)
      field = ''
    } else if (c === '\n' || c === '\r') {
      if (c === '\r' && s[i + 1] === '\n') i++
      row.push(field)
      if (row.some((x) => x.trim() !== '')) rows.push(row)
      row = []
      field = ''
    } else field += c
  }
  row.push(field)
  if (row.some((x) => x.trim() !== '')) rows.push(row)
  return rows
}
