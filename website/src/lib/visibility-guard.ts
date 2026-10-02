import { notFound } from 'next/navigation'
import { isRouteVisible } from './visibility'

/**
 * Server-side visibility: hidden routes (lib/visibility.ts) return 404. For testing a hidden feature on the staging
 * copy only, the server environment may list routes to show anyway: STAGING_SHOW_HIDDEN_ROUTES=/aurix/portal,/login
 * (never set in production; menus in the browser are not affected).
 */
export function isRouteVisibleOnServer(route: string): boolean {
  if (isRouteVisible(route)) return true
  const extra = (process.env.STAGING_SHOW_HIDDEN_ROUTES || '').split(',').map((r) => r.trim()).filter(Boolean)
  return extra.some((r) => route === r || route.startsWith(`${r}/`))
}

/** Call from a server layout/page: renders the 404 page when the route is hidden. */
export function requireVisibleRoute(route: string): void {
  if (!isRouteVisibleOnServer(route)) {
    notFound()
  }
}
