import test from 'node:test'
import assert from 'node:assert/strict'
import { checkReceipt, cleanPaymentId, MAX_RECEIPT_BYTES, realReceiptType, receiptNeeded, signReceiptToken, verifyReceiptToken } from '../src/lib/receipt-rules'
import { orphanKeys, ORPHAN_AGE_MS } from '../src/lib/submission-sweep'

/** Payment receipts (owner, 10 Oct 2026): required after paying, evidence only, private R2, compressed photos. */
test('allowed types and size', () => {
  assert.deepEqual(checkReceipt('receipt.PDF', 1000), { ok: true, ext: 'pdf', contentType: 'application/pdf' })
  assert.deepEqual(checkReceipt('shot.jpeg', 1000), { ok: true, ext: 'jpg', contentType: 'image/jpeg' })
  assert.equal(checkReceipt('shot.png', 1000).ok, true)
  assert.equal(checkReceipt('shot.webp', 1000).ok, true)
  assert.deepEqual(checkReceipt('receipt.html', 1000), { ok: false, reason: 'type' })
  assert.deepEqual(checkReceipt('receipt.heic', 1000), { ok: false, reason: 'type' })
  assert.deepEqual(checkReceipt('receipt.pdf', MAX_RECEIPT_BYTES + 1), { ok: false, reason: 'size' })
  assert.deepEqual(checkReceipt('receipt.pdf', 0), { ok: false, reason: 'size' })
  assert.deepEqual(checkReceipt('receipt.pdf', '100'), { ok: false, reason: 'size' })
})

test('real type from the first bytes', () => {
  assert.equal(realReceiptType('pdf', Buffer.from('%PDF-1.7\n')), true)
  assert.equal(realReceiptType('jpg', Buffer.from([0xff, 0xd8, 0xff, 0xe0])), true)
  assert.equal(realReceiptType('png', Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])), true)
  assert.equal(realReceiptType('webp', Buffer.from('RIFF\0\0\0\0WEBPVP8 ')), true)
  assert.equal(realReceiptType('pdf', Buffer.from('<html><script>')), false)
  assert.equal(realReceiptType('jpg', Buffer.from('%PDF-1.7')), false)
})

test('payment ID entered by the team: optional, format-checked', () => {
  assert.equal(cleanPaymentId(''), null)
  assert.equal(cleanPaymentId(undefined), null)
  assert.equal(cleanPaymentId(' pay_TliMrFaqwnRUBn '), 'pay_TliMrFaqwnRUBn')
  assert.equal(cleanPaymentId('pay_<script>'), false)
  assert.equal(cleanPaymentId('order_123456'), false)
})

test('upload token: signed, bound to its secret, expires', () => {
  const t = { r: 7, k: 'receipts/hackathon/AX26-HAC-AAAAAA/x.pdf', s: 100, e: 'pdf', f: 'x.pdf', iat: 1000, exp: 2000 }
  const tok = signReceiptToken(t, 'secret')
  assert.deepEqual(verifyReceiptToken(tok, 'secret', 1500), t)
  assert.equal(verifyReceiptToken(tok, 'other', 1500), null)
  assert.equal(verifyReceiptToken(tok, 'secret', 2001), null)
  assert.equal(verifyReceiptToken(tok.replace(/^./, 'x'), 'secret', 1500), null)
})

test('who is asked for a receipt: active teams whose payment is not verified and who have none yet', () => {
  assert.equal(receiptNeeded({ status: 'PENDING', paymentStatus: 'AWAITING_PAYMENT' }), true)
  assert.equal(receiptNeeded({ status: 'PENDING', paymentStatus: 'PAID_VERIFIED' }), false) // exempt (owner)
  assert.equal(receiptNeeded({ status: 'PENDING', paymentStatus: 'AWAITING_PAYMENT', receiptUploadedAt: '2026-10-10T00:00:00Z' }), false)
  assert.equal(receiptNeeded({ status: 'CANCELLED', paymentStatus: 'AWAITING_PAYMENT' }), false)
})

test('leftover receipt files are swept like submission files', () => {
  const now = Date.now(), old = now - ORPHAN_AGE_MS - 1
  assert.deepEqual(orphanKeys([{ key: 'receipts/hackathon/A/1.jpg', modified: old }, { key: 'receipts/hackathon/A/2.jpg', modified: old }], new Set(['receipts/hackathon/A/1.jpg']), now), ['receipts/hackathon/A/2.jpg'])
})
