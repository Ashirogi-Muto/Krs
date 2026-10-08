/**
 * Builds a link to the college's Razorpay Payment Page with the payer's details pre-filled.
 *
 * Razorpay's hosted page reads `?<field name>=<value>` for each form field (keys are used
 * as-is, values are URI-decoded), and `?amount=` for the custom amount item, in rupees.
 * Field names below are the page's own `udf_schema` names.
 */
const DEFAULT_PAGE_URL = 'https://pages.razorpay.com/pl_ThoiV8dXpUCMrI/view'

export interface PaymentPrefill {
  name: string
  email: string
  phone?: string // left out when the requester should not see it (status lookup)
  college: string
  eventLabel?: string // must match a dropdown option exactly
  amountInRupees?: number | null
}

// '%' would break the page's double URI-decoding, so drop it
const clean = (value: string) => value.replace(/%/g, '').trim()
// Razorpay's college field only accepts letters and digits (/^[a-z0-9]+$/i), so "IILM University, Greater Noida" is
// sent as "IILMUniversityGreaterNoida": accents become plain letters (é → e), spaces and punctuation are removed.
export const razorpayAlnum = (value: string) =>
  value
    .normalize('NFKD')
    .replace(/\p{M}/gu, '')
    .replace(/[^a-z0-9]/gi, '')
    .slice(0, 100)

export function buildRazorpayPaymentUrl(prefill: PaymentPrefill): string {
  const base = process.env.RAZORPAY_PAYMENT_PAGE_URL || DEFAULT_PAGE_URL
  const digits = (prefill.phone || '').replace(/\D/g, '')
  const params: [string, string][] = [
    ['payer__name', clean(prefill.name)],
    ['email', clean(prefill.email)],
    ...(digits ? ([['phone', digits.length > 10 ? digits.slice(-10) : digits]] as [string, string][]) : []),
    // The page's college field uses Razorpay's "alphanumeric" check (no spaces or punctuation) and cannot be changed
    // (owner, 8 Oct 2026): always send letters and digits only, or the page refuses to pay.
    ['name_of_university_/college', process.env.RAZORPAY_COLLEGE_PLAIN_TEXT === '1' ? clean(prefill.college) : razorpayAlnum(prefill.college)],
  ]
  if (prefill.eventLabel) {
    // Not trimmed: some dropdown options end with a space
    params.push(['select_event-', prefill.eventLabel.replace(/%/g, '')])
  }
  if (prefill.amountInRupees && prefill.amountInRupees > 0) {
    params.push(['amount', String(prefill.amountInRupees)])
  }
  const query = params.map(([key, value]) => `${key}=${encodeURIComponent(value)}`).join('&')
  return `${base}?${query}`
}
