import { saveReceipt } from '@/lib/receipts'
import { logger } from '@/lib/logger'
import { guard, json } from './guard'

export const dynamic = 'force-dynamic'

/** POST { code, token, paymentId? } → records the uploaded receipt on the registration (replacing an earlier one). */
export async function POST(req: Request) {
  const g = await guard(req, 'receipt-save', 20)
  if ('res' in g) return g.res
  const body = await req.json().catch(() => null)
  try {
    const r = await saveReceipt(g.payload, g.user, body)
    if ('error' in r && r.error) return json({ success: false, message: g.T[r.error] }, r.error === 'errNoTeam' ? 403 : 400)
    return json({ success: true, message: g.T.done })
  } catch (err: any) {
    logger.error(`Receipt save failed: ${err?.message || err}`)
    return json({ success: false, message: g.T.errFailed }, 500)
  }
}
