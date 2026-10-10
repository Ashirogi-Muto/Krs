import type { Payload } from 'payload'
import { logger } from './logger'

/**
 * Every 15 minutes (and 2 minutes after start): cancel registrations whose student ID is still rejected after the
 * re-upload deadline. One timer per process. The logic is loaded lazily because it reads the Payload config, which
 * imports this file (no import cycle at start-up).
 */
export function startIdReuploadJob(payload: Payload) {
  if (process.env.NEXT_PHASE === 'phase-production-build') return
  const g = globalThis as any
  if (g.__krsIdReuploadJob) return
  const run = async () => {
    try {
      const { cancelOverdue } = await import('./id-reupload')
      const n = await cancelOverdue(payload)
      if (n) logger.info(`ID re-upload: ${n} registration(s) cancelled after their deadline`)
    } catch (err: any) {
      logger.error(`ID re-upload job failed: ${err?.message || err}`)
    }
  }
  g.__krsIdReuploadJob = setInterval(run, 15 * 60_000)
  setTimeout(run, 120_000)
}
