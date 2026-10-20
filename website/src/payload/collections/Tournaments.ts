import type { CollectionConfig } from 'payload'
import { anyKeyAccess, hiddenUnlessAny, keyAccess } from '../access/roles'
import { logger } from '../../lib/logger'
import { revalidateSite } from '../../lib/revalidate'

/**
 * Tournaments for sports events (owner, 20 Oct 2026; lib/tournament.ts): Robo Soccer, Robo Race. Run entirely from
 * /tournaments (format, scoring, teams, draw, results, publish); the CMS only lists them and can delete one.
 * `config` and `state` are written only by /api/admin/tournaments, which checks them with lib/tournament.ts; `rev`
 * goes up on every change so two organisers never overwrite each other.
 */
const ro = { readOnly: true }

export const Tournaments: CollectionConfig = {
  slug: 'tournaments',
  labels: { singular: 'Tournament', plural: 'Tournaments' },
  forceSelect: { event: true },
  admin: {
    group: 'AURIX',
    useAsTitle: 'name',
    defaultColumns: ['name', 'event', 'format', 'status', 'published', 'updatedAt'],
    description: 'Brackets, leagues and time trials for Robo Soccer and Robo Race. Set them up and enter results at /tournaments; here you can only see and delete them.',
    hidden: hiddenUnlessAny(['tournaments.manage', 'tournaments.score']),
  },
  access: {
    read: anyKeyAccess(['tournaments.manage', 'tournaments.score'], 'event'),
    create: () => false,
    update: () => false,
    delete: keyAccess('tournaments.manage', 'event'),
  },
  hooks: {
    afterDelete: [
      ({ doc, req }) => {
        logger.audit(String((req.user as any)?.email || 'system'), 'TOURNAMENT_DELETED', 'Tournament', String(doc.id), { name: doc.name })
        if (doc.published) revalidateSite('tournaments')
      },
    ],
  },
  fields: [
    { type: 'row', fields: [
      { name: 'name', type: 'text', required: true, maxLength: 80, admin: ro },
      { name: 'event', label: 'Competition', type: 'relationship', relationTo: 'events', required: true, index: true, admin: ro },
    ] },
    { type: 'row', fields: [
      {
        name: 'format',
        type: 'select',
        required: true,
        options: [
          { label: 'League, then knockout', value: 'league_knockout' },
          { label: 'Knockout', value: 'knockout' },
          { label: 'Head-to-head race bracket', value: 'race_bracket' },
          { label: 'Time trial', value: 'time_trial' },
        ],
        admin: ro,
      },
      {
        name: 'status',
        type: 'select',
        required: true,
        defaultValue: 'SETUP',
        options: [
          { label: 'Setting up', value: 'SETUP' },
          { label: 'Drawn / in play', value: 'LIVE' },
          { label: 'Finished', value: 'FINISHED' },
        ],
        admin: ro,
      },
      { name: 'published', label: 'Shown on the competition page', type: 'checkbox', defaultValue: false, admin: ro },
      { name: 'rev', type: 'number', defaultValue: 0, admin: { ...ro, hidden: true } },
    ] },
    { name: 'config', type: 'json', admin: { ...ro, hidden: true } },
    { name: 'state', type: 'json', admin: { ...ro, hidden: true } },
  ],
}
