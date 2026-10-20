import { APIError, type CollectionConfig } from 'payload'
import { anyKeyAccess, hiddenUnlessAny, keyAccess, superAdminOnly } from '../access/roles'
import { can, canFor } from '../access/permissions'
import { CRITERION_KEY, FormulaError, FORMULA_FUNCTIONS, FORMULA_MAX_LENGTH, RESERVED_NAMES, formulaRange, roundFormula } from '../../lib/formula'
import { checkMarks, judgeTotal, JUDGE_ROLES, marksFromText, mayJudge, roundOf, scoringSignature, type Round } from '../../lib/judging'
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
      // Judge accounts, and the Super Admin (owner, 20 Oct 2026)
      filterOptions: { role: { in: JUDGE_ROLES } },
      admin: { description: 'Judge accounts that score this round (create them in Accounts as type "Judge"; the Super Admin can be picked too). They sign in at /login and land on /judge.' },
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
const idOf = (x: any): number => Number(x && typeof x === 'object' ? x.id : x)
const who = (req: any) => String(req.user?.email || 'system')

/** The round of a score/decision (refused when it does not exist). */
async function roundFor(req: any, round: unknown) {
  const doc = await req.payload.findByID({ collection: 'judging-rounds', id: idOf(round), depth: 0, overrideAccess: true, req }).catch(() => null)
  if (!doc) throw new APIError('Choose an existing judging round.', 400)
  return roundOf(doc)
}

/** CMS saves (Super Admin): the team must belong to the round's competition. */
async function checkTeam(req: any, registration: unknown, event: number) {
  const reg: any = await req.payload.findByID({ collection: 'event-registrations', id: idOf(registration), depth: 0, overrideAccess: true, req }).catch(() => null)
  if (!reg || idOf(reg.event) !== event) throw new APIError('This team is not registered for the round\'s competition.', 400)
  return reg
}

/** A decision's round-submission review status follows the decision (the portal opens the next round from it). */
async function syncSubmission(req: any, round: Round, registration: unknown, status: string) {
  const { docs } = await req.payload.find({
    collection: 'round-submissions',
    overrideAccess: true,
    depth: 0,
    limit: 1,
    req,
    where: { and: [{ registration: { equals: idOf(registration) } }, { event: { equals: round.event } }, { roundNumber: { equals: round.roundNumber } }] },
  })
  if (docs[0] && docs[0].status !== status) await req.payload.update({ collection: 'round-submissions', id: docs[0].id, overrideAccess: true, req, data: { status } })
}

/**
 * Judge scores. Written at /judge; the Super Admin can also add or correct one in the CMS (owner, 20 Oct 2026: "B … only
 * for super admin"). Either way the marks are checked against the round's criteria and the score is worked out here
 * with the round's formula, so a score never disagrees with its marks. CMS changes are audit-logged with the old values.
 */
export const JudgeScores: CollectionConfig = {
  slug: 'judge-scores',
  labels: { singular: 'Judge score', plural: 'Judge scores' },
  forceSelect: { event: true },
  admin: {
    group: 'AURIX',
    defaultColumns: ['registration', 'round', 'judge', 'total', 'submittedAt'],
    description:
      'Every judge\'s marks per team (written at /judge). Rankings and decisions: /judging. The Super Admin can add or correct a score here: edit the marks (criterion key → mark); the score is recalculated with the round\'s formula. Delete a score to let a judge start again.',
    hidden: hiddenUnlessAny(['judging.results']),
  },
  access: {
    read: keyAccess('judging.results', 'event'),
    create: superAdminOnly,
    update: superAdminOnly,
    delete: keyAccess('judging.manage', 'event'),
  },
  indexes: [{ fields: ['round', 'registration', 'judge'], unique: true }],
  hooks: {
    beforeValidate: [
      async ({ data, originalDoc, req }) => {
        if (!data) return data
        // CMS: the marks box (components/JsonTextField) sends its text as "key: mark" lines when it was edited
        if (typeof data.marks === 'string') {
          if (!req.user) throw new APIError('Marks must be an object.', 400)
          const parsed = marksFromText(data.marks)
          if (!parsed.ok) throw new APIError(`Marks, line ${parsed.line}: write one criterion per line as "key: mark", e.g. "innovation: 15".`, 400)
          data.marks = parsed.marks
        }
        const next = { ...(originalDoc || {}), ...data }
        const round = await roundFor(req, next.round)
        if (req.user) {
          await checkTeam(req, next.registration, round.event)
          const judge: any = await req.payload.findByID({ collection: 'users', id: idOf(next.judge), depth: 0, overrideAccess: true, req }).catch(() => null)
          if (!mayJudge(judge)) throw new APIError('The judge must be a Judge account (or the Super Admin).', 400)
        }
        const checked = checkMarks(round.criteria, next.marks)
        if (!checked.ok) {
          const c = round.criteria.find((x) => x.key === checked.key)!
          throw new APIError(
            checked.reason === 'missing'
              ? `Give a mark for "${c.label}" (key "${c.key}").`
              : checked.reason === 'range'
                ? `"${c.label}" must be between ${c.min} and ${c.max}.`
                : `"${c.label}" must be in steps of ${c.step}.`,
            400,
          )
        }
        return { ...data, marks: checked.marks, total: judgeTotal(round, checked.marks), event: round.event, submittedAt: next.submittedAt || new Date().toISOString() }
      },
    ],
    afterChange: [
      ({ doc, previousDoc, operation, req }) => {
        // CMS saves only (the /judge API logs its own): keep the old values
        if (req.user) {
          logger.audit(who(req), operation === 'create' ? 'JUDGE_SCORE_ADDED_IN_CMS' : 'JUDGE_SCORE_CORRECTED_IN_CMS', 'JudgeScore', String(doc.id), {
            round: idOf(doc.round),
            registration: idOf(doc.registration),
            judge: idOf(doc.judge),
            before: previousDoc ? { marks: previousDoc.marks, total: previousDoc.total, remarks: previousDoc.remarks } : null,
            after: { marks: doc.marks, total: doc.total, remarks: doc.remarks },
          })
        }
        return doc
      },
    ],
    afterDelete: [
      ({ doc, req }) => {
        logger.audit(who(req), 'JUDGE_SCORE_DELETED', 'JudgeScore', String(doc.id), { round: idOf(doc.round), registration: idOf(doc.registration), marks: doc.marks, total: doc.total })
      },
    ],
  },
  fields: [
    { type: 'row', fields: [
      { name: 'round', type: 'relationship', relationTo: 'judging-rounds', required: true, index: true },
      { name: 'registration', label: 'Team', type: 'relationship', relationTo: 'event-registrations', required: true, index: true },
    ] },
    { type: 'row', fields: [
      { name: 'judge', type: 'relationship', relationTo: 'users', required: true, index: true, filterOptions: { role: { in: JUDGE_ROLES } } },
      { name: 'event', label: 'Competition (from the round)', type: 'relationship', relationTo: 'events', required: true, admin: ro },
    ] },
    {
      name: 'marks',
      label: 'Marks',
      type: 'json',
      required: true,
      // Text editor (the JSON editor's script is blocked by the CSP); the hook above parses and checks it
      validate: (v: unknown) => (v && (typeof v === 'object' || typeof v === 'string') ? true : 'Give the marks.'),
      admin: {
        description: 'One criterion per line as "key: mark", e.g. "innovation: 15". Every criterion of the round is needed (keys: see the round).',
        components: { Field: { path: '@/payload/components/JsonTextField#JsonTextField', clientProps: { mode: 'marks', rows: 8 } } },
      },
    },
    { type: 'row', fields: [
      { name: 'total', label: 'Score (worked out with the round\'s formula)', type: 'number', required: true, admin: ro },
      { name: 'submittedAt', type: 'date', required: true, admin: { ...ro, date: { pickerAppearance: 'dayAndTime' } } },
    ] },
    { name: 'remarks', label: 'Remarks (staff only)', type: 'textarea', maxLength: 2000 },
  ],
}

