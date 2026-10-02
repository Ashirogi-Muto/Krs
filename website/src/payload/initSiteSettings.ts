import type { Payload } from 'payload'
import { DEFAULT_SETTINGS } from '../lib/site-settings-defaults'
import { logger } from '../lib/logger'
import { SEED_LEGAL } from '../lib/data/seed-legal'
import { DEFAULT_PAGE_TEXTS } from '../lib/page-texts-defaults'

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

/** First start: save today's privacy policy and terms into the CMS so they can be edited there. */
export async function initLegalPages(payload: Payload) {
  try {
    const doc: any = await payload.findGlobal({ slug: 'legal-pages', depth: 0 })
    if (doc?.updatedAt) return
    await payload.updateGlobal({ slug: 'legal-pages', overrideAccess: true, data: SEED_LEGAL as any })
    logger.info('Privacy policy and terms initialised in the CMS from the built-in text')
  } catch (err: any) {
    logger.error(`Initialising legal pages failed: ${err?.message || err}`)
  }
}

/** First start: save today's page headings and intros into the CMS so editors see the current wording. */
export async function initPageTexts(payload: Payload) {
  try {
    const doc: any = await payload.findGlobal({ slug: 'page-texts', depth: 0 })
    if (doc?.updatedAt) {
      // Tabs added later (Insights): fill them once with today's wording so editors see the current text
      if (!doc.insights?.title) {
        await payload.updateGlobal({ slug: 'page-texts', overrideAccess: true, data: { insights: DEFAULT_PAGE_TEXTS.insights } as any })
        logger.info('Page texts: Insights tab initialised from the built-in text')
      }
      return
    }
    await payload.updateGlobal({ slug: 'page-texts', overrideAccess: true, data: DEFAULT_PAGE_TEXTS as any })
    logger.info('Page texts initialised in the CMS from the built-in text')
  } catch (err: any) {
    logger.error(`Initialising page texts failed: ${err?.message || err}`)
  }
}
