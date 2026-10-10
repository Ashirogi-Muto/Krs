import { cache } from 'react'
import type { Metadata } from 'next'
import { getPayload } from 'payload'
import config from '@payload-config'
import { logger } from '../logger'
import { constructMetadata } from '../seo/metadata'
import { mediaUrl } from '../navigation'
import { DEFAULT_PAGES, type PageData } from './defaults'
import { canSeePageDraft, getPreviewUser } from '../preview'

/**
 * A page by path from the CMS (Website → Pages: shown on the site AND published), else its built-in default.
 * `null` = no such page (404). Cached per request. In live preview (CMS content editor + draft mode) it is the latest
 * draft instead, also when the page is not shown or was never published.
 */
export const getPage = cache(async (path: string): Promise<PageData | null> => {
  try {
    const payload = await getPayload({ config })
    const user = await getPreviewUser()
    const byPath = { path: { equals: path } }
    let doc: any = null
    if (user) {
      // Preview: the latest draft (a page edited before drafts existed has no version yet, so then its saved row),
      // only for pages this editor may see drafts of (access roles can be limited to chosen pages)
      const draft = await payload.find({ collection: 'pages', where: byPath, limit: 1, depth: 2, draft: true, overrideAccess: true })
      const candidate: any = draft.docs[0] || (await payload.find({ collection: 'pages', where: byPath, limit: 1, depth: 2, overrideAccess: true })).docs[0]
      if (candidate && canSeePageDraft(user, candidate.id)) doc = candidate
    }
    if (!doc) {
      const res = await payload.find({
        collection: 'pages',
        // _status: a page saved only as a draft has a row, but it was never published
        where: { and: [{ path: { equals: path } }, { published: { equals: true } }, { _status: { equals: 'published' } }] },
        limit: 1,
        depth: 2,
        overrideAccess: false,
      })
      doc = res.docs[0]
    }
    if (doc)
      return {
        id: doc.id,
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
    ogImage: mediaUrl(page.seo?.image) || def.ogPath || undefined,
    noIndex: Boolean(page.seo?.noIndex),
  })
}

export { DEFAULT_PAGES }
