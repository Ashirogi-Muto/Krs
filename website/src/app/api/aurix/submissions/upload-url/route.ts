import { startUpload } from '@/lib/submissions'
import { logger } from '@/lib/logger'
import { guard, json } from '../guard'

export const dynamic = 'force-dynamic'

/** POST { code, round, filename, size } → { url, token, contentType }: signed link to upload the file to R2. */
export async function POST(req: Request) {
  const g = await guard(req, 'submission-url', 20)
  if ('res' in g) return g.res
  const body = await req.json().catch(() => null)
  try {
    const r = await startUpload(g.payload, g.user, body)
    if ('error' in r && r.error) return json({ success: false, message: g.T[r.error] }, r.error === 'errNoTeam' ? 403 : 400)
    return json({ success: true, ...r })
  } catch (err: any) {
    logger.error(`Submission upload link failed: ${err?.message || err}`)
    return json({ success: false, message: g.T.errFailed }, 500)
  }
}
