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
      ['statSubmission', 'Box: submission deadline (competitions with an online round)', 'PPT Submission'],
      ['sponsorsTitle', 'Sponsors strip: heading (logos from Site settings → Sponsors)', 'Partners'],
      ['rulesButton', 'Button: rules', 'Read Technical Rules'],
      ['footageButton', 'Button: footage (if a media link is set)', 'View Tournament Footage'],
      ['templateButton', 'Button: download the presentation format (shown when the online round has a template file)', 'Download PPT Format'],
      ['noticeTitle', 'Notice box title (each event can set its own)', 'Official Arena Confidentiality Notice'],
      // Owner, 18 Oct 2026 (PR #18): competitions with "Direct entry" ticked (no online screening round)
      ['directEntryBadge', 'Direct entry notice: badge', 'Important update'],
      ['directEntryTitle', 'Direct entry notice: title', 'All teams proceed directly to the final'],
      ['directEntryText', 'Direct entry notice: text ({close} = registration close, {date} = event date)', 'The online screening round has been withdrawn. With registrations closing on {close} and the event on {date}, the remaining time is too short to run it fairly. All registered teams will compete directly in the 12-hour on-site hackathon.'],
      ['directEntryTextNoClose', 'Direct entry notice: text when no registration close is set ({date})', 'The online screening round has been withdrawn. With the event on {date}, the remaining time is too short to run it fairly. All registered teams will compete directly in the 12-hour on-site hackathon.'],
      ['teamExact', 'Box: team of a fixed size ({count})', 'Exactly {count} Members'],
      ['teamSolo', 'Box: one-player competition', 'Solo (1 player)'],
      ['teamRange', 'Box: team size range ({min}, {max})', '{min}–{max} Members'],
      ['teamOperator', 'Box: operators ({count})', '{count} Operator'],
      ['teamUnknown', 'Box: team size not set', 'Team'],
    ],
  },
  {
    // Owner, 17 Oct 2026: deadline-extended heading, prize pool banner, registration offer, Contact Us pop-up
    tab: 'Offer, contact & prize',
    fields: [
      ['extendedTitle', 'Deadline extended: heading (when the competition ticks "deadline extended")', 'Registration Deadline Extended!'],
      ['extendedText', 'Deadline extended: text ({date} = the registration close)', 'Registrations now close on {date} IST.'],
      ['prizeBannerLabel', 'Prize pool banner: label above the amount', 'Total Prize Pool'],
      ['offerTitle', 'Offer box: title (AURIX → Coupon limits → coupon shown on the competition pages)', 'Registration Offer'],
      ['offerPercent', 'Offer box: % discount ({percent}, {code})', 'Get {percent}% off your registration fee with code {code}'],
      ['offerAmount', 'Offer box: ₹ discount ({amount}, {code})', 'Get {amount} off your registration fee with code {code}'],
      ['offerPrice', 'Offer box: price ({final} = with the code, {fee} = full fee)', 'Pay {final} instead of {fee}'],
      ['offerUntil', 'Offer box: end ({date})', 'Valid till {date} IST'],
      ['offerHow', 'Offer box: how to use it', 'Register your team, then enter the code at checkout before paying.'],
      ['offerCopy', 'Offer box: copy button', 'Copy code'],
      ['offerCopied', 'Offer box: after copying', 'Copied!'],
      ['contactButton', 'Button: contact us (shown when the competition has contacts)', 'Contact Us'],
      ['contactTitle', 'Contact pop-up: title ({name} = competition)', 'Contact Us: {name}'],
      ['contactIntro', 'Contact pop-up: intro', 'Questions about registration, payment or the rules? Message us on WhatsApp.'],
      ['contactWhatsapp', 'Contact pop-up: WhatsApp button', 'Chat on WhatsApp'],
      ['contactMessage', 'WhatsApp: first message typed for the participant ({name} = competition)', 'Hi, I have a question about {name} at AURIX.'],
      ['contactClose', 'Contact pop-up: close button', 'Close'],
      // ui-update-upcoming (17 Oct 2026): Hackathon coupon ticker, prize section and offer pop-up; wording as designed
      ['prizeSectionLabel', 'Hackathon prize section: label above the amount', 'Total prize pool'],
      ['offerHeadlinePercent', 'Ticker and offer pop-up: % headline ({percent})', '{percent}% OFF'],
      ['offerHeadlineAmount', 'Ticker and offer pop-up: ₹ headline ({amount})', '{amount} OFF'],
      ['tickerText', 'Coupon ticker: text before the code ({headline})', 'Coupon live: {headline} with code'],
      ['tickerAfter', 'Coupon ticker: text after the code', 'Limited time'],
      ['tickerTextOne', 'Coupon ticker on AURIX home & Competitions for a coupon valid for one competition only ({headline}, {event})', 'Coupon live: {headline} on {event} with code'],
      ['popupBadge', 'Offer pop-up: badge', 'Exclusive offer'],
      ['popupText', 'Offer pop-up: text', 'Register your team and apply this code at checkout.'],
      ['popupCopy', 'Offer pop-up: copy button', 'Copy'],
      ['popupCopied', 'Offer pop-up: after copying', 'Copied'],
      ['popupRegister', 'Offer pop-up: register button', 'Register now'],
      ['popupFooter', 'Offer pop-up: small line at the bottom', 'Limited time · Apply at checkout'],
      ['popupLabel', 'Offer pop-up: name for screen readers', 'Coupon offer'],
      ['popupClose', 'Offer pop-up: close button (screen readers)', 'Close'],
    ],
  },
  {
    // Owner, 18 Oct 2026 (lib/entry-options.ts): competitions with entry options, e.g. BGMI Solo / Squad
    tab: 'Entry options',
    fields: [
      ['entryTitle', 'Registration form: heading of the entry choice', 'Entry type'],
      ['entryErrChoose', 'Registration form: no entry type chosen', 'Choose an entry type (for example Solo or Squad).'],
      ['entryOnePlayer', 'Team size of an option with one player', '1 player'],
      ['entryPlayers', 'Team size of an option with a range ({min}, {max})', '{min}–{max} players'],
      ['entryExact', 'Team size of an option with a fixed size ({count})', '{count} players'],
      ['entryNoCoupon', 'Checkout: coupon refused for this entry type ({option})', "Coupon codes can't be used for {option} entries."],
      ['offerOnlyFor', 'Offer box: when only some entry types may use coupons ({options})', 'Valid for {options} entries only.'],
    ],
  },
  {
    tab: 'Status & countdown',
    fields: [
      ['comingSoonDetails', 'Coming-soon competitions: description when the event has no own message', 'Full details will be announced soon.'],
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
