/**
 * Wording of the registration exports added on 21 Oct 2026 (owner: "exporting data of all team mates" and "all exports
 * follow the filters set on the event registration page"): the export bar on CMS → Event registrations and the
 * team-members CSV. CMS → Website → "Export texts" (own global: the Staff & admin texts row has no room left).
 */
export const EXPORT_TEXT_GROUPS = [
  {
    key: 'bar',
    tab: 'Export bar (Event registrations)',
    fields: [
      ['title', 'Label before the buttons', 'Download this list as CSV (filters and search applied):'],
      ['titleAll', 'Label when no filter is set', 'Download as CSV (all teams you can see):'],
      ['members', 'Button: team members', 'Team members'],
      ['dashboardMembers', 'Dashboard button: team members CSV', 'Team members CSV'],
      ['full', 'Button: full', 'Full'],
      ['finance', 'Button: finance', 'Finance'],
      ['checkin', 'Button: check-in', 'Check-in'],
      ['roster', 'Button: roster', 'Roster'],
      ['help', 'Help under the buttons', 'Team members = one row per person with their details; the other files are as on the dashboard. Contacts, money and notes appear only for the competitions you may see them for.'],
      ['badFilter', 'Error: a filter that cannot be used for an export', 'This filter cannot be used for an export (or uses a field you cannot see). Change the filter and try again.'],
    ],
  },
  {
    key: 'csv',
    tab: 'Team members CSV',
    fields: [
      ['role', 'Column: role in the team', 'Role'],
      ['leader', 'Role: team leader', 'Leader'],
      ['member', 'Role: member', 'Member'],
      ['email', 'Column: member email', 'Email'],
      ['phone', 'Column: member phone', 'Phone'],
      ['answers', 'Column: answers to the competition questions', 'Answers'],
      ['idUploaded', 'Column: student ID uploaded', 'Student ID uploaded'],
      ['yes', 'Yes', 'Yes'],
      ['no', 'No', 'No'],
      ['teamStatus', 'Column: team status', 'Team status'],
      ['file', 'File name (letters, digits, -)', 'aurix-team-members'],
    ],
  },
] as const

type Group = (typeof EXPORT_TEXT_GROUPS)[number]
export type ExportTexts = { [G in Group as G['key']]: Record<G['fields'][number][0], string> }

export const DEFAULT_EXPORT_TEXTS = Object.fromEntries(
  EXPORT_TEXT_GROUPS.map((g) => [g.key, Object.fromEntries(g.fields.map(([k, , d]) => [k, d]))]),
) as ExportTexts