/**
 * Qualified / Not qualified per team and round. Set at /judging; the Super Admin can also add, change or remove one in
 * the CMS (owner, 20 Oct 2026). A CMS change also sets the team's submission review status, like /judging does.
 */
export const JudgingDecisions: CollectionConfig = {
  slug: 'judging-decisions',
  labels: { singular: 'Judging decision', plural: 'Judging decisions' },
  forceSelect: { event: true },
  admin: {
    group: 'AURIX',
    defaultColumns: ['registration', 'round', 'decision', 'decidedBy', 'decidedAt'],
    description:
      'Qualified / Not qualified per team and round, set at /judging. For a round with submissions it also sets the submission\'s review status. The Super Admin can also add, change or remove a decision here.',
    hidden: hiddenUnlessAny(['judging.results']),
  },
  access: { read: keyAccess('judging.results', 'event'), create: superAdminOnly, update: superAdminOnly, delete: superAdminOnly },
  indexes: [{ fields: ['round', 'registration'], unique: true }],
  hooks: {
    beforeValidate: [
      async ({ data, originalDoc, req }) => {
        if (!data || !req.user) return data
        const next = { ...(originalDoc || {}), ...data }
        const round = await roundFor(req, next.round)
        await checkTeam(req, next.registration, round.event)
        return { ...data, event: round.event, decidedBy: String((req.user as any).name || (req.user as any).email), decidedAt: new Date().toISOString() }
      },
    ],
    afterChange: [
      async ({ doc, previousDoc, operation, req }) => {
        if (!req.user) return doc
        await syncSubmission(req, await roundFor(req, doc.round), doc.registration, doc.decision)
        logger.audit(who(req), 'JUDGING_DECISION_SET_IN_CMS', 'JudgingDecision', String(doc.id), {
          operation,
          round: idOf(doc.round),
          registration: idOf(doc.registration),
          before: previousDoc?.decision ?? null,
          after: doc.decision,
        })
        return doc
      },
    ],
    afterDelete: [
      async ({ doc, req }) => {
        if (!req.user) return
        const round = await roundFor(req, doc.round).catch(() => null)
        if (round) await syncSubmission(req, round, doc.registration, 'UNDER_REVIEW')
        logger.audit(who(req), 'JUDGING_DECISION_REMOVED_IN_CMS', 'JudgingDecision', String(doc.id), { round: idOf(doc.round), registration: idOf(doc.registration), before: doc.decision })
      },
    ],
  },
  fields: [
    { type: 'row', fields: [
      { name: 'round', type: 'relationship', relationTo: 'judging-rounds', required: true, index: true },
      { name: 'registration', label: 'Team', type: 'relationship', relationTo: 'event-registrations', required: true, index: true },
      { name: 'event', label: 'Competition (from the round)', type: 'relationship', relationTo: 'events', required: true, admin: ro },
    ] },
    { type: 'row', fields: [
      { name: 'decision', type: 'select', required: true, options: [{ label: 'Qualified', value: 'QUALIFIED' }, { label: 'Not qualified', value: 'NOT_QUALIFIED' }] },
      { name: 'decidedBy', type: 'text', admin: ro },
      { name: 'decidedAt', type: 'date', admin: { ...ro, date: { pickerAppearance: 'dayAndTime' } } },
    ] },
  ],
}
