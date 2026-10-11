import { isR2Configured, listObjects } from './r2'

/**
 * Presentation templates for submission rounds (owner, 11 Oct 2026): a file in the private R2 bucket under
 * `templates/<event slug>/round-<n>/<file name>`. Participants download it from the portal's submission page through
 * a short signed link (/api/aurix/templates/<slug>/<round>, login required). To replace it, put a new file in that
 * folder and delete the old one. The leftover sweep and the data retention never touch `templates/`.
 */
export type Template = { key: string; name: string; size: number }

const cache = new Map<string, { at: number; value: Template | null }>()
const TTL_MS = 5 * 60_000

export const templatePrefix = (slug: string, round: number) => `templates/${slug}/round-${round}/`

/** The newest file in the round's template folder (cached 5 minutes), or null. */
export async function findTemplate(slug: string, round: number, now = Date.now()): Promise<Template | null> {
  if (!isR2Configured() || !/^[a-z0-9-]+$/.test(slug) || !Number.isInteger(round) || round < 1) return null
  const prefix = templatePrefix(slug, round)
  const hit = cache.get(prefix)
  if (hit && now - hit.at < TTL_MS) return hit.value
  let value: Template | null = null
  try {
    const files = (await listObjects(prefix)).filter((o) => o.key.length > prefix.length && !o.key.endsWith('/'))
    const newest = files.sort((a, b) => b.modified - a.modified)[0]
    if (newest) value = { key: newest.key, name: newest.key.slice(prefix.length), size: newest.size }
  } catch {
    value = null
  }
  cache.set(prefix, { at: now, value })
  return value
}

export const formatSize = (bytes: number) => (bytes >= 1024 * 1024 ? `${(bytes / 1024 / 1024).toFixed(1)} MB` : `${Math.max(1, Math.round(bytes / 1024))} KB`)
