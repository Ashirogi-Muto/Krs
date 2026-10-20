import { APIError, type CollectionConfig } from 'payload'
import { anyKeyAccess, hiddenUnlessAny, keyAccess, superAdminOnly } from '../access/roles'
import { logger } from '../../lib/logger'
import { revalidateSite } from '../../lib/revalidate'
import { checkState, cleanConfig, EMPTY_STATE, type StateProblem } from '../../lib/tournament'
import { cleanState } from '../../lib/tournament-server'

/**
 * Tournaments for sports events (owner, 20 Oct 2026; lib/tournament.ts): Robo Soccer, Robo Race. Run from
 * /tournaments (format, scoring, teams, draw, results, publish). In the CMS everyone with access can see and delete
 * them; only the Super Admin can also add or edit one here (owner, 20 Oct 2026: "B … only for super admin"). A CMS
 * save cleans the settings, checks the bracket data and raises `rev`, so anyone with the portal open reloads.
 */
const ro = { readOnly: true }
const idOf = (x: any): number => Number(x && typeof x === 'object' ? x.id : x)
const STATE_PROBLEMS: Record<StateProblem['code'], string> = {
  entrant: 'every entrant needs a numeric id and a name.',
  entrantTwice: 'a team is entered twice.',
  groupTeam: 'a group has a team that is not an entrant.',
  matchId: 'match ids must be unique.',
  matchTeam: 'a match has a team that is not an entrant.',
  sameTeam: 'a match has the same team twice.',
  winner: 'the winner is not one of the match\'s teams.',
  trialTeam: 'a trial round has a team that is not an entrant.',
}

export const Tournaments: CollectionConfig = {
  slug: 'tournaments',
  labels: { singular: 'Tournament', plural: 'Tournaments' },
  forceSelect: { event: true },
  admin: {
    group: 'AURIX',
    useAsTitle: 'name',
    defaultColumns: ['name', 'event', 'format', 'status', 'published', 'updatedAt'],
    description:
      'Brackets, leagues and time trials for Robo Soccer and Robo Race. Set them up and enter results at /tournaments. The Super Admin can also correct one here (settings and bracket data as JSON; results are not recalculated, so prefer the portal).',
    hidden: hiddenUnlessAny(['tournaments.manage', 'tournaments.score']),
  },
  access: {
    read: anyKeyAccess(['tournaments.manage', 'tournaments.score'], 'event'),
    create: superAdminOnly,
    update: superAdminOnly,
    delete: keyAccess('tournaments.manage', 'event'),
  },
  hooks: {
    beforeValidate: [
      async ({ data, originalDoc, req }) => {
        // CMS saves only; /api/admin/tournaments checks its own changes
        if (!data || !req.user) return data
        // CMS: settings and bracket data are edited as JSON text (components/JsonTextField): an edited box sends text
        for (const [field, label] of [['config', 'Settings'], ['state', 'Teams, draw and results']] as const) {
          if (typeof data[field] === 'string') {
            try {
              data[field] = data[field].trim() ? JSON.parse(data[field]) : field === 'state' ? EMPTY_STATE : {}
            } catch (e: any) {
              throw new APIError(`${label}: not valid JSON (${String(e?.message || e).slice(0, 120)}).`, 400)
            }
          }
        }
        const next = { ...(originalDoc || {}), ...data }
        const config = cleanConfig({ ...(next.config || {}), format: next.format })
        const state = cleanState(next.state || EMPTY_STATE)
        const problem = checkState(state)
        if (problem) throw new APIError(`Bracket data (${problem.at}): ${STATE_PROBLEMS[problem.code]}`, 400)
        if (state.entrants.length) {
          const { docs } = await req.payload.find({
            collection: 'event-registrations',
            overrideAccess: true,
            depth: 0,
            pagination: false,
            req,
            where: { and: [{ event: { equals: idOf(next.event) } }, { id: { in: state.entrants.map((e) => e.id) } }] },
            select: { registrationCode: true },
          })
          if (docs.length !== state.entrants.length) throw new APIError('Bracket data: every entrant must be a registered team of this competition.', 400)
        }
        return { ...data, config, state, rev: (Number(originalDoc?.rev) || 0) + 1 }
      },
    ],
    afterChange: [
      ({ doc, previousDoc, operation, req }) => {
        if (req.user) {
          logger.audit(String((req.user as any).email), operation === 'create' ? 'TOURNAMENT_CREATED_IN_CMS' : 'TOURNAMENT_EDITED_IN_CMS', 'Tournament', String(doc.id), {
            rev: doc.rev,
            before: previousDoc ? { name: previousDoc.name, status: previousDoc.status, published: previousDoc.published, config: previousDoc.config, state: previousDoc.state } : null,
          })
          if (doc.published || previousDoc?.published) revalidateSite('tournaments')
        }
        return doc
      },
    ],
    afterDelete: [
      ({ doc, req }) => {
        logger.audit(String((req.user as any)?.email || 'system'), 'TOURNAMENT_DELETED', 'Tournament', String(doc.id), { name: doc.name, state: doc.state })
        if (doc.published) revalidateSite('tournaments')
      },
    ],
  },
  fields: [
    { type: 'row', fields: [
      { name: 'name', type: 'text', required: true, maxLength: 80 },
      { name: 'event', label: 'Competition', type: 'relationship', relationTo: 'events', required: true, index: true },
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
      },
      { name: 'published', label: 'Shown on the competition page', type: 'checkbox', defaultValue: false },
      { name: 'rev', type: 'number', defaultValue: 0, admin: { ...ro, hidden: true } },
    ] },
    // Text editors (Payload's JSON editor loads a script the CSP blocks); the hook above parses and checks them
    {
      name: 'config',
      label: 'Settings (JSON)',
      type: 'json',
      validate: () => true,
      admin: {
        description: 'Format and scoring settings. Unknown or out-of-range values are replaced by safe defaults on save.',
        components: { Field: { path: '@/payload/components/JsonTextField#JsonTextField', clientProps: { mode: 'json', rows: 12 } } },
      },
    },
    {
      name: 'state',
      label: 'Teams, draw and results (JSON)',
      type: 'json',
      validate: () => true,
      admin: {
        description: 'Entrants, groups, matches and runs. Checked on save (every team must be an entrant and a registered team of this competition).',
        components: { Field: { path: '@/payload/components/JsonTextField#JsonTextField', clientProps: { mode: 'json', rows: 20 } } },
      },
    },
  ],
}
