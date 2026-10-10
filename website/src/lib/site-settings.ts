import { isSafeHref } from '@/payload/fields/common'
import { cache } from 'react'
import { getPayload } from 'payload'
import config from '@payload-config'
import { DEFAULT_SETTINGS, type SiteSettingsData } from './site-settings-defaults'
import { logger } from './logger'
import { cleanHiddenPaths } from './visibility'

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
      contactEmail: doc.contactEmail || undefined,
      footerBlurb: doc.footerBlurb || '',
      // Same link check as the CMS field (older rows were saved before it existed)
      socialLinks: (doc.socialLinks || []).filter((l: any) => typeof l?.url === 'string' && isSafeHref(l.url)).map((l: any) => ({ platform: l.platform, url: l.url })),
      // hiddenPaths (Page visibility screen) replaced the fixed hiddenPages list on 4 Oct 2026; the migration copied it
      hiddenPages: Array.isArray(doc.hiddenPaths)
        ? cleanHiddenPaths(doc.hiddenPaths)
        : Array.isArray(doc.hiddenPages)
          ? doc.hiddenPages
          : DEFAULT_SETTINGS.hiddenPages,
    }
  } catch (err: any) {
    logger.warn(`Site settings unavailable, using defaults: ${err?.message || err}`)
    return DEFAULT_SETTINGS
  }
})

/**
 * Hidden routes for this request: the Page visibility list, plus CMS pages that are unpublished (so no menu or
 * in-page link points at them). On the staging copy STAGING_SHOW_HIDDEN_ROUTES can un-hide some for testing.
 */
export const getHiddenRoutes = cache(async (): Promise<string[]> => {
  const [{ hiddenPages }, unpublished] = await Promise.all([getSiteSettings(), unpublishedPagePaths()])
  const shown = (process.env.STAGING_SHOW_HIDDEN_ROUTES || '').split(',').map((r) => r.trim()).filter(Boolean)
  return Array.from(new Set([...hiddenPages, ...unpublished])).filter((r) => !shown.includes(r))
})

const unpublishedPagePaths = cache(async (): Promise<string[]> => {
  try {
    const payload = await getPayload({ config })
    const res = await payload.find({
      collection: 'pages',
      // Not shown on the site, or saved only as a draft (never published): both are hidden from visitors
      where: { or: [{ published: { equals: false } }, { _status: { not_equals: 'published' } }] },
      limit: 500,
      depth: 0,
      overrideAccess: true,
      select: { path: true },
    })
    return (res.docs as any[]).map((d) => d.path).filter((p): p is string => typeof p === 'string')
  } catch {
    return []
  }
})

export { DEFAULT_SETTINGS, type SiteSettingsData }
