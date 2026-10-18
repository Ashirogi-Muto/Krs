/**
 * Wording of the free school entry (owner, 18 Oct 2026; lib/school-entry.ts): CMS → Website → "School entry (free)".
 * Its own global on purpose: the "Labels & messages" row (form_texts) is at Postgres' 8 KB row limit, so it cannot take
 * new columns (every column costs ~20 bytes inline however short its text). Groups become CMS tabs.
 */
export const SCHOOL_TEXT_GROUPS = [
  {
    key: 'form',
    tab: 'Registration form',
    fields: [
      ['schoolCheck', 'Checkbox (team leader is a school student)', 'The team leader is a school student (Class 5–12): registration is free'],
      ['schoolHelp', 'Help under the checkbox', "Choose the team leader's class and upload the leader's school ID card. Your team is confirmed once we have checked the ID; you will not be asked to pay."],
      ['schoolName', "Placeholder for the leader's school", 'School name'],
      ['schoolId', 'Leader ID upload button', 'School ID card'],
      ['schoolClass', "Leader's class dropdown: first (empty) option", 'Class (required for a free school entry)'],
      ['submitFree', 'Submit button when the school box is ticked', 'Register (free school entry)'],
      ['errSchoolYear', "Error when the leader's class is not Class 5–12", "For a free school entry, choose the team leader's class (Class 5–12)."],
      ['doneFreeNext', 'After registering: next step', 'No payment needed: free school entry'],
      ['doneFreeConfirm', 'After registering: confirmation note', "We will check the team leader's school ID card. Your registration is confirmed once it is verified; you will receive an email."],
      ['regSchoolYear', 'Server message: school entry without a school class for the leader ({name})', 'A free school entry needs the team leader ({name}) to be in Class 5–12. Choose the class, or untick the school student box.'],
    ],
  },
  {
    key: 'status',
    tab: 'Status & email',
    fields: [
      ['payFree', 'Registration status page: payment line', 'Free (school entry): no payment needed'],
      ['feeSchool', 'Registration email: fee row', 'Free (school entry)'],
      ['next1School', 'Registration email: next step 1', "Our team checks the team leader's school ID card. There is nothing to pay."],
      ['next2School', 'Registration email: next step 2', 'Once the school ID is verified, your registration is confirmed.'],
    ],
  },
] as const

type Group = (typeof SCHOOL_TEXT_GROUPS)[number]
export type SchoolTexts = { [G in Group as G['key']]: Record<G['fields'][number][0], string> }

export const DEFAULT_SCHOOL_TEXTS = Object.fromEntries(
  SCHOOL_TEXT_GROUPS.map((g) => [g.key, Object.fromEntries(g.fields.map(([k, , d]) => [k, d]))]),
) as SchoolTexts
