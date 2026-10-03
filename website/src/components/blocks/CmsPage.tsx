import React from 'react'
import { notFound } from 'next/navigation'
import { getPage } from '@/lib/pages'
import { getHiddenRoutes } from '@/lib/site-settings'
import { RenderBlocks } from './RenderBlocks'

/** Renders a CMS page (Website → Pages) by path; 404 when there is none. */
export async function CmsPage({ path }: { path: string }) {
  const [page, hidden] = await Promise.all([getPage(path), getHiddenRoutes()])
  if (!page) notFound()
  return (
    <div className={`space-y-24 md:space-y-32 pb-24 ${page.layout[0]?.blockType === 'hero' ? '' : 'pt-12 md:pt-16'}`}>
      <RenderBlocks blocks={page.layout} hidden={hidden} />
    </div>
  )
}
