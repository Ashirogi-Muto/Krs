import test from 'node:test'
import assert from 'node:assert/strict'
import { displayMobile, indianMobile, istShort, showsExtension, usableContacts, whatsappLink } from '../src/lib/event-contacts'
import { offerFor, siteOfferFor, type AdvertisedCoupon } from '../src/lib/offer-rules'

// Competition pages (owner, 17 Oct 2026): deadline-extended heading, registration offer, Contact Us pop-up

test('contacts: Indian mobile numbers in any common spelling, WhatsApp link with +91 and the first message', () => {
  for (const v of ['9876543210', '+91 98765 43210', '+91-98765-43210', '919876543210', '09876543210', ' (98765) 43210 ']) assert.equal(indianMobile(v), '9876543210', v)
  for (const v of ['', '12345', '5876543210', '98765432100', '+1 9876543210', 'abc', null]) assert.equal(indianMobile(v), null, String(v))
  assert.equal(displayMobile('9876543210'), '+91 98765 43210')
  assert.equal(whatsappLink('9876543210'), 'https://wa.me/919876543210')
  assert.equal(whatsappLink('9876543210', 'Hi, a question about Hackathon & BGMI?'), 'https://wa.me/919876543210?text=Hi%2C%20a%20question%20about%20Hackathon%20%26%20BGMI%3F')
  assert.deepEqual(usableContacts([{ name: ' Asha ', role: '', phone: '+91 98765 43210' }, { name: 'No number', phone: '123' }, { name: '', phone: '9876543210' }, null]), [
    { name: 'Asha', role: undefined, phone: '9876543210' },
  ])
  assert.deepEqual(usableContacts(undefined), [])
})

test('deadline extended: only when ticked, registration open and the real close still ahead', () => {
  const now = new Date('2026-10-20T00:00:00Z')
  const open = { deadlineExtended: true, status: 'REGISTRATION_OPEN', registrationClose: '2026-10-23T18:29:59.000Z' }
  assert.equal(showsExtension(open, now), true)
  assert.equal(showsExtension({ ...open, deadlineExtended: false }, now), false)
  assert.equal(showsExtension({ ...open, status: 'REGISTRATION_CLOSED' }, now), false)
  assert.equal(showsExtension(open, new Date('2026-10-23T18:30:00Z')), false)
  assert.equal(showsExtension({ ...open, registrationClose: '' }, now), false)
  assert.equal(istShort('2026-10-23T18:29:59.000Z'), '23 Oct, 11:59 PM')
})

test('offer: shown only where checkout would accept the coupon now; % shown only when exact', () => {
  const AURIX20: AdvertisedCoupon = { id: 2, code: 'AURIX20', active: true, type: 'PERCENT', percent: 20, expiresAt: '2026-10-20T18:00:00.000Z', events: [1, 2, 3, 4, 5] }
  const now = new Date('2026-10-17T10:00:00Z')
  const ad = { coupon: AURIX20, uses: 3 }
  assert.deepEqual(offerFor(ad, { id: '1', registrationFee: 749 }, now), { code: 'AURIX20', percent: 20, discount: 150, final: 599, expiresAt: '2026-10-20T18:00:00.000Z' })
  assert.equal(offerFor(ad, { id: '6', registrationFee: 99 }, now), null, 'BGMI is not covered')
  assert.equal(offerFor(ad, { id: '1', registrationFee: 749 }, new Date('2026-10-20T18:00:00Z')), null, 'expired')
  assert.equal(offerFor({ coupon: { ...AURIX20, active: false }, uses: 0 }, { id: '1', registrationFee: 749 }, now), null, 'switched off')
  assert.equal(offerFor({ coupon: { ...AURIX20, usageLimit: 3 }, uses: 3 }, { id: '1', registrationFee: 749 }, now), null, 'used up')
  assert.equal(offerFor({ coupon: { ...AURIX20, startsAt: '2026-10-18T00:00:00Z' }, uses: 0 }, { id: '1', registrationFee: 749 }, now), null, 'not started')
  assert.equal(offerFor(null, { id: '1', registrationFee: 749 }, now), null)
  assert.equal(offerFor(ad, { id: '1', registrationFee: null }, now), null)
  // A capped coupon is never shown as more than the team gets
  const capped = offerFor({ coupon: { ...AURIX20, discountCap: 100 }, uses: 0 }, { id: '1', registrationFee: 749 }, now)
  assert.deepEqual(capped && [capped.percent, capped.discount, capped.final], [null, 100, 649])
})

test('site strip (AURIX home, Competitions): the live coupon with an exact headline, nothing when it is not live or capped', () => {
  const now = new Date('2026-10-17T10:00:00Z')
  const c: AdvertisedCoupon = { id: 2, code: 'AURIX20', active: true, type: 'PERCENT', percent: 20, expiresAt: '2026-10-20T18:00:00.000Z' }
  assert.deepEqual(siteOfferFor({ coupon: c, uses: 3 }, now), { code: 'AURIX20', percent: 20, amount: null })
  assert.deepEqual(siteOfferFor({ coupon: { ...c, type: 'FLAT', amount: 100 }, uses: 0 }, now), { code: 'AURIX20', percent: null, amount: 100 })
  assert.equal(siteOfferFor({ coupon: c, uses: 0 }, new Date('2026-10-21T00:00:00Z')), null, 'expired')
  assert.equal(siteOfferFor({ coupon: { ...c, active: false }, uses: 0 }, now), null, 'switched off')
  assert.equal(siteOfferFor({ coupon: { ...c, usageLimit: 3 }, uses: 3 }, now), null, 'used up')
  assert.equal(siteOfferFor({ coupon: { ...c, discountCap: 100 }, uses: 0 }, now), null, 'capped: never overstated')
  assert.equal(siteOfferFor(null, now), null)
})
