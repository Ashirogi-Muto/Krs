import type { MetadataRoute } from 'next'
import { getPayload } from 'payload'
import config from '@payload-config'
import { getAllEvents } from '@/lib/data/events'
import { getAllBlogs, getAllProjects, getAllResources } from '@/lib/data/content'
import { BUILT_IN_PAGES, isVisibleIn } from '@/lib/visibility'
import { getHiddenRoutes } from '@/lib/site-settings'
import { logger } from '@/lib/logger'

// Re-read from the CMS at most once a minute
export const revalidate = 60

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://kalamroboticssociety.com'
// Sign-in, portals and other private pages are never listed (they are noindex anyway)
const NOT_LISTED = new Set(['/register', '/login', '/forgot-password', '/aurix/portal', '/judge', '/aurix/status'])

/** Published pages created in Website → Pages (built-in ones are in BUILT_IN_PAGES). */
async function cmsPagePaths(): Promise<string[]> {
  try {
    const payload = await getPayload({ config })
    const res = await payload.find({
      collection: 'pages',
      where: { and: [{ published: { equals: true } }, { 'seo.noIndex': { not_equals: true } }] },
      limit: 500,
      depth: 0,
      select: { path: true },
    })
    return (res.docs as any[]).map((d) => d.path).filter((p): p is string => typeof p === 'string')
  } catch (err: any) {
    logger.warn(`Sitemap: CMS pages unavailable: ${err?.message || err}`)
    return []
  }
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [hidden, pages, events, projects, resources, blogs] = await Promise.all([
    getHiddenRoutes(),
    cmsPagePaths(),
    getAllEvents(),
    getAllProjects(),
    getAllResources(),
    getAllBlogs(),
  ])
  const now = new Date()
  const entry = (path: string, priority: number, changeFrequency: 'daily' | 'weekly' | 'monthly', lastModified = now) => ({
    url: `${BASE_URL}${path === '/' ? '' : path}`,
    lastModified,
    changeFrequency,
    priority,
  })
  const paths = new Set([...BUILT_IN_PAGES.map((p) => p.route).filter((r) => !NOT_LISTED.has(r)), ...pages])
  return [
    ...[...paths].map((p) => entry(p, p === '/' ? 1 : p === '/aurix' ? 0.9 : 0.8, p.startsWith('/aurix') ? 'daily' : 'weekly')),
    ...events.filter((e) => e.status !== 'DRAFT').map((e) => entry(`/aurix/${e.slug}`, 0.9, 'daily')),
    ...projects.map((p) => entry(`/projects/${p.slug}`, 0.7, 'monthly')),
    ...resources.map((r) => entry(`/learning/${r.slug}`, 0.7, 'monthly')),
    ...blogs.map((b) => entry(`/blogs/${b.slug}`, 0.7, 'monthly', b.publishedAt ? new Date(b.publishedAt) : now)),
  ].filter((e) => isVisibleIn(hidden, e.url.slice(BASE_URL.length) || '/'))
}
