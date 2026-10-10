import React from 'react'
import { notFound } from 'next/navigation'
import { getPage } from '@/lib/pages'
import { getHiddenRoutes } from '@/lib/site-settings'
import { isVisibleIn } from '@/lib/visibility'
import { BreadcrumbsJsonLd } from '@/lib/seo/structured-data'
import { RenderBlocks } from './RenderBlocks'
import { isPreview } from '@/lib/preview'

export type PageQuery = Record<string, string | string[] | undefined>

/**
 * Renders a CMS page (Website → Pages) by path; 404 when there is none.
 * `query`: the URL's search params, for sections that filter (gallery categories).
 */
export async function CmsPage({ path, query = {} }: { path: string; query?: PageQuery }) {
  const [page, hidden] = await Promise.all([getPage(path), getHiddenRoutes()])
  // Hidden on the Page visibility screen (or unpublished): 404, like a page that doesn't exist (except in live preview)
  const preview = await isPreview()
  if (!page || (!isVisibleIn(hidden, path) && !preview)) notFound()
  const roomy = page.spacing === 'roomy'
  const narrow = page.width === 'narrow'
  const maxW = { narrow: 'max-w-3xl', medium: 'max-w-5xl', large: 'max-w-6xl' }[page.width as string]
  const startsWithHero = Boolean(
    page.layout[0]?.blockType &&
      (page.layout[0].blockType === 'hero' ||
        page.layout[0].blockType === 'heroOrbit' ||
        page.layout[0].blockType.toLowerCase().includes('hero'))
  )
  const wrapper = roomy
    ? `space-y-12 md:space-y-16 pb-16 ${startsWithHero ? 'pt-0' : 'pt-8 md:pt-12'}`
    : `${startsWithHero ? 'pt-0 pb-12' : 'py-12'} ${narrow ? 'space-y-8' : 'space-y-10'}`
  return (
    <div className={maxW ? `${maxW} mx-auto ${wrapper}` : wrapper}>
      {path !== '/' && (
        <BreadcrumbsJsonLd
          items={[
            { name: 'Home', url: '/' },
            ...(path.startsWith('/aurix/') ? [{ name: 'AURIX', url: '/aurix' }] : []),
            { name: page.title, url: path },
          ]}
        />
      )}
      <RenderBlocks blocks={page.layout} hidden={hidden} query={query} path={path} cmsDoc={preview && page.id ? `pages/${page.id}` : null} />
    </div>
  )
}
