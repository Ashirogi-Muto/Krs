import { headers } from 'next/headers'
import { getPayload } from 'payload'
import config from '@payload-config'
import { z } from 'zod'
import { can } from '@/payload/access/permissions'
import { isSameOrigin } from '@/lib/auth/same-origin'
import { cleanHiddenPaths, isHideablePath } from '@/lib/visibility'
import { rateLimitUser } from '@/lib/rateLimit'
import { logger } from '@/lib/logger'
import { getStaffTexts } from '@/lib/staff-texts'
import { fill } from '@/lib/form-texts-defaults'

export const dynamic = 'force-dynamic'

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' } })

const Body = z.object({ hiddenPaths: z.array(z.string().max(200)).max(300) })

/**
 * Save which pages are hidden (CMS → Website → Page visibility). Admins only.
 * POST { hiddenPaths: ["/team", ...] } -> the saved list
 */
export async function POST(req: Request) {
  const A = (await getStaffTexts()).adminApi // wording: CMS → Admin tools → Staff & admin texts
  if (!isSameOrigin(req)) return json({ error: A.badOrigin }, 403)
  const payload = await getPayload({ config })
  const { user } = await payload.auth({ headers: await headers() })
  if (!user || !can(user as any, 'admin.pageVisibility')) return json({ error: A.visibilityAdminsOnly }, 403)
  if (!rateLimitUser(user.id, 'page-visibility', 30, 60_000)) return json({ error: A.visibilityTooMany }, 429)

  const parsed = Body.safeParse(await req.json().catch(() => null))
  if (!parsed.success) return json({ error: A.invalidRequest }, 400)
  const bad = parsed.data.hiddenPaths.filter((p) => !isHideablePath(p))
  if (bad.length) return json({ error: fill(A.visibilityCannotHide, { paths: bad.slice(0, 5).join(', ') }) }, 400)
  const next = cleanHiddenPaths(parsed.data.hiddenPaths)

  try {
    const before: any = await payload.findGlobal({ slug: 'site-settings', depth: 0, overrideAccess: true })
    const prev = cleanHiddenPaths(before?.hiddenPaths)
    // Only this field is sent: Payload keeps every other Site settings field as it is. The "Page visibility" permission
    // was checked above and the paths validated; it does not include editing the rest of Site settings.
    await payload.updateGlobal({ slug: 'site-settings', data: { hiddenPaths: next } as any, overrideAccess: true })
    logger.audit(String((user as any).email), 'PAGE_VISIBILITY_CHANGED', 'SiteSettings', 'hiddenPaths', {
      hidden: next.filter((p) => !prev.includes(p)),
      shown: prev.filter((p) => !next.includes(p)),
    })
    return json({ hiddenPaths: next })
  } catch (err: any) {
    logger.error(`Page visibility update failed: ${err?.message || err}`)
    return json({ error: A.visibilityFailed }, 500)
  }
}
