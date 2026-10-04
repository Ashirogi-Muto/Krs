import { headers } from 'next/headers'
import { getPayload } from 'payload'
import config from '@payload-config'
import { z } from 'zod'
import { isAdmin } from '@/payload/access/roles'
import { isSameOrigin } from '@/lib/auth/same-origin'
import { cleanHiddenPaths, isHideablePath } from '@/lib/visibility'
import { rateLimitUser } from '@/lib/rateLimit'
import { logger } from '@/lib/logger'

export const dynamic = 'force-dynamic'

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' } })

const Body = z.object({ hiddenPaths: z.array(z.string().max(200)).max(300) })

/**
 * Save which pages are hidden (CMS → Website → Page visibility). Admins only.
 * POST { hiddenPaths: ["/team", ...] } -> the saved list
 */
export async function POST(req: Request) {
  if (!isSameOrigin(req)) return json({ error: 'Bad origin' }, 403)
  const payload = await getPayload({ config })
  const { user } = await payload.auth({ headers: await headers() })
  if (!user || !isAdmin(user)) return json({ error: 'Only admins can hide or show pages.' }, 403)
  if (!rateLimitUser(user.id, 'page-visibility', 30, 60_000)) return json({ error: 'Too many changes. Please slow down.' }, 429)

  const parsed = Body.safeParse(await req.json().catch(() => null))
  if (!parsed.success) return json({ error: 'Invalid request.' }, 400)
  const bad = parsed.data.hiddenPaths.filter((p) => !isHideablePath(p))
  if (bad.length) return json({ error: `These can't be hidden: ${bad.slice(0, 5).join(', ')}` }, 400)
  const next = cleanHiddenPaths(parsed.data.hiddenPaths)

  try {
    const before: any = await payload.findGlobal({ slug: 'site-settings', depth: 0, overrideAccess: true })
    const prev = cleanHiddenPaths(before?.hiddenPaths)
    // Only this field is sent: Payload keeps every other Site settings field as it is
    await payload.updateGlobal({ slug: 'site-settings', data: { hiddenPaths: next } as any, overrideAccess: false, user })
    logger.audit(String((user as any).email), 'PAGE_VISIBILITY_CHANGED', 'SiteSettings', 'hiddenPaths', {
      hidden: next.filter((p) => !prev.includes(p)),
      shown: prev.filter((p) => !next.includes(p)),
    })
    return json({ hiddenPaths: next })
  } catch (err: any) {
    logger.error(`Page visibility update failed: ${err?.message || err}`)
    return json({ error: 'Could not save. Please try again.' }, 500)
  }
}
