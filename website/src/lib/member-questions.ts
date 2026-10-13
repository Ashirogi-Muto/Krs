/**
 * Extra questions for every player of a competition (owner, 13 Oct 2026; first used by the BGMI Tournament: in-game
 * name and player ID). Set per competition in CMS → Events → Registration & fee; asked for each member on the
 * registration form, checked again on the server, stored on the registration (members → answers). Pure rules
 * (tests/member-questions.test.ts).
 */
export type MemberQuestion = { label: string; help?: string | null; required?: boolean | null; format?: 'TEXT' | 'DIGITS' | string | null; maxLength?: number | null }
export type MemberAnswer = { question: string; answer: string }

export const MAX_QUESTIONS = 5
const MAX_LEN = 60

export const questionsOf = (v: unknown): MemberQuestion[] =>
  (Array.isArray(v) ? v : [])
    .filter((q: any) => q && typeof q.label === 'string' && q.label.trim())
    .slice(0, MAX_QUESTIONS)
    .map((q: any) => ({
      label: String(q.label).trim(),
      help: q.help ? String(q.help) : null,
      required: q.required !== false,
      format: q.format === 'DIGITS' ? 'DIGITS' : 'TEXT',
      maxLength: Math.min(MAX_LEN, Math.max(1, Number(q.maxLength) || MAX_LEN)),
    }))

/**
 * The cleaned answers of one member, in question order, or the first question that fails: missing (required),
 * not digits, too long, or with control characters.
 */
export function checkAnswers(questions: MemberQuestion[], raw: unknown): { ok: true; answers: MemberAnswer[] } | { ok: false; question: string; reason: 'missing' | 'digits' | 'invalid' } {
  const given = Array.isArray(raw) ? raw : []
  const answers: MemberAnswer[] = []
  for (let i = 0; i < questions.length; i++) {
    const q = questions[i]
    const v = String(given[i] ?? '').trim().replace(/\s+/g, ' ')
    if (!v) {
      if (q.required) return { ok: false, question: q.label, reason: 'missing' }
      continue
    }
    // eslint-disable-next-line no-control-regex
    if (v.length > (q.maxLength || MAX_LEN) || /[\u0000-\u001f\u007f<>]/.test(v)) return { ok: false, question: q.label, reason: 'invalid' }
    if (q.format === 'DIGITS' && !/^\d+$/.test(v)) return { ok: false, question: q.label, reason: 'digits' }
    answers.push({ question: q.label, answer: v })
  }
  return { ok: true, answers }
}
