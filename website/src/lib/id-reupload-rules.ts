/** Pure rules of the student ID re-upload (no imports: unit-tested). See lib/id-reupload.ts. */

export const ACTIVE = ['PENDING', 'CONFIRMED']
const DAY = 24 * 3_600_000

/** "2026-10-12" → the end of that day in India (23:59:59 IST). */
export function deadlineEndIST(day: string): Date | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(day)) return null
  const d = new Date(`${day}T23:59:59+05:30`)
  // Rejects impossible dates such as 2026-02-30 (they would roll over into the next month)
  return Number.isNaN(d.getTime()) || d.toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' }) !== day ? null : d
}

/** A deadline staff may choose: today (IST) up to 60 days ahead. */
export function parseDeadline(day: unknown, now = new Date()): Date | null {
  const end = typeof day === 'string' ? deadlineEndIST(day) : null
  if (!end) return null
  return end.getTime() >= now.getTime() && end.getTime() <= now.getTime() + 61 * DAY ? end : null
}

/** "12 October 2026, 11:59 pm" (IST) for emails and pages. */
export const formatDeadline = (d: string | Date) =>
  new Date(d).toLocaleString('en-IN', { day: 'numeric', month: 'long', year: 'numeric', hour: 'numeric', minute: '2-digit', timeZone: 'Asia/Kolkata' })

/** May this team still upload new cards? (Rejected, still active, deadline not passed.) */
export function canReupload(reg: { idVerification?: string; status?: string; idReuploadDeadline?: string | null }, now = new Date()) {
  return (
    reg.idVerification === 'REJECTED' &&
    ACTIVE.includes(String(reg.status)) &&
    (!reg.idReuploadDeadline || new Date(reg.idReuploadDeadline).getTime() >= now.getTime())
  )
}
