import type { Payload } from 'payload'
import { deleteObject, isR2Configured, listObjects } from './r2'
import { logger } from './logger'

/**
 * Leftover submission files (owner, 9 Oct 2026). A file can reach R2 without a submission pointing to it: the leader
 * closed the page between "upload" and "save", or saved from two devices at the same moment. Such files are deleted
 * once they are older than ORPHAN_AGE_MS: well past the 30-minute upload token and the 15-minute deadline grace, so a
 * save still in progress is never touched. Payment receipts (`receipts/`, 10 Oct 2026) are swept the same way. Only
 * keys under these prefixes are considered.
 */
export const SUBMISSIONS_PREFIX = 'submissions/'
export const RECEIPTS_PREFIX = 'receipts/'
export const SWEPT_PREFIXES = [SUBMISSIONS_PREFIX, RECEIPTS_PREFIX]
export const ORPHAN_AGE_MS = 2 * 60 * 60_000

/** Pure: which listed objects are leftovers (unreferenced and old enough). */
export function orphanKeys(objects: { key: string; modified: number }[], referenced: Set<string>, now: number, minAge = ORPHAN_AGE_MS): string[] {
  return objects.filter((o) => SWEPT_PREFIXES.some((p) => o.key.startsWith(p)) && !referenced.has(o.key) && now - o.modified >= minAge).map((o) => o.key)
}

/** Deletes leftover submission files; returns how many. */
export async function sweepOrphans(payload: Payload, now = Date.now()): Promise<number> {
  if (!isR2Configured()) return 0
  // List first, then read the references: a file saved in between is referenced by then (and young anyway)
  const objects = (await Promise.all(SWEPT_PREFIXES.map((p) => listObjects(p)))).flat()
  if (!objects.length) return 0
  const [subs, regs] = await Promise.all([
    payload.find({ collection: 'round-submissions', overrideAccess: true, depth: 0, pagination: false, select: { file: true } }),
    payload.find({ collection: 'event-registrations', overrideAccess: true, depth: 0, pagination: false, where: { receiptKey: { exists: true } }, select: { receiptKey: true } }),
  ])
  const referenced = new Set([...(subs.docs as any[]).map((d) => d?.file?.key), ...(regs.docs as any[]).map((d) => d?.receiptKey)].filter(Boolean) as string[])
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

/** Every submission and receipt file of one event (data retention): all of them, referenced or not, whatever their age. */
export async function deleteEventFiles(eventSlug: string): Promise<number> {
  if (!isR2Configured() || !/^[a-z0-9-]+$/.test(eventSlug)) return 0
  let n = 0
  for (const o of (await Promise.all(SWEPT_PREFIXES.map((p) => listObjects(`${p}${eventSlug}/`)))).flat()) {
    await deleteObject(o.key).then(() => n++, (err) => logger.error(`Retention: file not deleted (${o.key}): ${err?.message || err}`))
  }
  return n
}
