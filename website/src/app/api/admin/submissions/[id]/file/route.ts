import { headers } from 'next/headers'
import { getPayload } from 'payload'
import config from '@payload-config'
import { isManager } from '@/payload/access/roles'
import { rateLimitUser } from '@/lib/rateLimit'
import { isR2Configured, signedGetUrl } from '@/lib/r2'
import { logger } from '@/lib/logger'
import { getStaffTexts } from '@/lib/staff-texts'

export const dynamic = 'force-dynamic'

const text = (body: string, status: number) => new Response(body, { status, headers: { 'Content-Type': 'text/plain; charset=utf-8', 'Cache-Control': 'no-store' } })

/** A submission's file for judges / registration managers: redirect to a 5-minute signed R2 link (download). */
export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const A = (await getStaffTexts()).adminApi
  const payload = await getPayload({ config })
  const { user } = await payload.auth({ headers: await headers() })
  if (!user || !(isManager(user as any) || (user as any).role === 'JUDGE')) return text(A.notAllowed, 403)
  if (!rateLimitUser(user.id, 'submission-download', 120, 60_000)) return text(A.slowDown, 429)
  const { id } = await params
  if (!/^[1-9][0-9]{0,9}$/.test(id)) return text(A.notAllowed, 404)
  const doc: any = await payload.findByID({ collection: 'round-submissions', id: Number(id), depth: 0, overrideAccess: true }).catch(() => null)
  if (!doc?.file?.key || !isR2Configured()) return text(A.notAllowed, 404)
  logger.audit(String((user as any).email || user.id), 'SUBMISSION_DOWNLOADED', 'RoundSubmission', `${doc.registrationCode}#${doc.roundNumber}`)
  return new Response(null, { status: 302, headers: { Location: await signedGetUrl(doc.file.key, doc.file.filename || 'submission'), 'Cache-Control': 'no-store' } })
}
