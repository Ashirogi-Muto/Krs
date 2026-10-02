import type { Payload } from 'payload'
import { DEFAULT_SETTINGS } from '../lib/site-settings-defaults'
import { logger } from '../lib/logger'

/** First start: save the settings once with today's content, so the CMS shows (and keeps) the current state. */
export async function initSiteSettings(payload: Payload) {
  try {
    const doc: any = await payload.findGlobal({ slug: 'site-settings', depth: 0 })
    if (doc?.updatedAt) return
    const d = DEFAULT_SETTINGS
    await payload.updateGlobal({
      slug: 'site-settings',
      overrideAccess: true,
      data: {
        name: d.name,
        shortName: d.shortName,
        institution: d.institution,
        location: d.location,
        motto: d.motto,
        about: d.about,
        domains: d.domains.map((domain) => ({ domain })),
        pillars: d.pillars,
        footerBlurb: d.footerBlurb,
        hiddenPages: d.hiddenPages as any,
      },
    })
    logger.info('Site settings initialised in the CMS from the built-in defaults')
  } catch (err: any) {
    logger.error(`Initialising site settings failed: ${err?.message || err}`)
  }
}
