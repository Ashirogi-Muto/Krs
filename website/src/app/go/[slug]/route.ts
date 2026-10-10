import { resolveShortLink } from '@/lib/shortLinks'
import { clientIp, rateLimit } from '@/lib/rateLimit'
import { getFormTexts } from '@/lib/form-texts'

export const dynamic = 'force-dynamic'

export async function GET(req: Request, { params }: { params: Promise<{ slug: string }> }) {
  // Each short link is a database lookup: 120 per minute per visitor is far above normal use
  if (!rateLimit(`golink:${clientIp(req)}`, 120, 60 * 1000)) {
    return new Response((await getFormTexts()).messages.tooManyRequests, { status: 429, headers: { 'Retry-After': '60' } })
  }
  const { slug } = await params
  return resolveShortLink(slug)
}
