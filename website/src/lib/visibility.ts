/**
 * Routes hidden until they have real content or a working backend.
 * A hidden route returns 404 and is removed from navigation, footers and the sitemap.
 * To publish a page again, delete its entry here.
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

export function isRouteVisible(href: string): boolean {
  const path = href.split(/[?#]/)[0]
  return !HIDDEN_ROUTES.some((route) => path === route || path.startsWith(`${route}/`))
}
