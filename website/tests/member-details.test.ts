import test from 'node:test'
import assert from 'node:assert/strict'
import { cleanBranch, cleanYear, YEAR_ADMIN_LABELS, YEAR_VALUES } from '../src/lib/member-details'
import { formatDateRange } from '../src/lib/format'
import { formatSize, templatePrefix, findTemplate } from '../src/lib/templates'
import { DEFAULT_FORM_TEXTS } from '../src/lib/form-texts-defaults'

/** Optional branch + year/class per member (owner, 11 Oct 2026): school students (classes 5–12) can register too. */
test('branch: optional, letters and single spaces only', () => {
  assert.equal(cleanBranch(undefined), '')
  assert.equal(cleanBranch('   '), '')
  assert.equal(cleanBranch('  Computer   Science '), 'Computer Science')
  assert.equal(cleanBranch('ECE'), 'ECE')
  assert.equal(cleanBranch('CSE-AI'), false)
  assert.equal(cleanBranch('CSE 2'), false)
  assert.equal(cleanBranch('<script>'), false)
  assert.equal(cleanBranch('A'.repeat(61)), false)
})

test('year: optional, college years 1–4 or school classes 5–12 only', () => {
  assert.equal(cleanYear(''), '')
  assert.equal(cleanYear(null), '')
  assert.equal(cleanYear('Y1'), 'Y1')
  assert.equal(cleanYear('C12'), 'C12')
  assert.equal(cleanYear('C4'), false)
  assert.equal(cleanYear('Y5'), false)
  assert.equal(cleanYear('1st year'), false)
  assert.deepEqual([...YEAR_VALUES], ['Y1', 'Y2', 'Y3', 'Y4', 'C5', 'C6', 'C7', 'C8', 'C9', 'C10', 'C11', 'C12'])
  for (const v of YEAR_VALUES) {
    assert.ok(YEAR_ADMIN_LABELS[v], v)
    // Every option has CMS wording on the registration form
    assert.ok((DEFAULT_FORM_TEXTS as any).registration?.[`y${v}`], `form text y${v}`)
  }
})

test('one-day events show a single date (all AURIX competitions on 27 Oct 2026)', () => {
  assert.equal(formatDateRange('2026-10-27T03:30:00Z', '2026-10-27T11:30:00Z'), '27 Oct 2026')
  assert.equal(formatDateRange('2026-10-27T03:30:00Z', '2026-10-27T15:30:00Z'), '27 Oct 2026')
  assert.equal(formatDateRange('2026-10-27T03:30:00Z', '2026-10-28T11:30:00Z'), '27–28 Oct 2026')
})

test('presentation templates: folder per event round, readable size, nothing without R2 or with a bad slug', async () => {
  assert.equal(templatePrefix('hackathon', 1), 'templates/hackathon/round-1/')
  assert.equal(formatSize(2_500_000), '2.4 MB')
  assert.equal(formatSize(300), '1 KB')
  // Tests run without R2 settings
  assert.equal(await findTemplate('hackathon', 1), null)
  assert.equal(await findTemplate('../submissions', 1), null)
  assert.equal(await findTemplate('hackathon', 0), null)
})
