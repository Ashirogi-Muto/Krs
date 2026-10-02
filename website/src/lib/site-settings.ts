import { cache } from 'react'
import { getPayload } from 'payload'
import config from '@payload-config'
import { DEFAULT_SETTINGS, type SiteSettingsData } from './site-settings-defaults'
import { logger } from './logger'

/**
 * Site settings from the CMS global "Site settings" (once per request). Falls back to the built-in defaults when
 * the CMS is unreachable (e.g. during `next build`) or the settings were never saved.
 */
export const getSiteSettings = cache(async (): Promise<SiteSettingsData> => {
  try {
    const payload = await getPayload({ config })
    const doc: any = await payload.findGlobal({ slug: 'site-settings', depth: 0 })
    if (!doc?.updatedAt) return DEFAULT_SETTINGS // never saved: keep today's behaviour
    return {
      name: doc.name || DEFAULT_SETTINGS.name,
      shortName: doc.shortName || DEFAULT_SETTINGS.shortName,
      institution: doc.institution || DEFAULT_SETTINGS.institution,
      location: doc.location || '',
      motto: doc.motto || '',
      about: doc.about || '',
      domains: (doc.domains || []).map((d: any) => d.domain).filter(Boolean),
      pillars: (doc.pillars || []).filter((p: any) => p?.title).map((p: any) => ({ title: p.title, description: p.description })),
      contactEmail: doc.contactEmail || undefined,
      footerBlurb: doc.footerBlurb || '',
      socialLinks: (doc.socialLinks || []).filter((l: any) => l?.url).map((l: any) => ({ platform: l.platform, url: l.url })),
      hiddenPages: Array.isArray(doc.hiddenPages) ? doc.hiddenPages : DEFAULT_SETTINGS.hiddenPages,
    }
  } catch (err: any) {
    logger.warn(`Site settings unavailable, using defaults: ${err?.message || err}`)
    return DEFAULT_SETTINGS
  }
})

/** Hidden routes for this request; on the staging copy STAGING_SHOW_HIDDEN_ROUTES can un-hide some for testing. */
export async function getHiddenRoutes(): Promise<string[]> {
  const { hiddenPages } = await getSiteSettings()
  const shown = (process.env.STAGING_SHOW_HIDDEN_ROUTES || '').split(',').map((r) => r.trim()).filter(Boolean)
  return hiddenPages.filter((r) => !shown.includes(r))
}

export { DEFAULT_SETTINGS, type SiteSettingsData }
