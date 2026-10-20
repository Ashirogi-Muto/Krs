import { APIError, type CollectionConfig } from 'payload'
import { anyKeyAccess, hiddenUnlessAny, keyAccess } from '../access/roles'
import { can, canFor } from '../access/permissions'
import { CRITERION_KEY, FormulaError, FORMULA_FUNCTIONS, FORMULA_MAX_LENGTH, RESERVED_NAMES, formulaRange, roundFormula } from '../../lib/formula'
import { roundOf, scoringSignature } from '../../lib/judging'
import { logger } from '../../lib/logger'

/**
 * Judging (owner, 20 Oct 2026; lib/judging.ts). A judging round = one competition round that judges score at /judge:
 * its criteria, the formula that turns the marks into a score, the judges and what they may see. Staff with
 * "See scores & decide" rank the teams and mark them Qualified / Not qualified at /judging.
 *
 * Criteria, formula, competition and round number lock once the first score is saved (the label and guidance text
 * stay editable), so every judge's score is worked out the same way. Scores and decisions are written only by the
 * /judge and /judging APIs (server-checked), never through the CMS or REST.
 */

const slugKey = (s: string) =>
  String(s || '')
    .toLowerCase()
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
    .replace(/^(\d)/, 'c_$1')
    .slice(0, 32)
    .replace(/_+$/, '')

const FORMULA_HELP = [
  'How a judge\'s marks become the team\'s score. Leave empty to add up all criteria.',
  'Use the criteria keys (shown on each criterion), numbers, + - * / ^ ( ), comparisons (< <= > >= == !=), && || !, cond ? a : b,',
  `and ${FORMULA_FUNCTIONS.map((f) => `${f}()`).join(', ')}. "total" is the sum of all marks.`,
  'Examples: innovation + technical - penalty * 2 · (design + build) * if(complete >= 5, 1, 0.5) · max(0, total - late * 5).',
  'The final score of a team is the average of its judges\' scores. Locked once a judge has scored.',
].join(' ')

const formulaMessage = (e: unknown): string => {
  if (!(e instanceof FormulaError)) return 'The formula could not be read.'
  const at = e.at >= 0 ? ` (character ${e.at + 1})` : ''
  switch (e.code) {
    case 'tooLong': return `The formula is too long (at most ${FORMULA_MAX_LENGTH} characters).`
    case 'tooComplex': return 'The formula is too complex. Split it into fewer terms.'
    case 'unknownName': return `"${e.detail}" is not a criterion key or a function${at}. Keys: see each criterion; functions: ${FORMULA_FUNCTIONS.join(', ')}.`
    case 'badArgs': return `${e.detail}() has the wrong number of values${at}.`
    default: return `The formula has a mistake near "${e.detail || 'the end'}"${at}.`
  }
}

const countScores = async (req: any, round: unknown) =>
  (await req.payload.count({ collection: 'judge-scores', overrideAccess: true, req, where: { round: { equals: round } } })).totalDocs as number

