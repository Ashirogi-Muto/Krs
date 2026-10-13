import test from 'node:test'
import assert from 'node:assert/strict'
import { COUPON_CODE_RE, checkApply, couponLimit, couponState, discountFor, maxDiscountOf, maxPercentOf, normalizeCode } from '../src/lib/coupon-rules'
import { canOnCoupon, grantCovers } from '../src/payload/access/coupons'
import { grantOf } from '../src/payload/access/permissions'

// Discount coupons (owner, 13 Oct 2026)
const NOW = new Date('2026-10-14T06:00:00Z')
const staff = (permissions: string[], extra: Record<string, unknown> = {}, roleExtra: Record<string, unknown> = {}) => ({
  id: 77,
  role: 'STAFF',
  accessRoles: { docs: [{ name: 'Coupons', permissions, eventLimit: 'all', ...roleExtra }] },
  ...extra,
})

test('codes: any case in, upper case stored; 3–30 letters, digits or dashes', () => {
  assert.equal(normalizeCode('  iilm-50 '), 'IILM-50')
  for (const ok of ['IIL', 'IILM-50', 'A1B2C3', 'X'.repeat(30)]) assert.ok(COUPON_CODE_RE.test(ok), ok)
  for (const bad of ['', 'AB', '-ABC', 'AB CD', 'AB_CD', 'ÄBC', 'X'.repeat(31), "AB'; drop"]) assert.ok(!COUPON_CODE_RE.test(bad), bad)
})

test('discount: percentage or flat, whole rupees, at least ₹1 to pay, never above the cap', () => {
  assert.equal(discountFor({ type: 'PERCENT', percent: 20 }, 749), 150) // 149.8 → 150
  assert.equal(discountFor({ type: 'PERCENT', percent: 99 }, 749), 742)
  assert.equal(discountFor({ type: 'FLAT', amount: 100 }, 499), 100)
  assert.equal(discountFor({ type: 'FLAT', amount: 5000 }, 499), 498, 'a team always pays at least ₹1')
  assert.equal(discountFor({ type: 'PERCENT', percent: 50, discountCap: 200 }, 749), 200, 'limit in force when a team member made it')
  assert.equal(discountFor({ type: 'FLAT', amount: 50 }, 1), 0)
  assert.equal(discountFor({ type: 'FLAT', amount: 50 }, NaN), 0)
  assert.equal(discountFor({ type: 'WHAT' as any, amount: 50 }, 499), 0)
})

test('status: off, not started, expired, used up, active (all controls optional)', () => {
  assert.equal(couponState({ active: true }, 0, NOW), 'ACTIVE')
  assert.equal(couponState({ active: false }, 0, NOW), 'OFF')
  assert.equal(couponState({ startsAt: '2026-10-15T00:00:00Z' }, 0, NOW), 'NOT_STARTED')
  assert.equal(couponState({ expiresAt: '2026-10-14T06:00:00Z' }, 0, NOW), 'EXPIRED', 'expires exactly now')
  assert.equal(couponState({ usageLimit: 2 }, 2, NOW), 'USED_UP')
  assert.equal(couponState({ usageLimit: 2 }, 1, NOW), 'ACTIVE')
})

