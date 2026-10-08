import test from 'node:test'
import assert from 'node:assert/strict'
import { ipKey, clientIp } from '../src/lib/rateLimit'
import { PERSON_NAME, accountRequired } from '../src/lib/auth/participant'
import { isSafeHref } from '../src/payload/fields/common'
import { Users } from '../src/payload/collections/Users'

// Security fixes of 7 Oct 2026 (docs/SECURITY_FIX_PLAN.md)

test('rate-limit keys: IPv6 is bucketed by /64, IPv4 unchanged', async (t) => {
  await t.test('IPv4 stays as it is', () => assert.equal(ipKey('203.0.113.7'), '203.0.113.7'))
  await t.test('two addresses in one /64 share a key', () => {
    assert.equal(ipKey('2401:4900:81f8:238:e8b6:dfff:fe1c:f5a9'), '2401:4900:81f8:238::/64')
    assert.equal(ipKey('2401:4900:81f8:238::1'), '2401:4900:81f8:238::/64')
  })
  await t.test('different /64 networks get different keys', () =>
    assert.notEqual(ipKey('2401:4900:81f8:238::1'), ipKey('2401:4900:81f8:239::1')))
  await t.test('compressed forms and leading zeros are normalised', () => {
    assert.equal(ipKey('2001:db8::1'), '2001:db8:0:0::/64')
    assert.equal(ipKey('2001:0db8:0000:0000:0000:0000:0000:0001'), '2001:db8:0:0::/64')
    assert.equal(ipKey('[2001:DB8::1]'), '2001:db8:0:0::/64')
  })
  await t.test('IPv4-mapped IPv6 becomes the IPv4 address', () => assert.equal(ipKey('::ffff:198.51.100.4'), '198.51.100.4'))
  await t.test('garbage is kept as-is (still a key), empty is "unknown"', () => {
    assert.equal(ipKey('not-an-ip'), 'not-an-ip')
    assert.equal(ipKey(''), 'unknown')
  })
  await t.test('clientIp applies the bucketing to X-Real-IP', () => {
    const req = new Request('https://example.test/', { headers: { 'x-real-ip': '2401:4900:be8c:1fc5:2431:eeff:fee1:6388' } })
    assert.equal(clientIp(req), '2401:4900:be8c:1fc5::/64')
  })
})

test('account names: letters (any language), spaces and . \' - only', async (t) => {
  for (const ok of ['Shivam Kumar', 'Ananya', "D'Souza", 'K. R. Sharma', 'Anne-Marie', 'शिवम कुमार', 'José Álvarez'])
    await t.test(`accepts ${ok}`, () => assert.ok(PERSON_NAME.test(ok)))
  for (const bad of ['A', 'http://evil.example', 'Win ₹5000 now', 'name<script>', 'x'.repeat(81), ' leading', 'evil.example/login', '12345'])
    await t.test(`refuses ${JSON.stringify(bad.slice(0, 30))}`, () => assert.equal(PERSON_NAME.test(bad), false))
})

test('team registration needs an account unless AURIX_REQUIRE_ACCOUNT=0', () => {
  const before = process.env.AURIX_REQUIRE_ACCOUNT
  try {
    delete process.env.AURIX_REQUIRE_ACCOUNT
    assert.equal(accountRequired(), true, 'unset = required (fail closed)')
    process.env.AURIX_REQUIRE_ACCOUNT = '1'
    assert.equal(accountRequired(), true)
    process.env.AURIX_REQUIRE_ACCOUNT = '0'
    assert.equal(accountRequired(), false)
  } finally {
    if (before === undefined) delete process.env.AURIX_REQUIRE_ACCOUNT
    else process.env.AURIX_REQUIRE_ACCOUNT = before
  }
})

test('footer social links use the same link check as other CMS links', () => {
  assert.ok(isSafeHref('https://instagram.com/krs'))
  assert.ok(isSafeHref('mailto:contact@kalamroboticssociety.com'))
  assert.equal(isSafeHref('javascript:alert(1)'), false)
  assert.equal(isSafeHref('data:text/html,hi'), false)
  assert.equal(isSafeHref('//evil.example'), false)
})

