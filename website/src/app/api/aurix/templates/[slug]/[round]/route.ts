import { clientIp, rateLimit } from '@/lib/rateLimit'
import { signedGetUrl } from '@/lib/r2'
import { findTemplate } from '@/lib/templates'
import { getFormTexts } from '@/lib/form-texts'
import { logger } from '@/lib/logger'

export const dynamic = 'force-dynamic'

const text = (body: string, status: number) => new Response(body, { status, headers: { 'Content-Type': 'text/plain; charset=utf-8', 'Cache-Control': 'no-store' } })

/**
 * A round's presentation template (owner, 11 Oct 2026: anyone may download it; linked from the competition page and
 * the portal's submission page): 302 to a 5-minute signed R2 link (download). The bucket itself stays private.
 */
export async function GET(req: Request, { params }: { params: Promise<{ slug: string; round: string }> }) {
  const M = (await getFormTexts()).messages
  if (!rateLimit(`template:${clientIp(req)}`, 120, 3_600_000)) return text(M.tooManyRequests, 429)
  const { slug, round } = await params
  if (!/^[a-z0-9-]{1,60}$/.test(slug) || !/^[1-9][0-9]?$/.test(round)) return text(M.notFound, 404)
  const t = await findTemplate(slug, Number(round))
  if (!t) return text(M.notFound, 404)
  logger.info(`Template downloaded: ${t.key}`)
  return new Response(null, { status: 302, headers: { Location: await signedGetUrl(t.key, t.name), 'Cache-Control': 'no-store' } })
}
