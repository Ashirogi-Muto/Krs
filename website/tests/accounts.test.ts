import test from 'node:test'
import assert from 'node:assert/strict'
import { CONFIRMATIONS_PER_DAY, RESEND_COOLDOWN_MS, checkResend, resendRefusal } from '../src/lib/auth/resend-policy'
import { hashToken, safeNext } from '../src/lib/auth/participant'

const now = new Date('2026-10-04T06:00:00Z')
const ago = (ms: number) => new Date(now.getTime() - ms)
const MIN = 60_000
const HOUR = 3_600_000

test('confirmation emails: 2 per account per rolling 24 h, 2 minutes apart', async (t) => {
  await t.test('the limit is 2 (sign-up email + one resend)', () => assert.equal(CONFIRMATIONS_PER_DAY, 2))

  await t.test('first email of the day is allowed', () => assert.deepEqual(checkResend([], now), { ok: true }))

  await t.test('a resend within 2 minutes of the last email is refused (cooldown)', () => {
    const d = checkResend([ago(30_000)], now)
    assert.equal(d.ok, false)
    assert.equal(d.ok === false && d.reason, 'cooldown')
    assert.equal(d.ok === false && d.retryAt.getTime(), ago(30_000).getTime() + RESEND_COOLDOWN_MS)
  })

  await t.test('one resend is allowed after the cooldown', () => assert.deepEqual(checkResend([ago(3 * MIN)], now), { ok: true }))

  await t.test('a third email within 24 h is refused until the oldest one is 24 h old', () => {
    const d = checkResend([ago(10 * HOUR), ago(2 * HOUR)], now)
    assert.equal(d.ok === false && d.reason, 'daily')
    assert.equal(d.ok === false && d.retryAt.toISOString(), new Date(ago(10 * HOUR).getTime() + 24 * HOUR).toISOString())
  })

  await t.test('emails older than 24 h no longer count', () => assert.deepEqual(checkResend([ago(25 * HOUR), ago(30 * HOUR)], now), { ok: true }))

  await t.test('4 emails in 90 s (the 3 Oct case) block further resends for the day', () => {
    const d = checkResend([ago(10 * HOUR), ago(10 * HOUR - 5_000), ago(10 * HOUR - 41_000), ago(10 * HOUR - 83_000)], now)
    assert.equal(d.ok === false && d.reason, 'daily')
  })

  await t.test('dates in the future or invalid are ignored', () => assert.deepEqual(checkResend([new Date('x'), new Date(now.getTime() + HOUR)], now), { ok: true }))

  await t.test('refusal messages tell the participant when to try again', () => {
    assert.match(resendRefusal({ ok: false, reason: 'cooldown', retryAt: new Date(now.getTime() + 90_000) }, now), /2 minutes/)
    assert.match(resendRefusal({ ok: false, reason: 'cooldown', retryAt: new Date(now.getTime() + 20_000) }, now), /20 seconds/)
    assert.match(resendRefusal({ ok: false, reason: 'daily', retryAt: new Date('2026-10-04T19:11:00Z') }, now), /2 confirmation emails.*5 Oct.*IST/)
  })
})

test('confirmation tokens and redirects', async (t) => {
  await t.test('only the sha256 of a token is stored', () => {
    const h = hashToken('abc')
    assert.equal(h, 'ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad')
    assert.notEqual(hashToken('abd'), h)
  })
  await t.test('safeNext allows only paths on this site', () => {
    assert.equal(safeNext('/aurix/register?event=robo-soccer'), '/aurix/register?event=robo-soccer')
    assert.equal(safeNext('https://evil.example'), '/aurix/portal')
    assert.equal(safeNext('//evil.example'), '/aurix/portal')
    assert.equal(safeNext('/\\evil.example'), '/aurix/portal')
    assert.equal(safeNext(undefined), '/aurix/portal')
  })
})
