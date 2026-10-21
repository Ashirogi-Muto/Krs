/**
 * Automatic confirmation (owner, 21 Oct 2026: "if payment is verified and ID is verified the team automatically gets
 * verified"). A pending team is confirmed by the save that makes both true: payment verified (or nothing to pay, for a
 * free school entry) and student IDs approved. Only on that change, so a team staff deliberately put back to Pending
 * stays pending until its payment or ID check changes again. Rejected / cancelled teams are never touched.
 * Pure rules, unit-tested (tests/auto-confirm.test.ts).
 */
type Reg = { status?: string | null; paymentStatus?: string | null; idVerification?: string | null; schoolEntry?: boolean | null }

/** Payment done: verified, or nothing to pay (free school entry). */
export const paymentDone = (r: Reg) => r.paymentStatus === 'PAID_VERIFIED' || (Boolean(r.schoolEntry) && r.paymentStatus === 'NOT_REQUIRED')
/** Both checks done. */
export const readyToConfirm = (r: Reg) => r.idVerification === 'APPROVED' && paymentDone(r)

/** Does this save confirm the team? (pending, both checks done now, and they were not both done before) */
export const autoConfirms = (before: Reg, after: Reg) => after.status === 'PENDING' && readyToConfirm(after) && !readyToConfirm(before)
