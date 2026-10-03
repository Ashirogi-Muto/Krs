import React from 'react'
import { notFound } from 'next/navigation'
import { getPage } from '@/lib/pages'
import { getHiddenRoutes } from '@/lib/site-settings'
import { BreadcrumbsJsonLd } from '@/lib/seo/structured-data'
import { RenderBlocks } from './RenderBlocks'

export type PageQuery = Record<string, string | string[] | undefined>

/**
 * Renders a CMS page (Website → Pages) by path; 404 when there is none.
 * `query`: the URL's search params, for sections that filter (gallery categories).
 */
export async function CmsPage({ path, query = {} }: { path: string; query?: PageQuery }) {
  const [page, hidden] = await Promise.all([getPage(path), getHiddenRoutes()])
  if (!page) notFound()
  const roomy = page.spacing === 'roomy'
  const narrow = page.width === 'narrow'
  const startsWithHero = page.layout[0]?.blockType === 'hero'
  const wrapper = roomy
    ? `space-y-24 md:space-y-32 pb-24 ${startsWithHero ? '' : 'pt-12 md:pt-16'}`
    : `py-16 ${narrow ? 'space-y-10' : 'space-y-12'}`
  return (
    <div className={narrow ? `max-w-3xl mx-auto ${wrapper} cms-narrow` : wrapper}>
      {path !== '/' && (
        <BreadcrumbsJsonLd
          items={[
            { name: 'Home', url: '/' },
            ...(path.startsWith('/aurix/') ? [{ name: 'AURIX', url: '/aurix' }] : []),
            { name: page.title, url: path },
          ]}
        />
      )}
      <RenderBlocks blocks={page.layout} hidden={hidden} query={query} path={path} />
    </div>
  )
}
