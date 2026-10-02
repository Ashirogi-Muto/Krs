import { getPayload } from 'payload'
import config from '@payload-config'
import { logger } from '@/lib/logger'

const SITE = () => (process.env.NEXT_PUBLIC_SITE_URL || 'https://kalamroboticssociety.com').replace(/\/$/, '')
const FALLBACK_PATH = '/aurix'

function redirectTo(location: string): Response {
  return new Response(null, {
    status: 302,
    headers: {
      Location: location,
      // Never cache, so edits in the CMS apply immediately (also at Cloudflare)
      'Cache-Control': 'no-store, max-age=0',
    },
  })
}

/** Resolves a short-link slug to an absolute URL and redirects; unknown links go to the AURIX page. */
export async function resolveShortLink(rawSlug: string | undefined): Promise<Response> {
  const site = SITE()
  const slug = (rawSlug || '').toLowerCase().trim()
  if (!slug || !/^[a-z0-9-]{1,80}$/.test(slug)) {
    return redirectTo(`${site}${FALLBACK_PATH}`)
  }

  try {
    const payload = await getPayload({ config })
    const result = await payload.find({
      collection: 'short-links',
      where: { and: [{ slug: { equals: slug } }, { active: { equals: true } }] },
      limit: 1,
      depth: 1,
      overrideAccess: true,
    })
    const link = result.docs[0] as Record<string, any> | undefined
    if (!link) return redirectTo(`${site}${FALLBACK_PATH}`)

    let target = `${site}${FALLBACK_PATH}`
    if (link.destinationType === 'EVENT' && link.event && typeof link.event === 'object' && link.event.slug) {
      target =
        link.eventTarget === 'REGISTER'
          ? `${site}/aurix/register?event=${encodeURIComponent(link.event.slug)}`
          : `${site}/aurix/${encodeURIComponent(link.event.slug)}`
    } else if (link.destinationType === 'PATH' && typeof link.path === 'string' && link.path.startsWith('/') && !link.path.startsWith('//')) {
      target = `${site}${link.path}`
    } else if (link.destinationType === 'URL' && typeof link.url === 'string' && /^https?:\/\//i.test(link.url)) {
      target = link.url
    }

    // Count the click without delaying the redirect
    payload
      .update({
        collection: 'short-links',
        id: link.id,
        data: { clicks: (link.clicks || 0) + 1 },
        overrideAccess: true,
        depth: 0,
      })
      .catch(() => undefined)

    return redirectTo(target)
  } catch (err: any) {
    logger.warn(`Short link "${slug}" failed: ${err?.message || err}`)
    return redirectTo(`${site}${FALLBACK_PATH}`)
  }
}
