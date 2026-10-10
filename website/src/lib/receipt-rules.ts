import crypto from 'node:crypto'
import { cleanFilename, extOf } from './submission-rules'

/**
 * Razorpay payment receipts (owner, 10 Oct 2026): after paying, the team leader uploads the receipt (PDF) or a
 * screenshot; required, but a missing receipt only marks the team (staff decide). It is secondary evidence for the
 * payment and never marks a team paid. Pure rules, unit-tested (tests/receipts.test.ts).
 */
export const MAX_RECEIPT_BYTES = 5 * 1024 * 1024

/** Stored types; photos arrive as JPEG after the browser's resize, screenshots may stay PNG/WebP if that is smaller. */
export const RECEIPT_TYPES: Record<string, string> = {
  pdf: 'application/pdf',
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  png: 'image/png',
  webp: 'image/webp',
}

export type ReceiptCheck = { ok: true; ext: string; contentType: string } | { ok: false; reason: 'type' | 'size' }

export function checkReceipt(filename: string, size: unknown): ReceiptCheck {
  const ext = extOf(filename)
  if (!RECEIPT_TYPES[ext]) return { ok: false, reason: 'type' }
  if (!Number.isInteger(size) || (size as number) <= 0 || (size as number) > MAX_RECEIPT_BYTES) return { ok: false, reason: 'size' }
  return { ok: true, ext: ext === 'jpeg' ? 'jpg' : ext, contentType: RECEIPT_TYPES[ext] }
}

/** Real type from the first bytes of the stored file (a renamed file is refused). */
export function realReceiptType(ext: string, head: Buffer): boolean {
  if (ext === 'pdf') return head.subarray(0, 5).toString('latin1') === '%PDF-'
  if (ext === 'jpg') return head.length >= 3 && head[0] === 0xff && head[1] === 0xd8 && head[2] === 0xff
  if (ext === 'png') return head.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))
  if (ext === 'webp') return head.subarray(0, 4).toString('latin1') === 'RIFF' && head.subarray(8, 12).toString('latin1') === 'WEBP'
  return false
}

/** Razorpay payment IDs look like pay_XXXXXXXXXXXXXX; the team's own entry is optional and never trusted as proof. */
export const PAYMENT_ID_RE = /^pay_[A-Za-z0-9]{6,40}$/
export const cleanPaymentId = (v: unknown): string | null | false => {
  const s = String(v ?? '').trim()
  if (!s) return null
  return PAYMENT_ID_RE.test(s) ? s : false
}

/** Upload token (HMAC, 30 min): ties the signed R2 upload to one registration, key and size. */
export type ReceiptToken = { r: number; k: string; s: number; e: string; f: string; iat: number; exp: number }
const b64 = (b: Buffer) => b.toString('base64url')
const mac = (body: string, secret: string) => crypto.createHmac('sha256', `krs-receipt:${secret}`).update(body).digest()

export function signReceiptToken(t: ReceiptToken, secret: string): string {
  const body = b64(Buffer.from(JSON.stringify(t)))
  return `${body}.${b64(mac(body, secret))}`
}

export function verifyReceiptToken(token: unknown, secret: string, now = Date.now()): ReceiptToken | null {
  if (typeof token !== 'string' || token.length > 2000 || !secret) return null
  const [body, sig] = token.split('.')
  if (!body || !sig) return null
  const want = mac(body, secret)
  const got = Buffer.from(sig, 'base64url')
  if (got.length !== want.length || !crypto.timingSafeEqual(got, want)) return null
  try {
    const t = JSON.parse(Buffer.from(body, 'base64url').toString('utf8')) as ReceiptToken
    return t.exp >= now ? t : null
  } catch {
    return null
  }
}

export { cleanFilename }

/** Teams still asked for a receipt: active and payment not verified yet (verified teams are exempt, owner 10 Oct). */
export const receiptNeeded = (reg: { status?: string | null; paymentStatus?: string | null; receiptUploadedAt?: string | null }) =>
  ['PENDING', 'CONFIRMED'].includes(String(reg.status)) && reg.paymentStatus !== 'PAID_VERIFIED' && !reg.receiptUploadedAt