export const JudgingRounds: CollectionConfig = {
  slug: 'judging-rounds',
  labels: { singular: 'Judging round', plural: 'Judging rounds' },
  admin: {
    group: 'AURIX',
    useAsTitle: 'title',
    defaultColumns: ['title', 'event', 'roundNumber', 'status', 'teams'],
    description:
      'Rounds that judges score at /judge (Hackathon, Robo Ideathon). Set the criteria and the scoring formula, pick the judges, choose what they may see, then set the status to Open. Results and Qualified / Not qualified: /judging.',
    hidden: hiddenUnlessAny(['judging.manage', 'judging.results']),
  },
  access: {
    read: anyKeyAccess(['judging.manage', 'judging.results'], 'event'),
    // Limited roles may add rounds for their own competitions (checked on the chosen competition below)
    create: ({ req: { user } }) => can(user as any, 'judging.manage'),
    update: keyAccess('judging.manage', 'event'),
    delete: keyAccess('judging.manage', 'event'),
  },
  indexes: [{ fields: ['event', 'roundNumber'], unique: true }],
  hooks: {
    beforeValidate: [
      ({ data }) => {
        // A criterion without a key gets one from its name (the key is what the formula uses)
        if (data && Array.isArray(data.criteria)) for (const c of data.criteria) if (c && !c.key && c.label) c.key = slugKey(c.label)
        return data
      },
    ],
    beforeChange: [
      async ({ data, originalDoc, operation, req }) => {
        const next = { ...(originalDoc || {}), ...data }
        if (req.user && !canFor(req.user as any, 'judging.manage', next.event && typeof next.event === 'object' ? next.event.id : next.event)) {
          throw new APIError('You may only manage judging rounds of your own competitions.', 403)
        }
        if (operation === 'update' && originalDoc && scoringSignature(originalDoc) !== scoringSignature(next)) {
          const n = await countScores(req, originalDoc.id)
          if (n > 0) {
            throw new APIError(
              `Judges have already scored this round (${n} score${n === 1 ? '' : 's'}), so its criteria, marks, formula, competition and round number are locked. Labels, guidance, judges, status and what judges see can still change.`,
              400,
            )
          }
        }
        return data
      },
    ],
    afterChange: [
      ({ doc, previousDoc, req, operation }) => {
        if (operation === 'create' || previousDoc?.status !== doc.status || scoringSignature(previousDoc) !== scoringSignature(doc)) {
          logger.audit(String((req.user as any)?.email || 'system'), operation === 'create' ? 'JUDGING_ROUND_CREATED' : 'JUDGING_ROUND_CHANGED', 'JudgingRound', String(doc.id), {
            status: doc.status,
            signature: scoringSignature(doc),
          })
        }
        return doc
      },
    ],
    beforeDelete: [
      async ({ id, req }) => {
        const n = await countScores(req, id)
        if (n > 0) throw new APIError(`This round has ${n} judge score${n === 1 ? '' : 's'}. Delete them first (Judge scores) if you really want to remove the round.`, 400)
      },
    ],
  },
  fields: [
    { name: 'title', type: 'text', required: true, maxLength: 120, admin: { description: 'Shown to judges, e.g. "Hackathon · Round 1 (PPT screening)".' } },
    {
      type: 'row',
      fields: [
        { name: 'event', label: 'Competition', type: 'relationship', relationTo: 'events', required: true, index: true },
        { name: 'roundNumber', type: 'number', required: true, min: 1, max: 20, defaultValue: 1, admin: { description: 'Matches the submission round (Round 1 = the PPT).', step: 1 } },
        {
          name: 'status',
          type: 'select',
          required: true,
          defaultValue: 'DRAFT',
          options: [
            { label: 'Draft (judges don\'t see it)', value: 'DRAFT' },
            { label: 'Open (judges can score)', value: 'OPEN' },
            { label: 'Closed (scores locked)', value: 'CLOSED' },
          ],
        },
      ],
    },
    {
      name: 'teams',
      label: 'Teams to score',
      type: 'select',
      required: true,
      defaultValue: 'confirmed',
      options: [
        { label: 'Teams that submitted for this round', value: 'submitted' },
        { label: 'Teams qualified in the previous round', value: 'qualified' },
        { label: 'All confirmed teams', value: 'confirmed' },
      ],
      admin: { description: '"Qualified in the previous round" = Qualified on its submission or on the previous judging round.' },
    },
    {
      name: 'judges',
      type: 'relationship',
      relationTo: 'users',
      hasMany: true,
      filterOptions: { role: { equals: 'JUDGE' } },
      admin: { description: 'Judge accounts that score this round (create them in Accounts as type "Judge"). They sign in at /login and land on /judge.' },
    },
    {
      name: 'criteria',
      type: 'array',
      minRows: 1,
      maxRows: 30,
      labels: { singular: 'Criterion', plural: 'Criteria' },
      admin: { description: 'Add, remove or change criteria freely until the first judge has scored; then they lock.', initCollapsed: false },
      validate: (rows: any) => {
        const keys = (Array.isArray(rows) ? rows : []).map((r: any) => r?.key).filter(Boolean)
        const dup = keys.find((k: string, i: number) => keys.indexOf(k) !== i)
        return dup ? `Two criteria have the key "${dup}". Each key must be different.` : true
      },
      fields: [
        {
          type: 'row',
          fields: [
            { name: 'label', label: 'Criterion', type: 'text', required: true, maxLength: 80 },
            {
              name: 'key',
              type: 'text',
              maxLength: 32,
              admin: { description: 'Name used in the formula (filled in from the criterion if empty): lowercase letters, digits, _.' },
              validate: (v: any) => {
                if (!v) return true
                if (!CRITERION_KEY.test(v)) return 'Use lowercase letters, digits and _ (start with a letter, at most 32).'
                if (RESERVED_NAMES.has(v)) return `"${v}" is reserved (a function or "total"). Choose another key.`
                return true
              },
            },
          ],
        },
        {
          type: 'row',
          fields: [
            { name: 'min', label: 'Lowest mark', type: 'number', required: true, defaultValue: 0, min: -1000, max: 1000 },
            {
              name: 'max',
              label: 'Highest mark',
              type: 'number',
              required: true,
              min: -1000,
              max: 1000,
              validate: (v: any, { siblingData }: any) => (Number(v) > Number(siblingData?.min ?? 0) ? true : 'The highest mark must be above the lowest.'),
            },
            { name: 'step', label: 'Steps of', type: 'number', defaultValue: 1, min: 0, max: 100, admin: { description: '1 = whole marks, 0.5 = halves, 0 = any value.' } },
          ],
        },
        { name: 'guidance', type: 'textarea', maxLength: 600, admin: { description: 'Shown to judges under the criterion (what earns high marks).' } },
      ],
    },
    {
      name: 'formula',
      label: 'Scoring formula',
      type: 'textarea',
      maxLength: FORMULA_MAX_LENGTH,
      admin: { description: FORMULA_HELP, placeholder: 'empty = sum of all criteria' },
      validate: (v: any, { data }: any) => {
        const criteria = roundOf({ criteria: (data?.criteria || []).map((c: any) => ({ ...c, key: c?.key || slugKey(c?.label) })) }).criteria
        try {
          const f = roundFormula(criteria, v)
          void formulaRange(f, criteria)
          return true
        } catch (e) {
          return formulaMessage(e)
        }
      },
    },
    { name: 'decimals', label: 'Decimals shown', type: 'number', defaultValue: 2, min: 0, max: 4, admin: { step: 1 } },
    {
      name: 'judgeView',
      label: 'What judges can see and do',
      type: 'group',
      admin: { description: 'Untick to hide things from judges (e.g. names and colleges for blind judging). Contacts are never shown.' },
      fields: [
        {
          type: 'row',
          fields: [
            { name: 'teamName', label: 'Team name', type: 'checkbox', defaultValue: true },
            { name: 'college', label: 'College / school', type: 'checkbox', defaultValue: true },
            { name: 'members', label: 'Member names', type: 'checkbox', defaultValue: true },
            { name: 'project', label: 'Project title, track and links', type: 'checkbox', defaultValue: true },
          ],
        },
        {
          type: 'row',
          fields: [
            { name: 'file', label: 'Download the submitted file', type: 'checkbox', defaultValue: true },
            { name: 'otherScores', label: "See other judges' scores", type: 'checkbox', defaultValue: false },
            { name: 'editAfterSubmit', label: 'Change their score until the round closes', type: 'checkbox', defaultValue: true },
            { name: 'remarksRequired', label: 'Remarks required', type: 'checkbox', defaultValue: false },
          ],
        },
      ],
    },
  ],
}

