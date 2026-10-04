import crypto from 'node:crypto'
import { revalidateSite } from '@/lib/revalidate'
import { clientIp, rateLimit } from '@/lib/rateLimit'
import { logger } from '@/lib/logger'

export const dynamic = 'force-dynamic'

/** sha256("krs-revalidate:" + PAYLOAD_SECRET): krs-deploy computes the same value from the server's .env. */
const expected = () => {
  const secret = process.env.PAYLOAD_SECRET
  return secret ? crypto.createHash('sha256').update(`krs-revalidate:${secret}`).digest('hex') : null
}

/**
 * Called by krs-deploy right after a new image is live: pages in a new image were pre-built without the database
 * (built-in defaults), so the whole page cache is cleared and the next visit to each page renders from the CMS.
 */
export async function POST(req: Request) {
  if (!rateLimit(`internal-revalidate:${clientIp(req)}`, 10, 60_000)) return new Response(null, { status: 429 })
  const want = expected()
  const got = req.headers.get('x-krs-revalidate') || ''
  if (!want || got.length !== want.length || !crypto.timingSafeEqual(Buffer.from(got), Buffer.from(want))) {
    return new Response(null, { status: 404 })
  }
  revalidateSite('deploy')
  logger.info('Page cache cleared after deploy')
  return Response.json({ ok: true })
}
