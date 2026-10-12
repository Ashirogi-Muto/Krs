import React from 'react'
import { NO_CMS, cmsFor, type Cms } from '@/lib/cms-attrs'
import { isVisibleIn } from '@/lib/visibility'
import { isSafeHref } from '@/payload/fields/common'
import type { BlockData } from '@/lib/pages/defaults'
import { HeroBlock } from './Hero'
import { HeroOrbitBlock } from './HeroOrbit'
import { DisciplinesPinnedBlock } from './DisciplinesPinnedFlip'
import { CompetitionsHubBlock } from './CompetitionsHub'
import { FlagshipEventReplica } from './FlagshipEventReplica'
import { CalloutBlock, CardGridBlock, CtaBlock, ImageTextBlock, RichTextBlock, TextChipsBlock } from './sections'
import { BlogCardsBlock, EventCardsBlock, FeaturedProjectBlock, ResourceCardsBlock } from './data'
import {
  BlogGridBlock, EventBannerBlock, FormBlock, GalleryGridBlock, NoticeBlock, PageHeaderBlock, PillsBlock, ProjectGridBlock,
  ResourceGridBlock, TeamGridBlock, TimelineBlock,
} from './pages2'
import {
  ComparisonTableBlock, EventFaqsBlock, EventRulebooksBlock, RegistrationFormBlock, ResultsBlock, ScheduleBlock, StatusLookupBlock,
  StepsBlock, SponsorsBlock,
} from './aurix'

type BlockProps = { b: any; query: Record<string, any>; path: string; index: number; cms?: Cms }
const COMPONENTS: Record<string, React.ComponentType<BlockProps>> = {
  hero: HeroBlock,
  heroOrbit: HeroOrbitBlock,
  disciplinesPinned: DisciplinesPinnedBlock,
  competitionsHub: CompetitionsHubBlock,
  flagshipEvent: FlagshipEventReplica,
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
  sponsors: SponsorsBlock,
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
  // _i: the button's row in the CMS (live preview attributes), kept although hidden buttons are dropped
  if (Array.isArray(b.buttons)) out.buttons = b.buttons.map((x: any, i: number) => ({ ...x, _i: i })).filter((x: any) => x?.label && ok(x.href))
  if (Array.isArray(b.pendingButtons)) out.pendingButtons = b.pendingButtons.map((x: any, i: number) => ({ ...x, _i: i })).filter((x: any) => x?.label && ok(x.href))
  if ('introLinkHref' in b && !ok(b.introLinkHref)) out.introLinkHref = undefined
  if ('linkHref' in b && !ok(b.linkHref)) out.linkHref = undefined
  if (Array.isArray(b.cards)) out.cards = b.cards.map((c: any) => (ok(c.linkHref) ? c : { ...c, linkHref: undefined }))
  return out
}

export function RenderBlocks({
  blocks, hidden, query = {}, path = '/', cmsDoc,
}: { blocks: BlockData[]; hidden: string[]; query?: Record<string, any>; path?: string; cmsDoc?: string | null }) {
  return (
    <>
      {blocks.map((raw, i) => {
        const b = prepare(raw, hidden)
        if (!b) return null
        const C = COMPONENTS[b.blockType]
        if (!C) return null
        // Live preview only (cmsDoc set): data-cms-* attributes tie the section's text to its CMS fields (layout.<i>.…)
        const cms = cmsDoc ? cmsFor(cmsDoc, `layout.${i}`) : NO_CMS
        return <C key={(raw as any).id || i} b={b} query={query} path={path} index={i} cms={cms} />
      })}
    </>
  )
}
