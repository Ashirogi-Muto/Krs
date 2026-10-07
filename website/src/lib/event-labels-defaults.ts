/**
 * Labels of the competition pages (/aurix/<event>): one template for every event, so its wording lives in one
 * CMS global ("Event pages"). Each entry: key, CMS label, built-in text. Groups become CMS tabs.
 * Event facts (fees, rules, rounds, FAQs…) are NOT here: they are edited per event in Events.
 */
export const EVENT_LABEL_GROUPS = [
  {
    tab: 'Top of the page',
    fields: [
      ['statusLabel', 'Before the status', 'Status:'],
      ['countdownLabel', 'Countdown label', 'Tournament Commences In'],
      ['statDate', 'Box: date', 'Date'],
      ['statVenue', 'Box: venue', 'Venue'],
      ['venueValue', 'Venue text', 'IILM University, Greater Noida'],
      ['statTeam', 'Box: team', 'Composition'],
      ['statFee', 'Box: fee', 'Entry Fee'],
      ['feeSuffix', 'After the fee', ' / team'],
      ['unpriced', 'When no fee is set', 'Unpriced'],
      ['statPrize', 'Box: prize pool', 'Prize Pool'],
      ['prizeTba', 'When no prize pool is set', 'To be announced'],
      ['rulesButton', 'Button: rules', 'Read Technical Rules'],
      ['footageButton', 'Button: footage (if a media link is set)', 'View Tournament Footage'],
      ['noticeTitle', 'Notice box title (each event can set its own)', 'Official Arena Confidentiality Notice'],
      ['teamExact', 'Box: team of a fixed size ({count})', 'Exactly {count} Members'],
      ['teamRange', 'Box: team size range ({min}, {max})', '{min}–{max} Members'],
      ['teamOperator', 'Box: operators ({count})', '{count} Operator'],
      ['teamUnknown', 'Box: team size not set', 'Team'],
    ],
  },
  {
    tab: 'Status & countdown',
    fields: [
      ['statusDraft', 'Status: draft', 'DRAFT'],
      ['statusAnnounced', 'Status: announced', 'ANNOUNCED'],
      ['statusOpen', 'Status: registration open', 'REGISTRATION OPEN'],
      ['statusClosed', 'Status: registration closed', 'REGISTRATION CLOSED'],
      ['statusLive', 'Status: in progress', 'IN PROGRESS'],
      ['statusJudging', 'Status: judging', 'JUDGING'],
      ['statusResultsPending', 'Status: results pending', 'RESULTS PENDING'],
      ['statusResults', 'Status: results published', 'RESULTS PUBLISHED'],
      ['statusArchived', 'Status: archived', 'ARCHIVED'],
      ['countdownDays', 'Countdown: days', 'Days'],
      ['countdownHours', 'Countdown: hours', 'Hours'],
      ['countdownMins', 'Countdown: minutes', 'Mins'],
      ['countdownSecs', 'Countdown: seconds', 'Secs'],
      ['countdownOver', 'Countdown: after the start', 'Event is Live or Concluded'],
    ],
  },
  {
    tab: 'Registration button',
    fields: [
      ['ctaOpen', 'Registration open', 'Register Team Now'],
      ['ctaClosed', 'Registration closed', 'Registration Closed'],
      ['ctaLive', 'Event in progress', 'Event Live in Progress'],
      ['ctaResultsPending', 'Results pending', 'Results Pending'],
      ['ctaResults', 'Results published', 'View Official Results'],
      ['ctaArchived', 'Archived', 'Event Archived'],
      ['ctaAnnounced', 'Announced (other states)', 'Announced — Learn More'],
      ['ctaTitle', 'Bottom box title ({name} = competition)', 'Ready to Compete in {name}?'],
      ['ctaText', 'Bottom box text', 'Form your team, prepare your hardware and software, and secure your place in the national arena at IILM University Greater Noida.'],
    ],
  },
  {
    tab: 'Sections',
    fields: [
      ['overviewEyebrow', 'Overview: small line', 'Section 01 // Overview & Scope'],
      ['overviewTitle', 'Overview: title', 'Competition Mission'],
      ['eligibilityLabel', 'Overview: requirements label', 'Eligibility Invariants:'],
      ['tracksEyebrow', 'Tracks: small line', 'Section 02 // Challenge Tracks'],
      ['tracksTitle', 'Tracks: title', 'Nine Problem Domains'],
      ['tracksIntro', 'Tracks: intro', 'Teams select one primary track for proposal evaluation and prototyping.'],
      ['trackLabel', 'Tracks: word before the number', 'Track'],
      ['targetFocus', 'Tracks: examples label', 'Target Focus:'],
      ['roundsEyebrow', 'Rounds: small line', 'Section 03 // Progression'],
      ['roundsTitle', 'Rounds: title', 'Multi-Round Progression'],
      ['roundLabel', 'Rounds: word before the number', 'Round'],
      ['submissionLabel', 'Rounds: submission label', 'Submission:'],
      ['scheduleEyebrow', 'Timeline: small line', 'Section 04 // Sprint Timeline'],
      ['scheduleTitle', 'Timeline: title', '12-Hour Build Flow & Milestone Checkpoints'],
      ['rubricEyebrow', 'Scoring: small line', 'Section 05 // Evaluation Matrix'],
      ['rubricTitle', 'Scoring: title', 'Official Scoring Rubric'],
      ['criterionLabel', 'Scoring: card label', 'Criterion'],
      ['marksLabel', 'Scoring: marks word', 'Marks'],
      ['rulesEyebrow', 'Rules: small line', 'Section 06 // Technical Policy'],
      ['rulesTitle', 'Rules: title', 'Competition Rules & Policy Invariants'],
      ['faqEyebrow', 'FAQ: small line', 'Section 07 // Inquiries'],
      ['faqTitle', 'FAQ: title', 'Frequently Asked Questions'],
    ],
  },
  {
    tab: 'Coming soon',
    fields: [
      ['comingSoonText', 'Big "coming soon" line', 'Coming Soon'],
      ['comingSoonPrize', 'Before the prize pool', 'Prize pool'],
      ['comingSoonButton', 'Button', 'Explore Other Competitions'],
    ],
  },
] as const

type Key = (typeof EVENT_LABEL_GROUPS)[number]['fields'][number][0]
export type EventLabels = Record<Key, string>

/** Countdown unit words from the labels. */
export const countdownWords = (L: EventLabels) => ({
  days: L.countdownDays,
  hours: L.countdownHours,
  mins: L.countdownMins,
  secs: L.countdownSecs,
  over: L.countdownOver,
})

const STATUS_KEYS: Record<string, Key> = {
  DRAFT: 'statusDraft',
  ANNOUNCED: 'statusAnnounced',
  REGISTRATION_OPEN: 'statusOpen',
  REGISTRATION_CLOSED: 'statusClosed',
  IN_PROGRESS: 'statusLive',
  JUDGING: 'statusJudging',
  RESULTS_PENDING: 'statusResultsPending',
  RESULTS_PUBLISHED: 'statusResults',
  ARCHIVED: 'statusArchived',
}
/** Display word for an event status (unknown statuses as before: first underscore → space). */
export const statusWord = (L: EventLabels, status: string) => (STATUS_KEYS[status] ? L[STATUS_KEYS[status]] : status.replace('_', ' '))

export const DEFAULT_EVENT_LABELS = Object.fromEntries(
  EVENT_LABEL_GROUPS.flatMap((g) => g.fields.map(([key, , def]) => [key, def])),
) as EventLabels
