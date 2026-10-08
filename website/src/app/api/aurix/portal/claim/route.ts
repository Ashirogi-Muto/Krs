import { NextResponse } from 'next/server'
import { z } from 'zod'
import { getPayload } from 'payload'
import config from '@payload-config'
import { getSessionUser } from '@/lib/auth/session'
import { isRouteVisibleOnServer as isRouteVisible } from '@/lib/visibility-guard'
import { clientIp, rateLimit } from '@/lib/rateLimit'
import { logger } from '@/lib/logger'
import { isSameOrigin } from '@/lib/auth/same-origin'
import { getFormTexts } from '@/lib/form-texts'

export const dynamic = 'force-dynamic'

const ClaimSchema = z.object({
  code: z
    .string()
    .trim()
    .toUpperCase()
    .regex(/^AX26-[A-Z]{3}-[A-Z0-9]{6}$/, 'Invalid registration code format.'),
  leaderEmail: z.string().trim().toLowerCase().email().max(254),
})


export async function POST(req: Request) {
  const M = (await getFormTexts()).messages // wording: CMS → Labels & messages → Messages
  // Gate check: Portal APIs return 404 when portal is hidden
  if (!(await isRouteVisible('/aurix/portal'))) {
    return NextResponse.json({ success: false, message: M.notFound }, { status: 404 })
  }

  // Only from this site (blocks cross-site form posts riding on the session cookie)
  if (!isSameOrigin(req)) {
    return NextResponse.json({ success: false, message: M.badOrigin }, { status: 403 })
  }

  // 1. Session verification
  const user = await getSessionUser()
  if (!user) {
    return NextResponse.json({ success: false, message: M.authRequired }, { status: 401 })
  }
  // Claiming links a team to this account: only for confirmed email addresses (staff accounts don't use the portal flow)
  if (user.role === 'PARTICIPANT' && !user.emailVerified) {
    return NextResponse.json({ success: false, message: M.confirmFirst }, { status: 403 })
  }

  // 2. Rate limiting (Domain 05 / Domain 29)
  const ip = clientIp(req)
  if (!rateLimit(`claim-ip:${ip}`, 10, 60 * 60 * 1000)) {
    return NextResponse.json(
      { success: false, message: M.claimTooManyIp },
      { status: 429 }
    )
  }
  if (!rateLimit(`claim-user:${user.id}`, 10, 60 * 60 * 1000)) {
    return NextResponse.json(
      { success: false, message: M.claimTooManyUser },
      { status: 429 }
    )
  }

  // 3. Input validation
  let parsed: z.infer<typeof ClaimSchema>
  try {
    const body = await req.json()
    parsed = ClaimSchema.parse(body)
  } catch {
    return NextResponse.json({ success: false, message: M.claimNotFound }, { status: 400 })
  }

  const payload = await getPayload({ config })

  try {
    // 4. Query matching registration
    const result = await payload.find({
      collection: 'event-registrations',
      where: {
        and: [
          { registrationCode: { equals: parsed.code } },
          { leaderEmail: { equals: parsed.leaderEmail } },
        ],
      },
      limit: 1,
      depth: 1,
      overrideAccess: true, // explicit server-side lookup verified against inputs
    })

    const reg = result.docs[0] as Record<string, any> | undefined
    if (!reg) {
      return NextResponse.json({ success: false, message: M.claimNotFound }, { status: 404 })
    }

    // 5. Authorization: user email must equal leaderEmail OR one of members[].email
    const userEmail = user.email.toLowerCase()
    const leaderEmailMatch = reg.leaderEmail && reg.leaderEmail.toLowerCase() === userEmail
    const memberEmails = (reg.members || [])
      .map((m: Record<string, any>) => (m.email ? String(m.email).trim().toLowerCase() : ''))
      .filter(Boolean)
    const memberEmailMatch = memberEmails.includes(userEmail)

    if (!leaderEmailMatch && !memberEmailMatch) {
      logger.warn(
        `[claim] User ${user.email} attempted to claim registration ${parsed.code} belonging to ${reg.leaderEmail}`
      )
      // Generic failure — do not leak that the code exists or who owns it
      return NextResponse.json({ success: false, message: M.claimNotFound }, { status: 404 })
    }

    // 6. Link user account to participants array
    const existingParticipants = Array.isArray(reg.participants)
      ? reg.participants.map((p: any) => (typeof p === 'object' && p !== null ? p.id : p))
      : []

    const userIdNum = Number(user.id)
    const alreadyLinked = existingParticipants.some((pId: any) => String(pId) === String(user.id))

    if (!alreadyLinked) {
      const updatedParticipants = [...existingParticipants, isNaN(userIdNum) ? user.id : userIdNum]

      await payload.update({
        collection: 'event-registrations',
        id: reg.id,
        data: {
          participants: updatedParticipants,
        },
        overrideAccess: true, // authorized by ownership check above
      })

      logger.audit(user.email, 'REGISTRATION_CLAIMED', 'EventRegistration', String(reg.id), {
        code: parsed.code,
        teamName: reg.teamName,
      })
    }

    return NextResponse.json({
      success: true,
      message: M.claimDone,
      registration: {
        registrationCode: reg.registrationCode,
        teamName: reg.teamName,
      },
    })
  } catch (err: any) {
    logger.error(`[claim] Error claiming registration: ${err.message}`)
    return NextResponse.json(
      { success: false, message: M.claimFailed },
      { status: 500 }
    )
  }
}
