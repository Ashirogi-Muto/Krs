/**
 * Wording of the "direct entry" notice on the Hackathon page (owner, 18 Oct 2026): the online PPT screening round is
 * dropped because registration closes too close to the event. {close} = registration close, {date} = event date.
 */
export const DIRECT_ENTRY_TEXTS = {
  badge: 'Important update',
  title: 'All teams proceed directly to the final',
  text: 'The online screening round has been withdrawn. With registrations closing on {close} and the event on {date}, the remaining time is too short to run it fairly. All registered teams will compete directly in the 12-hour on-site hackathon.',
  textNoClose:
    'The online screening round has been withdrawn. With the event on {date}, the remaining time is too short to run it fairly. All registered teams will compete directly in the 12-hour on-site hackathon.',
}

/** Wording fixes inside the remaining Hackathon text once nobody is "shortlisted" any more: [pattern, replacement]. */
export const DIRECT_ENTRY_WORDING: [RegExp, string][] = [
  [/\bEvery shortlisted team\b/g, 'Every team'],
  [/\bShortlisted teams\b/g, 'Teams'],
  [/\bshortlisted teams\b/g, 'teams'],
  [/\bshortlisted team\b/g, 'team'],
]
