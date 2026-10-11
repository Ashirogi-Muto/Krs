/**
 * Optional branch and year/class for every team member (owner, 11 Oct 2026). School students can register too:
 * years 1–4 for college students, classes 5–12 for school students. Branch: letters and single spaces only.
 * Pure rules (tests/member-details.test.ts); wording of the options: Labels & messages → Registration form.
 */
export const YEAR_VALUES = ['Y1', 'Y2', 'Y3', 'Y4', 'C5', 'C6', 'C7', 'C8', 'C9', 'C10', 'C11', 'C12'] as const
export type YearValue = (typeof YEAR_VALUES)[number]

/** CMS labels of the stored values (staff screens and CSV exports). */
export const YEAR_ADMIN_LABELS: Record<YearValue, string> = {
  Y1: '1st year', Y2: '2nd year', Y3: '3rd year', Y4: '4th year',
  C5: 'Class 5', C6: 'Class 6', C7: 'Class 7', C8: 'Class 8', C9: 'Class 9', C10: 'Class 10', C11: 'Class 11', C12: 'Class 12',
}

/** "" (not given), the cleaned branch, or false when it contains anything but letters and spaces. */
export function cleanBranch(v: unknown): string | false {
  const s = String(v ?? '').trim().replace(/\s+/g, ' ')
  if (!s) return ''
  return s.length <= 60 && /^[A-Za-z]+(?: [A-Za-z]+)*$/.test(s) ? s : false
}

/** "" (not given), a known value, or false. */
export function cleanYear(v: unknown): YearValue | '' | false {
  const s = String(v ?? '').trim()
  if (!s) return ''
  return (YEAR_VALUES as readonly string[]).includes(s) ? (s as YearValue) : false
}
