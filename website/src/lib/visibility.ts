/**
 * Default hidden routes, used until "Site settings" is first saved in the CMS (and if the CMS is unreachable).
 * After that the CMS decides: Site settings → Hidden pages (admins only).
 * A hidden route returns 404 and is removed from navigation, footers and the sitemap.
 */
export const HIDDEN_ROUTES: string[] = [
  '/team', // placeholder member names only
  '/join', // form does not submit anywhere yet
  '/contact', // form does not submit anywhere; contact email unconfirmed
  '/insights', // milestones not yet confirmed
  '/aurix/schedule', // event-day schedule not yet confirmed
  '/aurix/results', // no results published yet
  '/aurix/portal', // participant portal shows sample data only
  '/judge', // judging portal shows sample data only
  '/login', // only needed for the participant portal
  '/register', // only needed for the participant portal
]

/** Pages that can be hidden from the CMS (Site settings → Hidden pages). The list above is the default. */
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

/** True when `href` is not under any of the `hidden` routes. */
export function isVisibleIn(hidden: readonly string[], href: string): boolean {
  const path = href.split(/[?#]/)[0]
  return !hidden.some((route) => path === route || path.startsWith(`${route}/`))
}

/** Default visibility (code list only). Server code should use getHiddenRoutes() from lib/site-settings. */
export function isRouteVisible(href: string): boolean {
  const path = href.split(/[?#]/)[0]
  return !HIDDEN_ROUTES.some((route) => path === route || path.startsWith(`${route}/`))
}
