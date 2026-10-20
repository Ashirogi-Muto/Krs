import test from 'node:test'
import assert from 'node:assert/strict'
import { processOutbox, registrationEmailsOn } from '../src/lib/email/outbox'

// Owner, 20 Oct 2026: "turn off registration confirmation emails for now" (CMS → Website → Email settings).

const stub = (settings: unknown, calls: any[] = []) =>
  ({
    findGlobal: async () => {
      if (settings instanceof Error) throw settings
      return settings
    },
    // nothing due: the worker stops after counting (we only look at what it asked for)
    count: async (args: any) => (calls.push(args.where), { totalDocs: 0 }),
    find: async () => ({ docs: [] }),
  }) as any

test('switch: on by default, off only when unticked; unreadable settings keep emails on', async () => {
  assert.equal(await registrationEmailsOn(stub({})), true)
  assert.equal(await registrationEmailsOn(stub({ registrationConfirmations: true })), true)
  assert.equal(await registrationEmailsOn(stub({ registrationConfirmations: false })), false)
  assert.equal(await registrationEmailsOn(stub(new Error('db down'))), true)
})

test('worker: while off, registration confirmations stay in the queue; other emails are still sent', async () => {
  const env = { u: process.env.MAIL_USERNAME, p: process.env.MAIL_PASSWORD, f: process.env.MAIL_FROM }
  process.env.MAIL_USERNAME = 'test'
  process.env.MAIL_PASSWORD = 'test'
  process.env.MAIL_FROM = 'noreply@example.invalid'
  try {
    const off: any[] = []
    await processOutbox(stub({ registrationConfirmations: false }, off))
    const dueOff = JSON.stringify(off[0])
    assert.match(dueOff, /"kind":\{"not_equals":"REGISTRATION_CONFIRMATION"\}/)
    const on: any[] = []
    await processOutbox(stub({ registrationConfirmations: true }, on))
    assert.doesNotMatch(JSON.stringify(on[0]), /REGISTRATION_CONFIRMATION/)
  } finally {
    for (const [k, v] of [['MAIL_USERNAME', env.u], ['MAIL_PASSWORD', env.p], ['MAIL_FROM', env.f]] as const) {
      if (v === undefined) delete process.env[k]
      else process.env[k] = v
    }
  }
})
