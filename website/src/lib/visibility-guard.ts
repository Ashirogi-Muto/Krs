import { notFound } from 'next/navigation'
import { isRouteVisible } from './visibility'

/** Call from a server layout/page: renders the 404 page when the route is hidden. */
export function requireVisibleRoute(route: string): void {
  if (!isRouteVisible(route)) {
    notFound()
  }
}
