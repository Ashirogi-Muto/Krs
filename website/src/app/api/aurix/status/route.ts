import { NextResponse } from 'next/server'
import { z } from 'zod'
import { getPayload } from 'payload'
import config from '@payload-config'
import { clientIp, rateLimit } from '@/lib/rateLimit'
import { getFormTexts } from '@/lib/form-texts'

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
  return NextResponse.json({
    success: true,
    registration: {
      registrationCode: reg.registrationCode,
      eventTitle: event?.title || 'AURIX 2026',
      eventSlug: event?.slug || null,
      teamName: reg.teamName,
      members: (reg.members || []).map((m: Record<string, any>) => ({ name: m.name, college: m.college })),
      amountDue: reg.amountDue ?? null,
      status: reg.status,
      paymentStatus: reg.paymentStatus,
      idVerification: reg.idVerification,
      registeredAt: reg.createdAt,
    },
  })
}
