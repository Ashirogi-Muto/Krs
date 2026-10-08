import test from 'node:test'
import assert from 'node:assert/strict'
import { buildRazorpayPaymentUrl, razorpayAlnum } from '../src/lib/payments/razorpayPage'

// 8 Oct 2026: some users could not pay. The Razorpay page's college field accepts letters and digits only (the field
// cannot be changed), and refuses "IILM University" with "Please enter alphanumeric characters only".

const params = (url: string) => Object.fromEntries(new URL(url).searchParams)

test('college name is sent in the only form Razorpay accepts: letters and digits', () => {
  const cases: [string, string][] = [
    ['IILM University', 'IILMUniversity'],
    ['IILM University, Greater Noida', 'IILMUniversityGreaterNoida'],
    ['G.L. Bajaj Institute of Technology & Management', 'GLBajajInstituteofTechnologyManagement'],
    ['  Amity   University  ', 'AmityUniversity'],
    ['Université Paris-Saclay', 'UniversiteParisSaclay'],
    ['NIT (Delhi) – 2nd campus', 'NITDelhi2ndcampus'],
  ]
  for (const [input, sent] of cases) {
    assert.equal(razorpayAlnum(input), sent, input)
    assert.match(razorpayAlnum(input), /^[a-z0-9]+$/i)
  }
  assert.equal(razorpayAlnum('x'.repeat(150)).length, 100)
})

test('payment link: pre-filled fields, event label kept exactly, phone only when given', () => {
  const full = params(buildRazorpayPaymentUrl({
    name: 'Asha Verma', email: 'asha@college.edu', phone: '+91 98765 43210', college: 'IILM University, Greater Noida',
    eventLabel: 'Robo - Ideathon ', amountInRupees: 399,
  }))
  assert.equal(full['name_of_university_/college'], 'IILMUniversityGreaterNoida')
  assert.equal(full.phone, '9876543210')
  assert.equal(full['select_event-'], 'Robo - Ideathon ', 'dropdown options end with a space on the Razorpay page')
  assert.equal(full.amount, '399')
  assert.equal(full.payer__name, 'Asha Verma')
  // Status page: no phone number (that lookup never shows phone numbers)
  const noPhone = params(buildRazorpayPaymentUrl({ name: 'Asha', email: 'asha@college.edu', college: 'IILM University' }))
  assert.equal('phone' in noPhone, false)
  assert.equal(noPhone['name_of_university_/college'], 'IILMUniversity')
})
