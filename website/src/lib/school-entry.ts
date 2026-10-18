/**
 * Free registration for school students (owner, 18 Oct 2026): every AURIX competition; the TEAM LEADER must be a school
 * student (Class 5–12) and upload their school ID card; the team pays nothing and is confirmed once staff approve the
 * ID check; a failed check uses the ID re-upload request, after which staff may untick "School entry" (the normal fee
 * applies again) or reject the team. Pure rules, unit-tested (tests/school-entry.test.ts).
 */
import { YEAR_VALUES } from './member-details'

export const SCHOOL_YEARS = YEAR_VALUES.filter((v) => v.startsWith('C'))
export const isSchoolYear = (year: unknown) => typeof year === 'string' && (SCHOOL_YEARS as readonly string[]).includes(year)

/** Payment state of a free school team: nothing to pay, never "awaiting payment". */
export const NOT_REQUIRED = 'NOT_REQUIRED' as const

/** The fields a new school-entry registration starts with (set by the server, never by the browser). */
export const schoolEntryFields = () => ({ schoolEntry: true, amountDue: 0, paymentStatus: NOT_REQUIRED })

type Reg = { schoolEntry?: boolean | null; paymentStatus?: string | null; idVerification?: string | null; status?: string | null }

/**
 * Staff tick or untick "School entry" in the CMS: the payment fields that go with it (null = nothing to change).
 * Ticking: free (a coupon is dropped). A team whose payment is already verified keeps its payment as it is.
 * Unticking: the normal fee is due again (`fee` = the competition's registration fee).
 */
export function schoolEntryChange(before: Reg, next: { schoolEntry?: boolean | null }, fee: number | null): Record<string, unknown> | null {
  if (next.schoolEntry === undefined || Boolean(next.schoolEntry) === Boolean(before.schoolEntry)) return null
  if (before.paymentStatus === 'PAID_VERIFIED') return null
  if (next.schoolEntry) return { amountDue: 0, paymentStatus: NOT_REQUIRED, coupon: null, couponCode: null, discountAmount: null, originalFee: null }
  return { amountDue: fee, paymentStatus: 'AWAITING_PAYMENT' }
}

/** Approving the ID check of a pending school-entry team confirms it (nothing else to wait for). */
export const confirmsOnIdApproval = (before: Reg, after: Reg) =>
  Boolean(after.schoolEntry) && after.paymentStatus === NOT_REQUIRED && after.idVerification === 'APPROVED' && before.idVerification !== 'APPROVED' && after.status === 'PENDING'
