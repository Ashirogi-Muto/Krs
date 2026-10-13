import test from 'node:test'
import assert from 'node:assert/strict'
import { accountVerification, passwordReset, registrationConfirmation } from '../src/lib/email/templates'
import { DEFAULT_FORM_TEXTS } from '../src/lib/form-texts-defaults'

// Site settings → Logos & icons → "Logo at the top of the emails" (owner, 13 Oct 2026): empty = the AURIX logo
test('emails: the CMS logo when set, the AURIX logo otherwise', () => {
  const t = DEFAULT_FORM_TEXTS.emails
  const logo = 'https://kalamroboticssociety.com/api/media/file/our-logo.png'
  const mails = (texts: any) => [
    passwordReset({ name: 'A', url: 'https://x.invalid/r', expiresMinutes: 30 }, texts).html,
    accountVerification({ name: 'A', url: 'https://x.invalid/v', expiresHours: 24, deleteOn: '20 Oct' }, texts).html,
    registrationConfirmation(
      { registrationCode: 'AX26-HAC-ABC123', teamName: 'T', leaderName: 'A', leaderEmail: 'a@x.invalid', leaderPhone: '1', college: 'C', members: [], event: { title: 'E', slug: 'e', startDate: '2026-10-27', endDate: '2026-10-27', venue: 'V' } } as any,
      texts,
    ).html,
  ]
  for (const html of mails({ ...t, logoUrl: logo })) {
    assert.ok(html.includes(`src="${logo}"`))
    assert.ok(!html.includes('/images/aurix-logo.png'))
  }
  for (const html of mails(t)) assert.ok(html.includes('/images/aurix-logo.png'))
  // A logo URL is escaped like every other value
  assert.ok(!mails({ ...t, logoUrl: 'https://x.invalid/a"onerror="x' })[0].includes('"onerror="'))
})
