import { notFound } from 'next/navigation'
import { isVisibleIn } from './visibility'
import { getHiddenRoutes } from './site-settings'
import { isPreview } from './preview'

/** Server-side: is this route published (CMS Site settings → Hidden pages; staging override applies)? */
export async function isRouteVisibleOnServer(route: string): Promise<boolean> {
  return isVisibleIn(await getHiddenRoutes(), route)
}

/** Call from a server layout/page: renders the 404 page when the route is hidden (CMS editors in live preview still see it). */
export async function requireVisibleRoute(route: string): Promise<void> {
  if (!(await isRouteVisibleOnServer(route)) && !(await isPreview())) {
    notFound()
  }
}
