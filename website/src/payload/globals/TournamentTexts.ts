import type { GlobalConfig } from 'payload'
import { hiddenUnlessAny, keyAllowed } from '../access/roles'
import { TOURNAMENT_TEXT_GROUPS } from '../../lib/tournament-texts-defaults'
import { textGroupTabs } from '../fields/textGroups'

/**
 * Wording of the sports tournaments (owner, 20 Oct 2026): organisers' portal (/tournaments), the bracket / table /
 * leaderboard on competition pages, messages. Same editors as "Staff & admin texts". Cleared field = built-in text.
 */
export const TournamentTexts: GlobalConfig = {
  slug: 'tournament-texts',
  label: 'Tournament texts',
  admin: {
    group: 'Website',
    description:
      'Wording of the tournament portal (/tournaments), the bracket, league table and leaderboard shown on competition pages, and the messages. Each field shows what the site uses now; edit it to change the text, or clear it to go back to the built-in wording.',
    hidden: hiddenUnlessAny(['globals.staffTexts']),
  },
  access: { read: () => true, update: keyAllowed('globals.staffTexts') },
  fields: [{ type: 'tabs', tabs: textGroupTabs(TOURNAMENT_TEXT_GROUPS) }],
}
