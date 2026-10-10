import { startReceiptUpload } from '@/lib/receipts'
import { logger } from '@/lib/logger'
import { guard, json } from '../guard'

export const dynamic = 'force-dynamic'

/** POST { code, filename, size } → { url, token, contentType }: signed link to upload the receipt to R2. */
export async function POST(req: Request) {
  const g = await guard(req, 'receipt-url', 10)
  if ('res' in g) return g.res
  const body = await req.json().catch(() => null)
  try {
    const r = await startReceiptUpload(g.payload, g.user, body)
    if ('error' in r && r.error) return json({ success: false, message: g.T[r.error] }, r.error === 'errNoTeam' ? 403 : 400)
    return json({ success: true, ...r })
  } catch (err: any) {
    logger.error(`Receipt upload link failed: ${err?.message || err}`)
    return json({ success: false, message: g.T.errFailed }, 500)
  }
}
