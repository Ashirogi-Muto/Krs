/**
 * Which pages are hidden. The CMS decides (Website → Page visibility, admins only); this list is the default until
 * then (and if the CMS is unreachable). A hidden page returns 404 and disappears from menus, footers, in-page
 * links and the sitemap. Hiding a page also hides the pages under it (/projects hides /projects/<project>),
 * except for the two home pages: hiding / or /aurix hides only that page.
 */
export const HIDDEN_ROUTES: string[] = [
  '/team', // placeholder member names only
  '/join', // form does not submit anywhere yet
  '/contact', // form does not submit anywhere; contact email unconfirmed
  '/insights', // milestones not yet confirmed
  '/aurix/schedule', // event-day schedule not yet confirmed
  '/aurix/results', // no results published yet
  '/aurix/portal', // participant portal shows sample data only
  '/login', // only needed for the participant portal
  '/register', // only needed for the participant portal
]

/** Home pages: hiding them hides only that page, not the whole site below them. */
const EXACT_ONLY = new Set(['/', '/aurix'])

export type VisibilityGroup = 'KRS site' | 'AURIX site' | 'Competitions' | 'Accounts & portals' | 'Legal'
export type BuiltInPage = { route: string; label: string; group: VisibilityGroup; note?: string }

/**
 * Every built-in public page, for the Page visibility screen. Competition pages are listed from Events and pages
 * created in Website → Pages are listed from there, so neither needs a code change.
 */
export const BUILT_IN_PAGES: BuiltInPage[] = [
  { route: '/', label: 'KRS home', group: 'KRS site', note: 'Hiding it leaves the KRS site without a home page.' },
  { route: '/projects', label: 'Projects (and every project page)', group: 'KRS site' },
  { route: '/learning', label: 'Learning (and every resource page)', group: 'KRS site' },
  { route: '/blogs', label: 'Blogs (and every post)', group: 'KRS site' },
  { route: '/gallery', label: 'Gallery', group: 'KRS site' },
  { route: '/events', label: 'KRS events', group: 'KRS site' },
  { route: '/insights', label: 'Insights', group: 'KRS site' },
  { route: '/team', label: 'Team', group: 'KRS site' },
  { route: '/join', label: 'Join KRS form', group: 'KRS site' },
  { route: '/contact', label: 'Contact form', group: 'KRS site' },
  { route: '/aurix', label: 'AURIX home', group: 'AURIX site', note: 'Hides only the AURIX home page, not the pages under it.' },
  { route: '/aurix/competitions', label: 'Competitions overview', group: 'AURIX site' },
  { route: '/aurix/rules', label: 'Rules', group: 'AURIX site' },
  { route: '/aurix/faq', label: 'FAQ', group: 'AURIX site' },
  { route: '/aurix/schedule', label: 'Schedule', group: 'AURIX site' },
  { route: '/aurix/results', label: 'Results', group: 'AURIX site' },
  { route: '/aurix/register', label: 'Team registration form', group: 'AURIX site' },
  { route: '/aurix/status', label: 'Registration status lookup', group: 'AURIX site' },
  { route: '/register', label: 'Participant sign-up', group: 'Accounts & portals' },
  { route: '/login', label: 'Participant sign-in', group: 'Accounts & portals' },
  { route: '/forgot-password', label: 'Forgot password', group: 'Accounts & portals' },
  { route: '/aurix/portal', label: 'Participant portal', group: 'Accounts & portals' },
  { route: '/privacy', label: 'Privacy policy', group: 'Legal' },
  { route: '/terms', label: 'Terms', group: 'Legal' },
]

/** @deprecated kept for the retired "Hidden pages" field in Site settings (its choices must not change). */
export const HIDEABLE_PAGES: { route: string; label: string }[] = [
  { route: '/team', label: 'Team' },
  { route: '/join', label: 'Join KRS form' },
  { route: '/contact', label: 'Contact form' },
  { route: '/insights', label: 'Insights' },
  { route: '/gallery', label: 'Gallery' },
  { route: '/events', label: 'KRS events' },
  { route: '/learning', label: 'Learning' },
  { route: '/blogs', label: 'Blogs' },
  { route: '/projects', label: 'Projects' },
  { route: '/aurix/schedule', label: 'AURIX schedule' },
  { route: '/aurix/results', label: 'AURIX results' },
  { route: '/aurix/portal', label: 'Participant portal' },
  { route: '/login', label: 'Participant sign-in' },
  { route: '/register', label: 'Participant sign-up' },
  { route: '/judge', label: 'Judging portal' },
]

/** Paths that can never be hidden from the CMS: the CMS itself, APIs, staff tools, links inside emails. */
// /judge, /judging and /tournaments (20 Oct 2026): sign-in tools for judges and staff, like the check-in desk
const NEVER_HIDDEN = ['/admin', '/api', '/checkin', '/payment-matching', '/retention', '/judge', '/judging', '/tournaments', '/go', '/og', '/verify-email', '/reset-password', '/_next']

/** A site path that may be stored as hidden: "/" or lowercase segments of letters, digits and dashes. */
export function isHideablePath(v: unknown): v is string {
  if (typeof v !== 'string' || v.length > 200) return false
  if (v !== '/' && !/^(\/[a-z0-9]+(-[a-z0-9]+)*)+$/.test(v)) return false
  return !NEVER_HIDDEN.some((r) => v === r || v.startsWith(`${r}/`))
}

/** Cleaned list of hidden paths (invalid entries and duplicates dropped). */
export const cleanHiddenPaths = (list: unknown): string[] =>
  Array.isArray(list) ? Array.from(new Set(list.filter(isHideablePath))) : []

/** True when `href` is not under any of the `hidden` routes. */
export function isVisibleIn(hidden: readonly string[], href: string): boolean {
  const raw = href.split(/[?#]/)[0]
  if (!raw) return true // "#section" or "?x=y" on the current page
  const path = raw.replace(/(.)\/+$/, '$1')
  return !hidden.some((route) => path === route || (!EXACT_ONLY.has(route) && path.startsWith(`${route}/`)))
}

/** Default visibility (code list only). Server code should use getHiddenRoutes() from lib/site-settings. */
export function isRouteVisible(href: string): boolean {
  return isVisibleIn(HIDDEN_ROUTES, href)
}
