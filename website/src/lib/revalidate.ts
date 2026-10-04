import { revalidatePath } from 'next/cache'
import { logger } from './logger'

/**
 * Clear the cached pages of the whole site after a CMS change, so the next visitor sees it at once (otherwise the
 * first visit after a change still gets the old page while the new one is built). Outside a Next.js request
 * (Payload CLI, start-up scripts) there is nothing to clear and the call is skipped.
 */
export function revalidateSite(reason: string) {
  try {
    revalidatePath('/', 'layout')
  } catch (err: any) {
    if (!/static generation store missing|outside a request scope|during render|Invariant/i.test(String(err?.message))) logger.warn(`Cache refresh after ${reason} failed: ${err?.message || err}`)
  }
}
