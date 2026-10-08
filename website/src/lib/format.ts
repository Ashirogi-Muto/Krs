import { fill } from './form-texts-defaults'

const TZ = 'Asia/Kolkata'

/** Wording used by these formatters; pass `(await getFormTexts()).general` (CMS → Labels & messages → Whole site). */
export type FormatWords = { fmtTba: string; comingSoon: string; fmtFee: string; fmtFeeTba: string; fmtMembers: string; fmtUpTo: string; fmtTeamEntry: string }
const W: FormatWords = {
  fmtTba: 'To be announced',
  comingSoon: 'Coming Soon',
  fmtFee: '{amount} / team',
  fmtFeeTba: 'Fee to be announced',
  fmtMembers: '{count} members',
  fmtUpTo: 'Up to {max} members',
  fmtTeamEntry: 'Team entry',
}

const part = (iso: string, opts: Intl.DateTimeFormatOptions) =>
  new Date(iso).toLocaleDateString('en-IN', { timeZone: TZ, ...opts })

/**
 * Formats an event's date range from CMS dates, e.g. "27–28 Oct 2026",
 * "30 Oct – 2 Nov 2026" or "27 Oct 2026". Use month: 'long' for "27–28 October 2026".
 */
export function formatDateRange(start: string, end?: string, month: 'short' | 'long' = 'short', w: Pick<FormatWords, 'fmtTba'> = W): string {
  if (!start) return w.fmtTba
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
export function formatFee(fee: number | null, comingSoon?: boolean, w: FormatWords = W): string {
  if (comingSoon) return w.comingSoon
  return fee !== null && fee !== undefined ? fill(w.fmtFee, { amount: `₹${fee}` }) : w.fmtFeeTba
}

/** "2–4 members", "1–3 members", "5 members" or "Team entry" */
export function formatTeamSize(min: number | null, max: number | null, w: FormatWords = W): string {
  if (min && max) return fill(w.fmtMembers, { count: min === max ? min : `${min}–${max}` })
  if (max) return fill(w.fmtUpTo, { max })
  return w.fmtTeamEntry
}

/** Indian-style rupee amount, e.g. ₹1,00,000 */
export function formatINR(amount: number): string {
  return `₹${amount.toLocaleString('en-IN')}`
}