test('applying: every refusal reason, and the amount the team then pays', () => {
  const c = { id: 1, active: true, type: 'PERCENT', percent: 10, events: [{ id: 1 }, 2] }
  assert.deepEqual(checkApply(null, 1, 749, 0, NOW), { ok: false, reason: 'notFound' })
  assert.deepEqual(checkApply({ ...c, active: false }, 1, 749, 0, NOW), { ok: false, reason: 'off' })
  assert.deepEqual(checkApply({ ...c, startsAt: '2026-11-01' }, 1, 749, 0, NOW), { ok: false, reason: 'notStarted' })
  assert.deepEqual(checkApply({ ...c, expiresAt: '2026-10-01' }, 1, 749, 0, NOW), { ok: false, reason: 'expired' })
  assert.deepEqual(checkApply({ ...c, usageLimit: 3 }, 1, 749, 3, NOW), { ok: false, reason: 'usedUp' })
  assert.deepEqual(checkApply(c, 5, 749, 0, NOW), { ok: false, reason: 'wrongEvent' })
  assert.deepEqual(checkApply(c, 1, 1, 0, NOW), { ok: false, reason: 'noDiscount' })
  assert.deepEqual(checkApply(c, { id: 2 }, 749, 0, NOW), { ok: true, discount: 75, final: 674 })
  assert.deepEqual(checkApply({ ...c, events: [] }, 9, 499, 0, NOW), { ok: true, discount: 50, final: 449 }, 'no competitions chosen = every competition')
})

test('largest discount one team can get: the most expensive competition the coupon covers', () => {
  const fees = new Map([['1', 749], ['2', 499], ['5', 399]])
  assert.equal(maxDiscountOf({ type: 'PERCENT', percent: 20 }, fees), 150)
  assert.equal(maxDiscountOf({ type: 'PERCENT', percent: 20, events: [2, 5] }, fees), 100)
  assert.equal(maxDiscountOf({ type: 'FLAT', amount: 1000, events: [5] }, fees), 398, 'capped by the fee (₹1 minimum)')
  assert.equal(maxDiscountOf({ type: 'FLAT', amount: 100 }, fees), 100)
})

test('coupon limit: site-wide required (₹ and/or %) and the ceiling; person and role ₹ limits only lower it; admins none', () => {
  const L = (amount: number | null, percent: number | null = null) => ({ amount, percent })
  assert.equal(couponLimit({ isAdmin: true, site: null }), null)
  assert.equal(couponLimit({ isAdmin: false, site: null }), 'NO_SITE_LIMIT')
  assert.equal(couponLimit({ isAdmin: false, site: 0, sitePercent: 0 }), 'NO_SITE_LIMIT')
  assert.deepEqual(couponLimit({ isAdmin: false, site: 300 }), L(300))
  assert.deepEqual(couponLimit({ isAdmin: false, site: null, sitePercent: 20 }), L(null, 20), 'a % limit alone is enough')
  assert.deepEqual(couponLimit({ isAdmin: false, site: null, sitePercent: 20, person: 100 }), L(100, 20))
  assert.deepEqual(couponLimit({ isAdmin: false, site: 300, person: 100 }), L(100))
  assert.deepEqual(couponLimit({ isAdmin: false, site: 300, person: 900 }), L(300), 'never above the site-wide limit')
  assert.deepEqual(couponLimit({ isAdmin: false, site: 300, roles: [50, 200, null] }), L(200), 'highest of the role limits that are set')
  assert.deepEqual(couponLimit({ isAdmin: false, site: 300, person: 150, roles: [200] }), L(150), 'strictest wins')
  assert.deepEqual(couponLimit({ isAdmin: false, site: 300, roles: [null, undefined] }), L(300))
  assert.deepEqual(couponLimit({ isAdmin: false, site: 300, person: 0 }), L(0))
})

test('% limit: percentage coupons by their %, flat ones against the cheapest competition they cover; enforced again when applied', () => {
  const fees = new Map([['1', 749], ['2', 499], ['5', 399]])
  assert.equal(maxPercentOf({ type: 'PERCENT', percent: 20 }, fees), 20)
  assert.equal(maxPercentOf({ type: 'FLAT', amount: 80 }, fees), (80 / 399) * 100, 'flat ₹80 is 20.05% of ₹399')
  assert.equal(maxPercentOf({ type: 'FLAT', amount: 80, events: [1] }, fees), (80 / 749) * 100)
  assert.equal(discountFor({ type: 'FLAT', amount: 150, percentCap: 20 }, 399), 79, '20% of ₹399 = ₹79.80 → ₹79')
  assert.equal(discountFor({ type: 'PERCENT', percent: 20, percentCap: 20 }, 749), 149, 'rounding never goes over the cap')
})

