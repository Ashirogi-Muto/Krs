import { NextResponse } from 'next/server'
import { entryOptionsOf } from '@/lib/entry-options'
import { z } from 'zod'
import { getPayload } from 'payload'
import config from '@payload-config'
import { clientIp, rateLimit } from '@/lib/rateLimit'
import { getFormTexts } from '@/lib/form-texts'
import { canReupload } from '@/lib/id-reupload'
import { receiptNeeded } from '@/lib/receipt-rules'

export const dynamic = 'force-dynamic'

const LookupSchema = z.object({
  code: z.string().trim().toUpperCase().regex(/^AX26-[A-Z]{3}-[A-Z0-9]{6}$/),
  email: z.string().trim().toLowerCase().email().max(254),
})


/**
 * Public registration status lookup. Requires the registration code AND the team leader's email;
 * returns only non-sensitive fields (no phone numbers, emails, ID files or admin notes).
 */
export async function POST(req: Request) {
  const M = (await getFormTexts()).messages // wording: CMS → Labels & messages → Messages
  if (!rateLimit(`status:${clientIp(req)}`, 20, 60 * 60 * 1000)) {
    return NextResponse.json({ success: false, message: M.statusTooMany }, { status: 429 })
  }

  let parsed: z.infer<typeof LookupSchema>
  try {
    parsed = LookupSchema.parse(await req.json())
  } catch {
    return NextResponse.json({ success: false, message: M.statusNotFound }, { status: 404 })
  }

  const payload = await getPayload({ config })
  const result = await payload.find({
    collection: 'event-registrations',
    where: {
      and: [{ registrationCode: { equals: parsed.code } }, { leaderEmail: { equals: parsed.email } }],
    },
    limit: 1,
    depth: 1,
    overrideAccess: true,
  })
  const reg = result.docs[0] as Record<string, any> | undefined
  if (!reg) {
    return NextResponse.json({ success: false, message: M.statusNotFound }, { status: 404 })
  }

  const event = reg.event && typeof reg.event === 'object' ? reg.event : null
  // Not paid yet (and still active): the same pre-filled payment page as after registering. The requester already knows
  // the code and the leader email; the phone number is left out (this lookup never shows phone numbers).
  const amount = reg.amountDue ?? event?.registrationFee ?? null
  const canPay = reg.paymentStatus === 'AWAITING_PAYMENT' && ['PENDING', 'CONFIRMED'].includes(reg.status) && Number(amount) > 0
  // The checkout step (login as the team leader) shows the amount, takes a coupon and builds the payment link
  const paymentUrl = canPay ? `/aurix/pay/${reg.registrationCode}` : null
  return NextResponse.json({
    success: true,
    registration: {
      registrationCode: reg.registrationCode,
      eventTitle: event?.title || 'AURIX 2026',
      eventSlug: event?.slug || null,
      teamName: reg.teamName,
      members: (reg.members || []).map((m: Record<string, any>) => ({ name: m.name, college: m.college })),
      amountDue: reg.amountDue ?? null,
      // Entry options: the team's own option wording (e.g. " / squad")
      feeSuffix: entryOptionsOf(event?.entryOptions).find((o) => o.name === reg.entryOption)?.feeSuffix || event?.feeSuffix || null,
      status: reg.status,
      paymentStatus: reg.paymentStatus,
      idVerification: reg.idVerification,
      registeredAt: reg.createdAt,
      paymentUrl,
      // Student ID rejected: link to /aurix/update-id (login required there) and the deadline, if one was set
      idReupload: canReupload(reg) ? { deadline: reg.idReuploadDeadline || null } : null,
      // Payment receipt: required until the payment is verified (only "uploaded when", never the file)
      receipt: { uploadedAt: reg.receiptUploadedAt || null, needed: receiptNeeded(reg as any) },
    },
  })
}
