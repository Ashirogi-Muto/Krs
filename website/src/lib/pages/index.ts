import { cache } from 'react'
import type { Metadata } from 'next'
import { getPayload } from 'payload'
import config from '@payload-config'
import { logger } from '../logger'
import { constructMetadata } from '../seo/metadata'
import { mediaUrl } from '../navigation'
import { DEFAULT_PAGES, type PageData } from './defaults'

/**
 * A page by path from the CMS (Website → Pages, published only), else its built-in default.
 * `null` = no such page (404). Cached per request.
 */
export const getPage = cache(async (path: string): Promise<PageData | null> => {
  try {
    const payload = await getPayload({ config })
    const res = await payload.find({
      collection: 'pages',
      where: { and: [{ path: { equals: path } }, { published: { equals: true } }] },
      limit: 1,
      depth: 2,
      overrideAccess: false,
    })
    const doc: any = res.docs[0]
    if (doc)
      return {
        path: doc.path,
        title: doc.title,
        spacing: doc.spacing || DEFAULT_PAGES[path]?.spacing,
        width: doc.width || DEFAULT_PAGES[path]?.width,
        seo: doc.seo || {},
        layout: doc.layout || [],
      }
    // A built-in page that was unpublished in the CMS stays hidden; one that was never created falls back
    const any = await payload.count({ collection: 'pages', where: { path: { equals: path } }, overrideAccess: true })
    if (any.totalDocs > 0) return null
  } catch (err: any) {
    logger.warn(`Pages unavailable, using built-in page for ${path}: ${err?.message || err}`)
  }
  return DEFAULT_PAGES[path] || null
})

export async function pageMetadata(path: string): Promise<Metadata> {
  const page = await getPage(path)
  if (!page) return {}
  const def = DEFAULT_PAGES[path]?.seo || {}
  return constructMetadata({
    title: page.seo?.title || def.title || page.title,
    description: page.seo?.description || def.description || '',
    path: path === '/' ? '' : path,
    ogImage: mediaUrl(page.seo?.image) || undefined,
    noIndex: Boolean(page.seo?.noIndex),
  })
}

export { DEFAULT_PAGES }