const ro = { readOnly: true }

export const JudgeScores: CollectionConfig = {
  slug: 'judge-scores',
  labels: { singular: 'Judge score', plural: 'Judge scores' },
  forceSelect: { event: true },
  admin: {
    group: 'AURIX',
    defaultColumns: ['registration', 'round', 'judge', 'total', 'submittedAt'],
    description: 'Every judge\'s marks per team (written at /judge). Rankings and decisions: /judging. Delete a score only to let a judge start again.',
    hidden: hiddenUnlessAny(['judging.results']),
  },
  access: {
    read: keyAccess('judging.results', 'event'),
    create: () => false,
    update: () => false,
    delete: keyAccess('judging.manage', 'event'),
  },
  indexes: [{ fields: ['round', 'registration', 'judge'], unique: true }],
  hooks: {
    afterDelete: [
      ({ doc, req }) => {
        logger.audit(String((req.user as any)?.email || 'system'), 'JUDGE_SCORE_DELETED', 'JudgeScore', String(doc.id), { round: doc.round?.id ?? doc.round, registration: doc.registration?.id ?? doc.registration })
      },
    ],
  },
  fields: [
    { type: 'row', fields: [
      { name: 'round', type: 'relationship', relationTo: 'judging-rounds', required: true, index: true, admin: ro },
      { name: 'registration', label: 'Team', type: 'relationship', relationTo: 'event-registrations', required: true, index: true, admin: ro },
    ] },
    { type: 'row', fields: [
      { name: 'judge', type: 'relationship', relationTo: 'users', required: true, index: true, admin: ro },
      { name: 'event', label: 'Competition', type: 'relationship', relationTo: 'events', required: true, admin: ro },
    ] },
    { name: 'marks', type: 'json', required: true, admin: { ...ro, description: 'Criterion key → mark.' } },
    { type: 'row', fields: [
      { name: 'total', label: 'Score (formula)', type: 'number', required: true, admin: ro },
      { name: 'submittedAt', type: 'date', required: true, admin: { ...ro, date: { pickerAppearance: 'dayAndTime' } } },
    ] },
    { name: 'remarks', label: 'Remarks (staff only)', type: 'textarea', maxLength: 2000, admin: ro },
  ],
}

