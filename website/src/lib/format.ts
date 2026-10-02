const TZ = 'Asia/Kolkata'

const part = (iso: string, opts: Intl.DateTimeFormatOptions) =>
  new Date(iso).toLocaleDateString('en-IN', { timeZone: TZ, ...opts })

/**
 * Formats an event's date range from CMS dates, e.g. "27–28 Oct 2026",
 * "30 Oct – 2 Nov 2026" or "27 Oct 2026". Use month: 'long' for "27–28 October 2026".
 */
export function formatDateRange(start: string, end?: string, month: 'short' | 'long' = 'short'): string {
  if (!start) return 'To be announced'
  const sDay = part(start, { day: 'numeric' })
  const sMonth = part(start, { month })
  const sYear = part(start, { year: 'numeric' })
  if (!end) return `${sDay} ${sMonth} ${sYear}`
  const eDay = part(end, { day: 'numeric' })
  const eMonth = part(end, { month })
  const eYear = part(end, { year: 'numeric' })
  if (sYear !== eYear) return `${sDay} ${sMonth} ${sYear} – ${eDay} ${eMonth} ${eYear}`
  if (sMonth !== eMonth) return `${sDay} ${sMonth} – ${eDay} ${eMonth} ${eYear}`
  if (sDay === eDay) return `${sDay} ${sMonth} ${sYear}`
  return `${sDay}–${eDay} ${sMonth} ${sYear}`
}

/** "₹499 / team", "Coming Soon" or "Fee to be announced" */
export function formatFee(fee: number | null, comingSoon?: boolean): string {
  if (comingSoon) return 'Coming Soon'
  return fee !== null && fee !== undefined ? `₹${fee} / team` : 'Fee to be announced'
}

/** "2–4 members", "1–3 members", "5 members" or "Team entry" */
export function formatTeamSize(min: number | null, max: number | null): string {
  if (min && max) return min === max ? `${min} members` : `${min}–${max} members`
  if (max) return `Up to ${max} members`
  return 'Team entry'
}

/** Indian-style rupee amount, e.g. ₹1,00,000 */
export function formatINR(amount: number): string {
  return `₹${amount.toLocaleString('en-IN')}`
}
