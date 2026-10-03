import type { Payload } from 'payload'
import { DEFAULT_PAGES } from '../lib/pages/defaults'
import { logger } from '../lib/logger'

/**
 * Create every built-in page that is not in the CMS yet, with today's content (never overwrites).
 * Runs on start, so pages converted to sections in later releases appear in the CMS automatically.
 */
export async function initPages(payload: Payload) {
  for (const page of Object.values(DEFAULT_PAGES)) {
    try {
      const existing = await payload.count({ collection: 'pages', where: { path: { equals: page.path } }, overrideAccess: true })
      if (existing.totalDocs > 0) continue
      await payload.create({
        collection: 'pages',
        overrideAccess: true,
        data: { title: page.title, path: page.path, published: true, system: true, spacing: page.spacing, width: page.width, seo: page.seo, layout: page.layout } as any,
      })
      logger.info(`Pages: created built-in page ${page.path} from the built-in content`)
    } catch (err: any) {
      logger.error(`Pages: creating ${page.path} failed: ${err?.message || err}`)
    }
  }
}