test('access: competition limits and "own" keys', () => {
  const all = staff(['coupons.view', 'coupons.editOwn'])
  const chosen = { id: 78, role: 'STAFF', accessRoles: { docs: [{ name: 'Hack', permissions: ['coupons.view', 'coupons.edit'], eventLimit: 'chosen', events: [1] }] } }
  const hackOnly = { events: [1], createdBy: 77 }
  const everywhere = { events: [], createdBy: 99 }
  assert.equal(canOnCoupon(all, 'coupons.view', everywhere), true)
  assert.equal(canOnCoupon(all, 'coupons.editOwn', everywhere), false, 'not theirs')
  assert.equal(canOnCoupon(all, 'coupons.editOwn', hackOnly), true)
  assert.equal(canOnCoupon(chosen, 'coupons.edit', hackOnly), true)
  assert.equal(canOnCoupon(chosen, 'coupons.edit', { events: [1, 2] }), false, 'also valid elsewhere')
  assert.equal(canOnCoupon(chosen, 'coupons.edit', everywhere), false, 'a coupon for every competition needs all events')
  assert.equal(canOnCoupon(chosen, 'coupons.delete', hackOnly), false, 'not held')
  assert.equal(canOnCoupon({ id: 1, role: 'ADMIN' }, 'coupons.deleteOwn', everywhere), true)
  assert.equal(canOnCoupon({ id: 1, role: 'PARTICIPANT' }, 'coupons.view', everywhere), false)
  assert.equal(grantCovers(grantOf(chosen, 'coupons.view'), []), false)
  assert.equal(grantCovers(grantOf(chosen, 'coupons.view'), ['1']), true)
})