export const JudgingDecisions: CollectionConfig = {
  slug: 'judging-decisions',
  labels: { singular: 'Judging decision', plural: 'Judging decisions' },
  forceSelect: { event: true },
  admin: {
    group: 'AURIX',
    defaultColumns: ['registration', 'round', 'decision', 'decidedBy', 'decidedAt'],
    description: 'Qualified / Not qualified per team and round, set at /judging. For a round with submissions it also sets the submission\'s review status.',
    hidden: hiddenUnlessAny(['judging.results']),
  },
  access: { read: keyAccess('judging.results', 'event'), create: () => false, update: () => false, delete: () => false },
  indexes: [{ fields: ['round', 'registration'], unique: true }],
  fields: [
    { type: 'row', fields: [
      { name: 'round', type: 'relationship', relationTo: 'judging-rounds', required: true, index: true, admin: ro },
      { name: 'registration', label: 'Team', type: 'relationship', relationTo: 'event-registrations', required: true, index: true, admin: ro },
      { name: 'event', label: 'Competition', type: 'relationship', relationTo: 'events', required: true, admin: ro },
    ] },
    { type: 'row', fields: [
      { name: 'decision', type: 'select', required: true, options: [{ label: 'Qualified', value: 'QUALIFIED' }, { label: 'Not qualified', value: 'NOT_QUALIFIED' }], admin: ro },
      { name: 'decidedBy', type: 'text', admin: ro },
      { name: 'decidedAt', type: 'date', admin: { ...ro, date: { pickerAppearance: 'dayAndTime' } } },
    ] },
  ],
}