test('Users: email and password changes over Payload REST', async (t) => {
  const beforeChange = Users.hooks!.beforeChange![0] as any
  const participant = { id: 9, role: 'PARTICIPANT' }
  const admin = { id: 1, role: 'ADMIN' }
  const original = { id: 9, email: 'me@example.com', role: 'PARTICIPANT' }
  const run = (user: any, payloadAPI: string, data: any) =>
    beforeChange({ data, operation: 'update', originalDoc: original, req: { user, payloadAPI, context: {} } })

  await t.test('a participant cannot move their account to another address', async () => {
    await assert.rejects(run(participant, 'REST', { email: 'victim@example.com' }), /changed by an admin/)
    await assert.rejects(run(participant, 'GraphQL', { email: 'victim@example.com' }), /changed by an admin/)
  })
  await t.test('saving the same address (any case) is fine', async () => {
    await run(participant, 'REST', { email: 'ME@example.com', name: 'Me' })
  })
  await t.test('admins may change an email', async () => {
    await run(admin, 'REST', { email: 'new@example.com' })
  })
  await t.test('server code (local API) is not affected', async () => {
    await run(participant, 'local', { email: 'other@example.com' })
  })
  await t.test('participants cannot set a password over REST (portal profile asks for the current one)', async () => {
    await assert.rejects(run(participant, 'REST', { password: 'new-password-123' }), /portal profile/)
    await run(participant, 'local', { password: 'new-password-123' })
  })
  await t.test('staff can still change their own password in the CMS', async () => {
    await beforeChange({
      data: { password: 'new-password-123' },
      operation: 'update',
      originalDoc: { id: 3, email: 's@example.com', role: 'STAFF' },
      req: { user: { id: 3, role: 'STAFF', roles: ['MEDIA'] }, payloadAPI: 'REST', context: {} },
    })
  })
  await t.test('email field: only admins have update access', () => {
    const email = (Users.fields as any[]).find((f) => f.name === 'email')
    assert.ok(email, 'email field override present')
    assert.equal(email.access.update({ req: { user: participant } }), false)
    assert.equal(email.access.update({ req: { user: { role: 'STAFF', roles: ['MEDIA'] } } }), false)
    assert.equal(email.access.update({ req: { user: admin } }), true)
  })
  await t.test('sessions last 24 hours', () => assert.equal((Users.auth as any).tokenExpiration, 24 * 60 * 60))
})

test("Users: Payload's own login / forgot-password endpoints", async (t) => {
  const beforeOperation = Users.hooks!.beforeOperation![0] as any
  const headers = (ip: string) => new Headers({ 'x-real-ip': ip })
  await t.test('REST forgot-password is refused (our /forgot-password page sends the email)', async () => {
    await assert.rejects(beforeOperation({ args: {}, operation: 'forgotPassword', req: { payloadAPI: 'REST', headers: headers('198.51.100.1') } }), /forgot-password/)
  })
  await t.test('our own route (local API) may still create reset tokens', async () => {
    const args = { data: { email: 'a@b.c' } }
    assert.equal(await beforeOperation({ args, operation: 'forgotPassword', req: { payloadAPI: 'local', headers: new Headers() } }), args)
  })
  await t.test('REST login: 10 per minute per network, then 429', async () => {
    const ip = '2001:db8:aaaa:1::5'
    for (let i = 0; i < 10; i++) await beforeOperation({ args: {}, operation: 'login', req: { payloadAPI: 'REST', headers: headers(ip) } })
    // another address in the same /64 shares the limit
    await assert.rejects(beforeOperation({ args: {}, operation: 'login', req: { payloadAPI: 'REST', headers: headers('2001:db8:aaaa:1::99') } }), /Too many login attempts/)
  })
})
