import { saveSubmission } from '@/lib/submissions'
import { logger } from '@/lib/logger'
import { guard, json } from './guard'

export const dynamic = 'force-dynamic'

/** POST { code, round, title, track, repositoryUrl?, demoUrl?, token? } → save the team's submission for that round. */
export async function POST(req: Request) {
  const g = await guard(req, 'submission-save', 30)
  if ('res' in g) return g.res
  const body = await req.json().catch(() => null)
  try {
    const r = await saveSubmission(g.payload, g.user, body)
    if ('error' in r && r.error) return json({ success: false, message: g.T[r.error] }, r.error === 'errNoTeam' ? 403 : 400)
    return json({ success: true, message: g.T.saved })
  } catch (err: any) {
    logger.error(`Submission save failed: ${err?.message || err}`)
    return json({ success: false, message: g.T.errFailed }, 500)
  }
}