test('saving a coupon: format, values, dates, competitions and the person\'s limit are checked on the server', async () => {
  const { Coupons } = await import('../src/payload/collections/Coupons')
  const hook = Coupons.hooks!.beforeChange![0] as any
  const req = (user: any, site: number | null = 300, pct: number | null = null) => ({
    user,
    payload: {
      findGlobal: async ({ slug }: any) => (slug === 'coupon-settings' ? { maxDiscount: site, maxPercent: pct } : {}),
      find: async ({ collection }: any) => (collection === 'events' ? { docs: [{ id: 1, registrationFee: 749 }, { id: 2, registrationFee: 499 }] } : { docs: [] }),
    },
  })
  const run = (user: any, data: any, site?: number | null, originalDoc?: any, pct?: number | null) => hook({ data: { ...data }, originalDoc, operation: originalDoc ? 'update' : 'create', req: req(user, site === undefined ? 300 : site, pct ?? null) })
  const creator = staff(['coupons.create', 'coupons.edit'])
  await assert.rejects(run(creator, { code: 'AB', type: 'PERCENT', percent: 10 }), /3–30 letters/)
  await assert.rejects(run(creator, { code: 'ABC', type: 'PERCENT', percent: 100 }), /1 to 99/)
  await assert.rejects(run(creator, { code: 'ABC', type: 'PERCENT', percent: 12.5 }), /1 to 99/)
  await assert.rejects(run(creator, { code: 'ABC', type: 'FLAT', amount: 0 }), /at least ₹1/)
  await assert.rejects(run(creator, { code: 'ABC', type: 'FLAT', amount: 50, usageLimit: 0 }), /usage limit/)
  await assert.rejects(run(creator, { code: 'ABC', type: 'FLAT', amount: 50, startsAt: '2026-10-20', expiresAt: '2026-10-19' }), /later than the start/)
  // Limit 300: 50% of the most expensive fee (₹749) is ₹375 → refused; 40% (₹300) is fine; limited to ₹499 events 50% (₹250) fine
  await assert.rejects(run(creator, { code: 'HALF', type: 'PERCENT', percent: 50 }), /up to ₹375 off a team, but your limit is ₹300/)
  const ok = await run(creator, { code: 'FORTY', type: 'PERCENT', percent: 40 })
  assert.equal(ok.discountCap, 300, 'the limit in force is stored with the coupon')
  assert.equal(ok.createdBy, 77)
  await assert.doesNotReject(run(creator, { code: 'HALF2', type: 'PERCENT', percent: 50, events: [2] }))
  // Person and role limits lower it
  await assert.rejects(run(staff(['coupons.create'], { couponMaxDiscount: 100 }), { code: 'C150', type: 'FLAT', amount: 150 }), /limit is ₹100/)
  await assert.rejects(run(staff(['coupons.create'], {}, { couponMaxDiscount: 120 }), { code: 'C150', type: 'FLAT', amount: 150 }), /limit is ₹120/)
  // No site-wide limit yet: team members can't make coupons at all
  await assert.rejects(run(creator, { code: 'ABC', type: 'FLAT', amount: 10 }, null), /site-wide coupon limit/)
  // % limit (owner: 20%): percentage above it refused; flat above 20% of the cheapest covered fee refused
  await assert.rejects(run(creator, { code: 'P25', type: 'PERCENT', percent: 25 }, null, undefined, 20), /your limit is 20% of the fee/)
  await assert.rejects(run(creator, { code: 'F80', type: 'FLAT', amount: 120 }, null, undefined, 20), /your limit is 20% of the fee/)
  const p20 = await run(creator, { code: 'P20', type: 'PERCENT', percent: 20, events: [2] }, null, undefined, 20)
  assert.equal(p20.percentCap, 20)
  assert.equal(p20.discountCap, null, 'no ₹ part when only a % limit is set')
  // Competitions outside the role
  const hackLead = { id: 80, role: 'STAFF', accessRoles: { docs: [{ name: 'H', permissions: ['coupons.create'], eventLimit: 'chosen', events: [1] }] } }
  await assert.rejects(run(hackLead, { code: 'ABC', type: 'FLAT', amount: 10 }), /competitions your access role covers/)
  await assert.rejects(run(hackLead, { code: 'ABC', type: 'FLAT', amount: 10, events: [1, 2] }), /competitions your access role covers/)
  await assert.doesNotReject(run(hackLead, { code: 'ABC', type: 'FLAT', amount: 10, events: [1] }))
  // "Edit own" can't change someone else's coupon
  const ownOnly = staff(['coupons.editOwn'])
  await assert.rejects(run(ownOnly, { percent: 5 }, 300, { code: 'X1Y', type: 'PERCENT', percent: 10, events: [], createdBy: 5 }), /competitions your access role covers/)
  await assert.doesNotReject(run(ownOnly, { percent: 5 }, 300, { code: 'X1Y', type: 'PERCENT', percent: 10, events: [], createdBy: 77 }))
  // Admins: no limit; the stored cap is cleared
  const admin = await run({ id: 1, role: 'ADMIN' }, { code: 'BIG', type: 'PERCENT', percent: 99 })
  assert.equal(admin.discountCap, null)
  assert.equal(admin.amount, null, 'the unused value is cleared')
})

test('limits on accounts and roles are set by admins only', async () => {
  const { Users } = await import('../src/payload/collections/Users')
  const { AccessRoles } = await import('../src/payload/collections/AccessRoles')
  const find = (fields: any[], name: string): any => fields.flatMap((f: any) => (f.name ? [f] : f.fields ? f.fields : [])).find((f: any) => f.name === name)
  for (const f of [find(Users.fields, 'couponMaxDiscount'), find(AccessRoles.fields, 'couponMaxDiscount')]) {
    assert.ok(f, 'field exists')
    for (const op of ['create', 'update']) {
      assert.equal(f.access[op]({ req: { user: { role: 'ADMIN' } } }), true)
      assert.equal(f.access[op]({ req: { user: staff(['accessRoles.manage', 'coupons.create']) } }), false)
    }
  }
})
