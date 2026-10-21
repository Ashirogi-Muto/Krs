/**
 * The filters, search and sort of a CMS list page, read from its URL (owner, 21 Oct 2026: "make sure all exports follow
 * the filters set on the event registration page"). Payload's list puts them in the query string in bracket form:
 *   where[or][0][and][0][status][equals]=PENDING&search=robo&sort=-createdAt
 * Pure and bounded (length, entries, depth; no prototype keys). The export runs the result through Payload as the
 * signed-in person, so Payload checks every field and operator (and refuses fields that person may not read).
 */
export type ListQuery = { where: Record<string, unknown> | null; search: string; sort: string | null }

const MAX_LENGTH = 8000
const MAX_ENTRIES = 200
const MAX_DEPTH = 12
const BAD = new Set(['__proto__', 'constructor', 'prototype'])

export class ListQueryError extends Error {}

/** Objects whose keys are 0..n-1 become arrays (qs style). */
function arrays(x: unknown): unknown {
  if (!x || typeof x !== 'object') return x
  const o = x as Record<string, unknown>
  const keys = Object.keys(o)
  for (const k of keys) o[k] = arrays(o[k])
  if (keys.length && keys.every((k, i) => k === String(i))) return keys.map((k) => o[k])
  return o
}

export function parseListQuery(query: string | URLSearchParams): ListQuery {
  const params = typeof query === 'string' ? new URLSearchParams(query.replace(/^\?/, '')) : query
  if (params.toString().length > MAX_LENGTH) throw new ListQueryError('too long')
  const root: Record<string, unknown> = Object.create(null)
  let entries = 0
  let any = false
  for (const [key, value] of params) {
    if (!key.startsWith('where[')) continue
    if (++entries > MAX_ENTRIES) throw new ListQueryError('too many filters')
    const path = [...key.slice(5).matchAll(/\[([^\][]*)\]/g)].map((m) => m[1])
    if (!path.length || path.length > MAX_DEPTH || path.join('').length + path.length * 2 !== key.length - 5) throw new ListQueryError('bad key')
    if (path.some((p) => BAD.has(p) || p === '')) throw new ListQueryError('bad key')
    let node = root
    for (let i = 0; i < path.length - 1; i++) {
      const next = node[path[i]]
      if (next !== undefined && (typeof next !== 'object' || next === null)) throw new ListQueryError('bad key')
      node = (next as Record<string, unknown>) ?? (node[path[i]] = Object.create(null))
    }
    node[path[path.length - 1]] = value
    any = true
  }
  const sortRaw = params.get('sort')
  const sort = sortRaw && /^-?[A-Za-z0-9_.]{1,64}$/.test(sortRaw) ? sortRaw : null
  return { where: any ? (JSON.parse(JSON.stringify(arrays(root))) as Record<string, unknown>) : null, search: (params.get('search') || '').trim().slice(0, 100), sort }
}

/** The list's search box: Payload searches the collection's listSearchableFields with "like". */
export const searchWhere = (search: string, fields: string[]) => (search ? { or: fields.map((f) => ({ [f]: { like: search } })) } : null)
