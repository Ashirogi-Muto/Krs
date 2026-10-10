import fs from 'node:fs/promises'
import path from 'node:path'
import { headers } from 'next/headers'
import { getPayload } from 'payload'
import config from '@payload-config'
import { canAll } from '@/payload/access/permissions'
import { isAdmin } from '@/payload/access/roles'
import { rateLimitUser } from '@/lib/rateLimit'
import { logger } from '@/lib/logger'
import { getStaffTexts } from '@/lib/staff-texts'
import { REPORTS_DIR } from '@/lib/payments/reports'

export const dynamic = 'force-dynamic'

const text = (body: string, status: number) => new Response(body, { status, headers: { 'Content-Type': 'text/plain; charset=utf-8', 'Cache-Control': 'no-store' } })

/**
 * A stored Razorpay report, as a download. A report lists payers of every event, so it needs "Payment matching"
 * for all events (or an admin account), not just for some.
 */
export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const A = (await getStaffTexts()).adminApi
  const payload = await getPayload({ config })
  const { user } = await payload.auth({ headers: await headers() })
  if (!user || !(isAdmin(user as any) || canAll(user as any, 'tools.paymentMatching'))) return text(A.notAllowed, 403)
  if (!rateLimitUser(user.id, 'payment-report-download', 30, 60_000)) return text(A.slowDown, 429)
  const { id } = await params
  if (!/^[1-9][0-9]{0,9}$/.test(id)) return text(A.notAllowed, 404)
  const doc: any = await payload.findByID({ collection: 'payment-reports', id: Number(id), depth: 0, overrideAccess: true }).catch(() => null)
  if (!doc?.filename) return text(A.notAllowed, 404)
  // The stored name is server-chosen; basename() keeps any path out of it anyway
  const file = await fs.readFile(path.join(REPORTS_DIR, path.basename(doc.filename))).catch(() => null)
  if (!file) return text(A.notAllowed, 404)
  const ext = path.extname(doc.filename).toLowerCase() === '.xlsx' ? '.xlsx' : '.csv'
  const base = String(doc.originalName || 'razorpay-report').replace(/\.(xlsx|csv)$/i, '').replace(/[^A-Za-z0-9 ._()-]/g, '_').slice(0, 100) || 'razorpay-report'
  logger.audit(String((user as any).email || user.id), 'PAYMENT_REPORT_DOWNLOADED', 'PaymentReport', String(doc.id))
  return new Response(new Uint8Array(file), {
    status: 200,
    headers: {
      'Content-Type': ext === '.xlsx' ? 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' : 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="${base}${ext}"`,
      'Cache-Control': 'private, no-store, max-age=0',
      'X-Content-Type-Options': 'nosniff',
    },
  })
}
