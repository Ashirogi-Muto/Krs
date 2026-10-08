import { fill } from './form-texts-defaults'
import type { StaffTexts } from './staff-texts-defaults'
import { isVisibleIn } from './visibility'

/**
 * "Where to edit" guide (CMS: /admin/where-to-edit): every page of the site and the CMS screens that change it.
 * Pages come from Website → Pages (their sections decide which collections feed them) and competitions from Events,
 * so new pages and competitions show up without a code change.
 */
export type GuideLink = { label: string; href: string }
export type GuideRow = { title: string; path?: string; note?: string; links: GuideLink[] }
export type GuideSection = { title: string; rows: GuideRow[] }
export type GuidePage = { id: number | string; path: string; title?: string; published?: boolean; system?: boolean; layout?: { blockType?: string }[] }
export type GuideEvent = { id: number | string; slug: string; title: string; status?: string }

const col = (slug: string, id?: number | string) => `/admin/collections/${slug}${id !== undefined ? `/${id}` : ''}`
const glob = (slug: string) => `/admin/globals/${slug}`

/** Collections and screens that feed a page through its sections (blocks). */
function blockLinks(blocks: string[], T: StaffTexts['guide']): GuideLink[] {
  const has = (...types: string[]) => types.some((t) => blocks.includes(t))
  const out: GuideLink[] = []
  if (has('galleryGrid')) out.push({ label: T.lGallery, href: col('gallery-albums') })
  if (has('teamGrid')) out.push({ label: T.lPeople, href: col('people') })
  if (has('projectGrid', 'featuredProject')) out.push({ label: T.lProjects, href: col('projects') })
  if (has('blogGrid', 'blogCards')) out.push({ label: T.lPosts, href: col('posts') })
  if (has('resourceGrid', 'resourceCards')) out.push({ label: T.lResources, href: col('resources') })
  if (has('eventCards', 'comparisonTable', 'eventRulebooks', 'eventFaqs', 'results', 'eventBanner', 'registrationForm', 'hero'))
    out.push({ label: T.lEvents, href: col('events') })
  if (has('schedule')) out.push({ label: T.lSchedule, href: glob('aurix-schedule') })
  if (has('registrationForm')) out.push({ label: T.lRegForm, href: glob('form-texts') })
  if (has('statusLookup')) out.push({ label: T.lStatus, href: glob('form-texts') })
  if (has('form')) out.push({ label: T.lFormAnswers, href: col('form-submissions') })
  return out
}

export function buildEditGuide(
  { pages, events, hidden }: { pages: GuidePage[]; events: GuideEvent[]; hidden: readonly string[] },
  T: StaffTexts['guide'],
): GuideSection[] {
  const note = (path: string, published = true) =>
    !published ? T.noteUnpublished : !isVisibleIn(hidden, path) ? T.noteHidden : undefined
  const pageRow = (p: GuidePage): GuideRow => ({
    title: p.title || p.path,
    path: p.path,
    note: note(p.path, p.published !== false),
    links: [
      { label: T.lSections, href: col('pages', p.id) },
      ...blockLinks((p.layout || []).map((b) => String(b?.blockType || '')), T),
    ],
  })
  const isAurix = (path: string) => path === '/aurix' || path.startsWith('/aurix/')
  const sorted = [...pages].sort((a, b) => (a.path === '/' ? -1 : b.path === '/' ? 1 : a.path.localeCompare(b.path)))
  const built = sorted.filter((p) => p.system !== false)
  const added = sorted.filter((p) => p.system === false)

  const sections: GuideSection[] = [
    { title: T.secKrs, rows: built.filter((p) => !isAurix(p.path)).map(pageRow) },
    { title: T.secAurix, rows: built.filter((p) => isAurix(p.path)).map(pageRow) },
    {
      title: T.secCompetitions,
      rows: events.map((e) => ({
        title: e.title,
        path: `/aurix/${e.slug}`,
        note: e.status === 'DRAFT' ? T.noteDraft : note(`/aurix/${e.slug}`),
        links: [
          { label: fill(T.lEventDoc, { title: e.title }), href: col('events', e.id) },
          { label: T.lEventLabels, href: glob('event-page-labels') },
        ],
      })),
    },
    {
      title: T.secDetail,
      rows: [
        { title: T.rProject, path: '/projects', links: [{ label: T.lProjects, href: col('projects') }, { label: T.lProjectPage, href: glob('form-texts') }] },
        { title: T.rLearning, path: '/learning', links: [{ label: T.lResources, href: col('resources') }, { label: T.lLearningPage, href: glob('form-texts') }] },
        { title: T.rBlog, path: '/blogs', links: [{ label: T.lPosts, href: col('posts') }, { label: T.lBlogPage, href: glob('form-texts') }] },
      ],
    },
    { title: T.secYour, rows: added.map(pageRow) },
    {
      title: T.secAccounts,
      rows: [
        { title: T.rSignIn, path: '/login', links: [{ label: T.lSignIn, href: glob('form-texts') }] },
        { title: T.rAccount, links: [{ label: T.lAccount, href: glob('form-texts') }] },
        {
          title: T.rPortal,
          path: '/aurix/portal',
          note: note('/aurix/portal'),
          links: [
            { label: T.lPortal, href: glob('portal-texts') },
            { label: T.lAnnouncements, href: col('announcements') },
          ],
        },
        { title: T.rJudge, path: '/judge', note: note('/judge'), links: [{ label: T.lJudge, href: glob('portal-texts') }] },
      ],
    },
    {
      title: T.secLegal,
      rows: ['/privacy', '/terms'].map((path) => ({ title: path, path, note: note(path), links: [{ label: T.lLegal, href: glob('legal-pages') }] })),
    },
    {
      title: T.secEverywhere,
      rows: [
        { title: T.rNotFound, links: [{ label: T.lNotFound, href: glob('form-texts') }] },
        { title: T.rEmails, links: [{ label: T.lEmails, href: glob('form-texts') }] },
        { title: T.rMessages, links: [{ label: T.lMessages, href: glob('form-texts') }] },
        { title: T.rSearch, links: [{ label: T.lSearch, href: glob('form-texts') }] },
        { title: T.rWhole, links: [{ label: T.lWhole, href: glob('form-texts') }] },
        { title: T.rShort, links: [{ label: T.lShortLinks, href: col('short-links') }] },
      ],
    },
    {
      title: T.secStaff,
      rows: [
        { title: T.rStaffTools, links: [{ label: T.lStaff, href: glob('staff-texts') }] },
        { title: T.rAdminScreens, links: [{ label: T.lStaff, href: glob('staff-texts') }] },
      ],
    },
  ]
  return sections.filter((s) => s.rows.length > 0)
}
