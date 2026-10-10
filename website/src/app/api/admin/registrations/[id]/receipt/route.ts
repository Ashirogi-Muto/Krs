import { headers } from 'next/headers'
import { getPayload } from 'payload'
import config from '@payload-config'
import { canFor, eventIdOf } from '@/payload/access/permissions'
import { rateLimitUser } from '@/lib/rateLimit'
import { isR2Configured, signedGetUrl } from '@/lib/r2'
import { logger } from '@/lib/logger'
import { getStaffTexts } from '@/lib/staff-texts'

export const dynamic = 'force-dynamic'

const text = (body: string, status: number) => new Response(body, { status, headers: { 'Content-Type': 'text/plain; charset=utf-8', 'Cache-Control': 'no-store' } })

/** A registration's payment receipt for staff who may see money for its event: 302 to a 5-minute signed R2 link. */
export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const A = (await getStaffTexts()).adminApi
  const payload = await getPayload({ config })
  const { user } = await payload.auth({ headers: await headers() })
  if (!user) return text(A.notAllowed, 403)
  if (!rateLimitUser(user.id, 'receipt-download', 120, 60_000)) return text(A.slowDown, 429)
  const { id } = await params
  if (!/^[1-9][0-9]{0,9}$/.test(id)) return text(A.notAllowed, 404)
  const reg: any = await payload.findByID({ collection: 'event-registrations', id: Number(id), depth: 0, overrideAccess: true }).catch(() => null)
  if (!reg?.receiptKey || !isR2Configured()) return text(A.notAllowed, 404)
  if (!canFor(user as any, 'registrations.money', eventIdOf(reg))) return text(A.notAllowed, 404)
  logger.audit(String((user as any).email || user.id), 'RECEIPT_DOWNLOADED', 'EventRegistration', String(reg.registrationCode))
  return new Response(null, { status: 302, headers: { Location: await signedGetUrl(reg.receiptKey, reg.receiptFilename || 'receipt'), 'Cache-Control': 'no-store' } })
}
