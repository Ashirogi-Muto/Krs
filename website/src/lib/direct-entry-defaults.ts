// The "direct entry" notice wording is in Event pages → Top of the page (lib/event-labels-defaults.ts: directEntry*).

/** Wording fixes inside the remaining Hackathon text once nobody is "shortlisted" any more: [pattern, replacement]. */
export const DIRECT_ENTRY_WORDING: [RegExp, string][] = [
  [/\bEvery shortlisted team\b/g, 'Every team'],
  [/\bShortlisted teams\b/g, 'Teams'],
  [/\bshortlisted teams\b/g, 'teams'],
  [/\bshortlisted team\b/g, 'team'],
]
