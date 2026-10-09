import type { Payload } from 'payload'
import { logger } from './logger'

/**
 * Every hour (and 5 minutes after start): delete leftover submission files in R2 (lib/submission-sweep.ts). One timer per
 * process; the logic is loaded lazily (it reads the Payload config, which imports this file).
 */
export function startSubmissionSweepJob(payload: Payload) {
  if (process.env.NEXT_PHASE === 'phase-production-build') return
  const g = globalThis as any
  if (g.__krsSubmissionSweepJob) return
  const run = async () => {
    try {
      const { sweepOrphans } = await import('./submission-sweep')
      const n = await sweepOrphans(payload)
      if (n) logger.info(`Submission sweep: ${n} leftover file(s) deleted from R2`)
    } catch (err: any) {
      logger.error(`Submission sweep failed: ${err?.message || err}`)
    }
  }
  g.__krsSubmissionSweepJob = setInterval(run, 60 * 60_000)
  setTimeout(run, 5 * 60_000)
}
