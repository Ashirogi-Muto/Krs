import type { Payload } from 'payload'
import { deleteObject, isR2Configured, listObjects } from './r2'
import { logger } from './logger'

/**
 * Leftover submission files (owner, 9 Oct 2026). A file can reach R2 without a submission pointing to it: the leader
 * closed the page between "upload" and "save", or saved from two devices at the same moment. Such files are deleted
 * once they are older than ORPHAN_AGE_MS: well past the 30-minute upload token and the 15-minute deadline grace, so a
 * save still in progress is never touched. Only keys under `submissions/` are considered.
 */
export const SUBMISSIONS_PREFIX = 'submissions/'
export const ORPHAN_AGE_MS = 2 * 60 * 60_000

/** Pure: which listed objects are leftovers (unreferenced and old enough). */
export function orphanKeys(objects: { key: string; modified: number }[], referenced: Set<string>, now: number, minAge = ORPHAN_AGE_MS): string[] {
  return objects.filter((o) => o.key.startsWith(SUBMISSIONS_PREFIX) && !referenced.has(o.key) && now - o.modified >= minAge).map((o) => o.key)
}

/** Deletes leftover submission files; returns how many. */
export async function sweepOrphans(payload: Payload, now = Date.now()): Promise<number> {
  if (!isR2Configured()) return 0
  // List first, then read the references: a file saved in between is referenced by then (and young anyway)
  const objects = await listObjects(SUBMISSIONS_PREFIX)
  if (!objects.length) return 0
  const { docs } = await payload.find({ collection: 'round-submissions', overrideAccess: true, depth: 0, pagination: false, select: { file: true } })
  const referenced = new Set((docs as any[]).map((d) => d?.file?.key).filter(Boolean) as string[])
  let n = 0
  for (const key of orphanKeys(objects, referenced, now)) {
    try {
      await deleteObject(key)
      logger.audit('system', 'SUBMISSION_ORPHAN_DELETED', 'R2', key)
      n++
    } catch (err: any) {
      logger.error(`Leftover submission file not deleted (${key}): ${err?.message || err}`)
    }
  }
  return n
}

/** Every file of one event's submissions (data retention): all of them, referenced or not, whatever their age. */
export async function deleteEventFiles(eventSlug: string): Promise<number> {
  if (!isR2Configured() || !/^[a-z0-9-]+$/.test(eventSlug)) return 0
  let n = 0
  for (const o of await listObjects(`${SUBMISSIONS_PREFIX}${eventSlug}/`)) {
    await deleteObject(o.key).then(() => n++, (err) => logger.error(`Retention: file not deleted (${o.key}): ${err?.message || err}`))
  }
  return n
}
