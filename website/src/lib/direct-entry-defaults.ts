/**
 * Wording of the "direct entry" notice on the Hackathon page (owner, 18 Oct 2026): the online PPT screening round is
 * dropped because registration closes too close to the event. {close} = registration close, {date} = event date.
 */
export const DIRECT_ENTRY_TEXTS = {
  badge: 'Programme update',
  title: 'Direct entry to the on-site final',
  text: 'Update from the organising committee: with registrations closing on {close} and the hackathon on {date}, there is not enough time to run a fair online screening round. To protect your preparation time, the PPT screening round has been discontinued, and every registered team proceeds directly to the 12-hour on-site hackathon.',
  textNoClose:
    'Update from the organising committee: with the hackathon on {date}, there is not enough time to run a fair online screening round. To protect your preparation time, the PPT screening round has been discontinued, and every registered team proceeds directly to the 12-hour on-site hackathon.',
}

/** Wording fixes inside the remaining Hackathon text once nobody is "shortlisted" any more: [pattern, replacement]. */
export const DIRECT_ENTRY_WORDING: [RegExp, string][] = [
  [/\bEvery shortlisted team\b/g, 'Every team'],
  [/\bShortlisted teams\b/g, 'Teams'],
  [/\bshortlisted teams\b/g, 'teams'],
  [/\bshortlisted team\b/g, 'team'],
]
