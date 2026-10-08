import { draftMode, headers } from 'next/headers'
import { getPayload } from 'payload'
import config from '@payload-config'
import { clientIp, rateLimit } from '@/lib/rateLimit'
import { logger } from '@/lib/logger'
import { getStaffTexts } from '@/lib/staff-texts'
import { PREVIEW_COLLECTIONS, PREVIEW_GLOBALS, canPreviewTarget, isSafeSitePath, parsePreviewTarget } from '@/lib/preview-targets'

export const dynamic = 'force-dynamic'

const text = (body: string, status: number) =>
  new Response(body, { status, headers: { 'Content-Type': 'text/plain; charset=utf-8', 'Cache-Control': 'private, no-store', 'X-Robots-Tag': 'noindex, nofollow' } })

/**
 * Live preview entry (the CMS preview panel loads `/api/preview?c=pages&id=18` or `?g=form-texts`).
 * Who: the CMS session (payload.auth; Payload ignores the cookie on cross-site requests) must belong to an editor of that
 * screen. Where: the page address is read from the document / a fixed list, never from the request. Then Next draft mode
 * is switched on (pages render uncached, private, no-store) and the browser goes to that page.
 */
export async function GET(req: Request) {
  const payload = await getPayload({ config })
  const T = (await getStaffTexts(payload)).preview
  if (!rateLimit(`preview:${clientIp(req)}`, 120, 60_000)) return text(T.tooMany, 429)
  const target = parsePreviewTarget(new URL(req.url).searchParams)
  if (!target) return text(T.badRequest, 400)

  const { user } = await payload.auth({ headers: await headers() })
  if (!user) return text(T.notLoggedIn, 401)
  if (!canPreviewTarget(user, target)) {
    logger.audit(String(user.id), 'PREVIEW_DENIED', target.kind, target.slug, {})
    return text(T.notAllowed, 403)
  }

  let path: string | null = null
  if (target.kind === 'global') path = PREVIEW_GLOBALS[target.slug].path
  else {
    // Pages: the latest draft knows the address of a page that was never published
    const doc = await payload
      .findByID({ collection: target.slug as any, id: target.id, depth: 0, overrideAccess: true, draft: target.slug === 'pages' })
      .catch(() => null)
    path = doc ? PREVIEW_COLLECTIONS[target.slug].path(doc as any) : null
  }
  if (!isSafeSitePath(path)) return text(T.notFound, 404)

  ;(await draftMode()).enable()
  logger.audit(String(user.id), 'PREVIEW_ENTER', target.kind, target.slug, { path })
  return new Response(null, { status: 303, headers: { Location: path, 'Cache-Control': 'private, no-store' } })
}
