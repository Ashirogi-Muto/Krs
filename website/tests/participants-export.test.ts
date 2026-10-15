import test from 'node:test'
import assert from 'node:assert/strict'
import { csvBody, csvCell } from '../src/lib/csv'
import { parseParticipantFilters, participantFilterQuery, participantWhere, teamsOf, type RegistrationLinks } from '../src/lib/participant-accounts'

// Admin tools → Participants → Export CSV (owner, 15 Oct 2026): the export uses exactly the screen's filters
const links: RegistrationLinks = {
  ids: new Map([['7', [{ code: 'AX26-HAC-AAAAAA', event: 'Hackathon' }]]]),
  emails: new Map([['lead@x.in', [{ code: 'AX26-HAC-AAAAAA', event: 'Hackathon' }, { code: 'AX26-BGM-BBBBBB', event: 'BGMI' }]]]),
}

test('filters: read from the query string, unknown values fall back to "all", round-trip into the export link', () => {
  const f = parseParticipantFilters(new URLSearchParams('q=%20Arjun%20&status=confirmed&team=yes&sort=name&evil=1'))
  assert.deepEqual(f, { q: 'Arjun', status: 'confirmed', team: 'yes', sort: 'name' })
  assert.deepEqual(parseParticipantFilters({ status: 'drop table', team: ['no'], sort: 'password' }), { q: '', status: 'all', team: 'no', sort: 'newest' })
  assert.equal(participantFilterQuery(f), 'q=Arjun&status=confirmed&team=yes&sort=name')
  assert.equal(participantFilterQuery(parseParticipantFilters({})), 'sort=newest')
  assert.equal(parseParticipantFilters({ q: 'x'.repeat(500) }).q.length, 100)
})

test('query: participants only, plus each filter the screen offers', () => {
  const now = new Date('2026-10-15T00:00:00Z')
  const w = (o: Partial<ReturnType<typeof parseParticipantFilters>>) => JSON.stringify(participantWhere({ q: '', status: 'all', team: 'all', sort: 'newest', ...o }, links, now))
  assert.equal(w({}), JSON.stringify({ and: [{ role: { equals: 'PARTICIPANT' } }] }))
  assert.ok(w({ q: 'arj' }).includes('{"phone":{"like":"arj"}}'))
  assert.ok(w({ status: 'confirmed' }).includes('{"emailVerified":{"equals":true}}'))
  assert.ok(w({ status: 'unconfirmed' }).includes('{"emailVerified":{"exists":false}}'))
  assert.ok(w({ status: 'locked' }).includes('"lockUntil":{"greater_than":"2026-10-15T00:00:00.000Z"}'))
  assert.ok(w({ team: 'yes' }).includes('{"id":{"in":[7,-1]}}') && w({ team: 'yes' }).includes('{"email":{"in":["lead@x.in","-"]}}'))
  assert.ok(w({ team: 'no' }).includes('{"id":{"not_in":[7,-1]}}') && w({ team: 'no' }).includes('{"email":{"not_in":["lead@x.in","-"]}}'))
})

test('teams of an account: linked account and leader email, without duplicates', () => {
  assert.deepEqual(teamsOf(links, { id: 7, email: 'LEAD@x.in' }).map((t) => t.code), ['AX26-HAC-AAAAAA', 'AX26-BGM-BBBBBB'])
  assert.deepEqual(teamsOf(links, { id: 8, email: 'other@x.in' }), [])
})

test('CSV: quoted cells, spreadsheet formulas neutralised, BOM + CRLF', () => {
  assert.equal(csvCell('Arjun "OP"'), '"Arjun ""OP"""')
  for (const bad of ['=HYPERLINK("x")', '+91 98', '-1', '@SUM(A1)', '\tx']) assert.ok(csvCell(bad).startsWith(`"'`), bad)
  assert.equal(csvCell(null), '""')
  assert.equal(csvBody([['a', 1], ['b', null]]), '﻿"a","1"\r\n"b",""\r\n')
})
