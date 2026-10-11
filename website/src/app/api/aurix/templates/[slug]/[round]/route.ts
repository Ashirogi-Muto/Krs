import { getSessionUser } from '@/lib/auth/session'
import { isRouteVisibleOnServer } from '@/lib/visibility-guard'
import { rateLimit } from '@/lib/rateLimit'
import { signedGetUrl } from '@/lib/r2'
import { findTemplate } from '@/lib/templates'
import { getFormTexts } from '@/lib/form-texts'
import { logger } from '@/lib/logger'

export const dynamic = 'force-dynamic'

const text = (body: string, status: number) => new Response(body, { status, headers: { 'Content-Type': 'text/plain; charset=utf-8', 'Cache-Control': 'no-store' } })

/** A round's presentation template for logged-in participants (owner): 302 to a 5-minute signed R2 link (download). */
export async function GET(_req: Request, { params }: { params: Promise<{ slug: string; round: string }> }) {
  const M = (await getFormTexts()).messages
  if (!(await isRouteVisibleOnServer('/aurix/portal'))) return text(M.notFound, 404)
  const user = await getSessionUser()
  if (!user) return text(M.authRequired, 401)
  if (!user.emailVerified) return text(M.regConfirm, 403)
  if (!rateLimit(`template:${user.id}`, 30, 3_600_000)) return text(M.tooManyRequests, 429)
  const { slug, round } = await params
  if (!/^[a-z0-9-]{1,60}$/.test(slug) || !/^[1-9][0-9]?$/.test(round)) return text(M.notFound, 404)
  const t = await findTemplate(slug, Number(round))
  if (!t) return text(M.notFound, 404)
  logger.audit(String(user.email || user.id), 'TEMPLATE_DOWNLOADED', 'R2', t.key)
  return new Response(null, { status: 302, headers: { Location: await signedGetUrl(t.key, t.name), 'Cache-Control': 'no-store' } })
}
