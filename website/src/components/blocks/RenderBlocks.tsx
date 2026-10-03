import React from 'react'
import { isVisibleIn } from '@/lib/visibility'
import { isSafeHref } from '@/payload/fields/common'
import type { BlockData } from '@/lib/pages/defaults'
import { HeroBlock } from './Hero'
import { CalloutBlock, CardGridBlock, CtaBlock, ImageTextBlock, RichTextBlock, TextChipsBlock } from './sections'
import { BlogCardsBlock, EventCardsBlock, FeaturedProjectBlock, ResourceCardsBlock } from './data'

const COMPONENTS: Record<string, React.ComponentType<{ b: any }>> = {
  hero: HeroBlock,
  textChips: TextChipsBlock,
  callout: CalloutBlock,
  cardGrid: CardGridBlock,
  imageText: ImageTextBlock,
  richText: RichTextBlock,
  cta: CtaBlock,
  featuredProject: FeaturedProjectBlock,
  eventCards: EventCardsBlock,
  resourceCards: ResourceCardsBlock,
  blogCards: BlogCardsBlock,
}

const clean = (v: unknown) => (typeof v === 'string' && v.trim() ? v.trim() : '')

/**
 * Drop everything that points at a hidden page: whole sections (visibleIf), buttons and single links.
 * Unsafe hrefs are dropped too (the CMS validates them; this is the second line of defence).
 */
function prepare(b: BlockData, hidden: string[]): BlockData | null {
  if (clean(b.visibleIf) && !isVisibleIn(hidden, clean(b.visibleIf))) return null
  const ok = (href: unknown) => !!clean(href) && isSafeHref(clean(href)) && isVisibleIn(hidden, clean(href))
  const out: BlockData = { ...b, anchor: clean(b.anchor).replace(/[^a-zA-Z0-9-]/g, '') || undefined }
  if (Array.isArray(b.buttons)) out.buttons = b.buttons.filter((x: any) => x?.label && ok(x.href))
  if ('linkHref' in b && !ok(b.linkHref)) out.linkHref = undefined
  if (Array.isArray(b.cards)) out.cards = b.cards.map((c: any) => (ok(c.linkHref) ? c : { ...c, linkHref: undefined }))
  return out
}

export function RenderBlocks({ blocks, hidden }: { blocks: BlockData[]; hidden: string[] }) {
  return (
    <>
      {blocks.map((raw, i) => {
        const b = prepare(raw, hidden)
        if (!b) return null
        const C = COMPONENTS[b.blockType]
        if (!C) return null
        return <C key={(raw as any).id || i} b={b} />
      })}
    </>
  )
}
