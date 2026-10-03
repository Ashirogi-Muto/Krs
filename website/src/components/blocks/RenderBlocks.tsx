import React from 'react'
import { isVisibleIn } from '@/lib/visibility'
import { isSafeHref } from '@/payload/fields/common'
import type { BlockData } from '@/lib/pages/defaults'
import { HeroBlock } from './Hero'
import { CalloutBlock, CardGridBlock, CtaBlock, ImageTextBlock, RichTextBlock, TextChipsBlock } from './sections'
import { BlogCardsBlock, EventCardsBlock, FeaturedProjectBlock, ResourceCardsBlock } from './data'
import {
  BlogGridBlock, EventBannerBlock, FormBlock, GalleryGridBlock, NoticeBlock, PageHeaderBlock, PillsBlock, ProjectGridBlock,
  ResourceGridBlock, TeamGridBlock, TimelineBlock,
} from './pages2'
import {
  ComparisonTableBlock, EventFaqsBlock, EventRulebooksBlock, RegistrationFormBlock, ResultsBlock, ScheduleBlock, StatusLookupBlock,
  StepsBlock,
} from './aurix'

type BlockProps = { b: any; query: Record<string, any>; path: string; index: number }
const COMPONENTS: Record<string, React.ComponentType<BlockProps>> = {
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
  pageHeader: PageHeaderBlock,
  pills: PillsBlock,
  projectGrid: ProjectGridBlock,
  resourceGrid: ResourceGridBlock,
  blogGrid: BlogGridBlock,
  galleryGrid: GalleryGridBlock,
  eventBanner: EventBannerBlock,
  teamGrid: TeamGridBlock,
  timeline: TimelineBlock,
  notice: NoticeBlock,
  form: FormBlock,
  steps: StepsBlock,
  comparisonTable: ComparisonTableBlock,
  eventFaqs: EventFaqsBlock,
  eventRulebooks: EventRulebooksBlock,
  schedule: ScheduleBlock,
  results: ResultsBlock,
  statusLookup: StatusLookupBlock,
  registrationForm: RegistrationFormBlock,
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
  if (Array.isArray(b.pendingButtons)) out.pendingButtons = b.pendingButtons.filter((x: any) => x?.label && ok(x.href))
  if ('introLinkHref' in b && !ok(b.introLinkHref)) out.introLinkHref = undefined
  if ('linkHref' in b && !ok(b.linkHref)) out.linkHref = undefined
  if (Array.isArray(b.cards)) out.cards = b.cards.map((c: any) => (ok(c.linkHref) ? c : { ...c, linkHref: undefined }))
  return out
}

export function RenderBlocks({
  blocks, hidden, query = {}, path = '/',
}: { blocks: BlockData[]; hidden: string[]; query?: Record<string, any>; path?: string }) {
  return (
    <>
      {blocks.map((raw, i) => {
        const b = prepare(raw, hidden)
        if (!b) return null
        const C = COMPONENTS[b.blockType]
        if (!C) return null
        return <C key={(raw as any).id || i} b={b} query={query} path={path} index={i} />
      })}
    </>
  )
}
