import crypto from 'node:crypto'
import type { Payload } from 'payload'
import { deleteObject, headObject, isR2Configured, readRange, signedPutUrl } from './r2'
import { checkReceipt, cleanFilename, cleanPaymentId, realReceiptType, signReceiptToken, verifyReceiptToken } from './receipt-rules'
import { leaderRegistrations } from './submissions'
import { logger } from './logger'

/**
 * Payment receipts for the logged-in team leader (/aurix/payment-done). Files go straight from the browser to the
 * private R2 bucket (`receipts/<event>/<code>/<uuid>.<ext>`) through a signed link fixing size and type; the server
 * then checks the stored file's real type. One receipt per registration; a new one replaces (and deletes) the old.
 * Error results are keys of the CMS wording (Labels & messages → Payment receipt).
 */
export type ReceiptError = 'errNotConfigured' | 'errNoTeam' | 'errType' | 'errSize' | 'errPaymentId' | 'errUpload' | 'errContent'

type User = { id: number | string; email?: string }
const secret = () => process.env.PAYLOAD_SECRET || ''
const ACTIVE = ['PENDING', 'CONFIRMED']

/** The user's registrations that take a receipt (they lead it; not cancelled or rejected). */
export async function receiptRegistrations(payload: Payload, user: User) {
  return (await leaderRegistrations(payload, user)).filter((r) => ACTIVE.includes(String(r.status)))
}

async function own(payload: Payload, user: User, code: unknown) {
  const c = String(code || '').trim().toUpperCase()
  return (await receiptRegistrations(payload, user)).find((r) => r.registrationCode === c) || null
}

/** Step 1: a 10-minute signed upload link + token. */
export async function startReceiptUpload(payload: Payload, user: User, body: any, now = new Date()) {
  if (!isR2Configured()) return { error: 'errNotConfigured' as const }
  const reg = await own(payload, user, body?.code)
  if (!reg) return { error: 'errNoTeam' as const }
  const check = checkReceipt(String(body?.filename || ''), body?.size)
  if (!check.ok) return { error: (check.reason === 'type' ? 'errType' : 'errSize') as ReceiptError }
  const slug = reg.event && typeof reg.event === 'object' ? String(reg.event.slug || 'event') : 'event'
  const key = `receipts/${slug}/${reg.registrationCode}/${crypto.randomUUID()}.${check.ext}`
  const url = await signedPutUrl(key, check.contentType, body.size)
  const token = signReceiptToken(
    { r: Number(reg.id), k: key, s: body.size, e: check.ext, f: cleanFilename(String(body.filename)), iat: now.getTime(), exp: now.getTime() + 30 * 60_000 },
    secret(),
  )
  return { url, token, contentType: check.contentType }
}

/** Step 2: check the stored file and record it on the registration (replacing an earlier receipt). */
export async function saveReceipt(payload: Payload, user: User, body: any, now = new Date()) {
  if (!isR2Configured()) return { error: 'errNotConfigured' as const }
  const reg = await own(payload, user, body?.code)
  if (!reg) return { error: 'errNoTeam' as const }
  const token = verifyReceiptToken(body?.token, secret(), now.getTime())
  if (!token || token.r !== Number(reg.id)) return { error: 'errUpload' as const }
  const paymentId = cleanPaymentId(body?.paymentId)
  if (paymentId === false) return { error: 'errPaymentId' as const }
  const head = await headObject(token.k)
  if (!head || head.size !== token.s) {
    if (head) await deleteObject(token.k).catch(() => undefined)
    return { error: 'errUpload' as const }
  }
  if (!realReceiptType(token.e, await readRange(token.k, 'bytes=0-15'))) {
    await deleteObject(token.k).catch(() => undefined)
    logger.warn(`Receipt refused (content does not match .${token.e}): ${reg.registrationCode}`)
    return { error: 'errContent' as const }
  }
  const oldKey = reg.receiptKey as string | undefined
  await payload.update({
    collection: 'event-registrations',
    id: reg.id,
    overrideAccess: true,
    data: {
      receiptKey: token.k,
      receiptFilename: token.f,
      receiptSize: token.s,
      receiptType: head.contentType || '',
      receiptUploadedAt: now.toISOString(),
      // The team's own entry (or the one Razorpay put in the return link): shown to staff as unverified
      ...(paymentId ? { receiptPaymentId: paymentId } : {}),
    } as any,
  })
  if (oldKey && oldKey !== token.k) await deleteObject(oldKey).catch((err) => logger.error(`Old receipt not deleted (${oldKey}): ${err?.message || err}`))
  logger.audit(String(user.email || user.id), oldKey ? 'RECEIPT_REPLACED' : 'RECEIPT_UPLOADED', 'EventRegistration', String(reg.registrationCode), { size: token.s, type: token.e })
  return { ok: true as const }
}
