import test from 'node:test'
import assert from 'node:assert/strict'
import { checkAnswers, questionsOf } from '../src/lib/member-questions'
import { formatFee, formatTeamSize } from '../src/lib/format'

// BGMI launch (owner, 13 Oct 2026): each player's in-game name and player ID; ₹99 per player, solo
const BGMI = questionsOf([
  { label: 'In-game name (IGN)', format: 'TEXT', maxLength: 30, required: true },
  { label: 'BGMI player ID', format: 'DIGITS', maxLength: 15, required: true },
  { label: 'Clan (optional)', format: 'TEXT', maxLength: 20, required: false },
])

test('questions: cleaned from the CMS (labels needed, at most 5, lengths 1–60, text or digits)', () => {
  assert.equal(questionsOf(null).length, 0)
  assert.equal(questionsOf([{ label: '' }, { label: '  ' }, { help: 'x' }]).length, 0)
  assert.equal(questionsOf(Array.from({ length: 8 }, (_, i) => ({ label: `Q${i}` }))).length, 5)
  const [q] = questionsOf([{ label: ' IGN ', maxLength: 500, format: 'WHAT' }])
  assert.deepEqual(q, { label: 'IGN', help: null, required: true, format: 'TEXT', maxLength: 60 })
})

test('answers: required, digits only, length and odd characters are checked; optional ones may be empty', () => {
  assert.deepEqual(checkAnswers(BGMI, ['  Ace   Hunter ', '5123456789', '']), {
    ok: true,
    answers: [
      { question: 'In-game name (IGN)', answer: 'Ace Hunter' },
      { question: 'BGMI player ID', answer: '5123456789' },
    ],
  })
  assert.deepEqual(checkAnswers(BGMI, ['', '1']), { ok: false, question: 'In-game name (IGN)', reason: 'missing' })
  assert.deepEqual(checkAnswers(BGMI, ['Ace', '51-23']), { ok: false, question: 'BGMI player ID', reason: 'digits' })
  assert.deepEqual(checkAnswers(BGMI, ['Ace', '1234567890123456']), { ok: false, question: 'BGMI player ID', reason: 'invalid' }, 'longer than 15')
  assert.deepEqual(checkAnswers(BGMI, ['<script>', '1']), { ok: false, question: 'In-game name (IGN)', reason: 'invalid' })
  assert.deepEqual(checkAnswers(BGMI, ['Ace\u0007', '1']), { ok: false, question: 'In-game name (IGN)', reason: 'invalid' })
  assert.deepEqual(checkAnswers(BGMI, 'not a list'), { ok: false, question: 'In-game name (IGN)', reason: 'missing' })
  assert.deepEqual(checkAnswers([], ['anything']), { ok: true, answers: [] }, 'competitions without questions ignore extra answers')
})

test('fee and team size wording: the competition\'s own unit, and "Solo" for one-player competitions', () => {
  assert.equal(formatFee(99, false, undefined, ' / player'), '₹99 / player')
  assert.equal(formatFee(499), '₹499 / team')
  assert.equal(formatFee(99, true, undefined, ' / player'), 'Coming Soon')
  assert.equal(formatTeamSize(1, 1), 'Solo (1 player)')
  assert.equal(formatTeamSize(1, 3), '1–3 members')
  assert.equal(formatTeamSize(2, 2), '2 members')
})
