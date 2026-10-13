import test from 'node:test'
import assert from 'node:assert/strict'
import { rateLimit, rateLimitUser } from '../src/lib/rateLimit'
import { isSameOrigin } from '../src/lib/auth/same-origin'
import { Projects, Posts, Resources, People, GalleryAlbums } from '../src/payload/collections/Content'
import { presetRoles } from './helpers/presets'

test('rateLimit enforces bucket bounds and resets after window expiry', async () => {
  const key = `test-ip-${Date.now()}`
  assert.equal(rateLimit(key, 2, 50), true)
  assert.equal(rateLimit(key, 2, 50), true)
  assert.equal(rateLimit(key, 2, 50), false) // limit exceeded

  // Wait for window to expire
  await new Promise((resolve) => setTimeout(resolve, 60))
  assert.equal(rateLimit(key, 2, 50), true) // reset
})

test('rateLimitUser scopes limits per user account ID and action', () => {
  const ts = Date.now()
  const userA = `user-a-${ts}`
  const userB = `user-b-${ts}`

  assert.equal(rateLimitUser(userA, 'export', 1, 1000), true)
  assert.equal(rateLimitUser(userA, 'export', 1, 1000), false) // User A hit limit

  // User B performing same action is independent
  assert.equal(rateLimitUser(userB, 'export', 1, 1000), true)

  // User A performing different action is independent
  assert.equal(rateLimitUser(userA, 'check-in', 1, 1000), true)

  // Null/undefined userId bypasses (handled as no-op)
  assert.equal(rateLimitUser(null, 'export', 1, 1000), true)
})

test('isSameOrigin validates trusted origins and rejects cross-site spoofing', () => {
  const origEnv = process.env.NEXT_PUBLIC_SITE_URL
  process.env.NEXT_PUBLIC_SITE_URL = 'https://kalamroboticssociety.com/'

  try {
    // 1. Exact match with configured site
    const req1 = new Request('https://kalamroboticssociety.com/api/test', {
      method: 'POST',
      headers: { origin: 'https://kalamroboticssociety.com' },
    })
    assert.equal(isSameOrigin(req1), true)

    // 2. www variant match
    const req2 = new Request('https://kalamroboticssociety.com/api/test', {
      method: 'POST',
      headers: { origin: 'https://www.kalamroboticssociety.com' },
    })
    assert.equal(isSameOrigin(req2), true)

    // 3. Self origin match (matching req.url)
    const req3 = new Request('https://portal.kalamroboticssociety.com/api/test', {
      method: 'POST',
      headers: { origin: 'https://portal.kalamroboticssociety.com' },
    })
    assert.equal(isSameOrigin(req3), true)

    // 4. Untrusted / attacker origin rejected
    const req4 = new Request('https://kalamroboticssociety.com/api/test', {
      method: 'POST',
      headers: { origin: 'https://evil-attacker.com' },
    })
    assert.equal(isSameOrigin(req4), false)

    // 5. Missing origin header rejected
    const req5 = new Request('https://kalamroboticssociety.com/api/test', {
      method: 'POST',
    })
    assert.equal(isSameOrigin(req5), false)

    // 6. Subdomain takeover / rogue domain rejected
    const req6 = new Request('https://kalamroboticssociety.com/api/test', {
      method: 'POST',
      headers: { origin: 'https://kalamroboticssociety.com.attacker.org' },
    })
    assert.equal(isSameOrigin(req6), false)
  } finally {
    process.env.NEXT_PUBLIC_SITE_URL = origEnv
  }
})

test('Content collections enforce draft read protection for anonymous visitors', () => {
  const collections = [Projects, Posts, Resources, People, GalleryAlbums]

  for (const col of collections) {
    assert.ok(col.access?.read, `Collection ${col.slug} must define read access`)
    const readFn = col.access.read as Function

    // Anonymous visitor: must filter to published: true
    const anonResult = readFn({ req: { user: null } })
    assert.deepEqual(anonResult, { published: { equals: true } }, `Collection ${col.slug} must filter drafts for anonymous visitors`)

    // Participant: must filter to published: true
    const participantResult = readFn({ req: { user: { role: 'PARTICIPANT' } } })
    assert.deepEqual(participantResult, { published: { equals: true } }, `Collection ${col.slug} must filter drafts for participants`)

    // Admin: gets unrestricted read access (true)
    const adminResult = readFn({ req: { user: { role: 'ADMIN' } } })
    assert.equal(adminResult, true, `Collection ${col.slug} must grant full read to admin`)

    // Media & outreach editor: gets unrestricted read access (true)
    const editorResult = readFn({ req: { user: { role: 'STAFF', accessRoles: presetRoles('MEDIA') } } })
    assert.equal(editorResult, true, `Collection ${col.slug} must grant full read to media editors`)
  }
})
