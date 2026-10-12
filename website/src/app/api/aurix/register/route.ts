import crypto from 'node:crypto'
import { NextResponse } from 'next/server'
import { z } from 'zod'
import { getPayload } from 'payload'
import config from '@payload-config'
import { getEventBySlug } from '@/lib/data/events'
import { buildRazorpayPaymentUrl } from '@/lib/payments/razorpayPage'
import { headers } from 'next/headers'
import { clientIp, rateLimit } from '@/lib/rateLimit'
import { logger } from '@/lib/logger'
import { queueEmail } from '@/lib/email/outbox'
import { registrationConfirmation } from '@/lib/email/templates'
import { getFormTexts } from '@/lib/form-texts'
import { fill } from '@/lib/form-texts-defaults'
import { accountRequired } from '@/lib/auth/participant'
import { EXTENSIONS, MAX_FILE_BYTES, sniffMime } from '@/lib/id-files'
import { cleanBranch, cleanYear, type YearValue } from '@/lib/member-details'

export const dynamic = 'force-dynamic'

const DEFAULT_MAX_TEAM = 5

const phoneSchema = z
  .string()
  .trim()
  .refine((v) => {
    const digits = v.replace(/\D/g, '')
    return digits.length >= 10 && digits.length <= 13
  }, 'Invalid phone number')

// Every member: name, email, phone and college (owner, 8 Oct 2026). Checked one by one below so the message names them.
const MemberSchema = z.object({
  name: z.string().trim().min(2).max(120),
  email: z.string().trim().max(254).optional().default(''),
  phone: z.string().trim().max(40).optional().default(''),
  college: z.string().trim().min(2).max(200),
  // Optional (owner, 11 Oct 2026): school students too; checked below so the message names the member
  branch: z.string().max(100).optional().default(''),
  year: z.string().max(10).optional().default(''),
})

const RegistrationSchema = z.object({
  eventSlug: z.string().trim().min(1).max(80),
  teamName: z.string().trim().min(2).max(120),
  consent: z.literal(true),
  website: z.string().max(0).optional(), // honeypot: real users never fill this
  members: z.array(MemberSchema).min(1).max(10),
})

const EVENT_CODES: Record<string, string> = {
  hackathon: 'HAC',
  'robo-soccer': 'SOC',
  'robo-race': 'RAC',
  'robo-expo': 'EXP',
  'robo-ideathon': 'IDE',
}

const CODE_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789' // no 0/O/1/I

function newRegistrationCode(slug: string): string {
  const bytes = crypto.randomBytes(6)
  const suffix = Array.from(bytes, (b) => CODE_ALPHABET[b % CODE_ALPHABET.length]).join('')
  // Competitions added later in the CMS: the first three letters of the slug (padded), e.g. drone-race → DRO
  const derived = (slug.toUpperCase().replace(/[^A-Z]/g, '') + 'XXX').slice(0, 3)
  return `AX26-${EVENT_CODES[slug] || derived}-${suffix}`
}

const fail = (message: string, status = 400) => NextResponse.json({ success: false, message }, { status })

export async function POST(req: Request) {
  const texts = await getFormTexts()
  const M = texts.messages // wording: CMS → Labels & messages → Messages
  const ip = clientIp(req)
  // Per IP is generous (whole campuses share one IP); the real limit is per account below
  if (!rateLimit(`register:${ip}`, 40, 60 * 60 * 1000)) {
    return fail(M.regTooManyNetwork, 429)
  }

  // Registration needs a logged-in account with a confirmed email, and that account is the team leader. Only an
  // explicit AURIX_REQUIRE_ACCOUNT=0 allows registering without an account (a confirmed account is still linked).
  const requireAccount = accountRequired()
  const payloadAuth = await getPayload({ config })
  const { user: sessionUser } = await payloadAuth.auth({ headers: await headers() })
  const user = sessionUser && (sessionUser as any).emailVerified ? sessionUser : null
  if (requireAccount && !sessionUser) return fail(M.regLogin, 401)
  if (requireAccount && !user) return fail(M.regConfirm, 403)
  if (user && !rateLimit(`register-user:${user.id}`, 10, 60 * 60 * 1000)) {
    return fail(M.regTooMany, 429)
  }

  let form: FormData
  try {
    form = await req.formData()
  } catch {
    return fail(M.regInvalidForm)
  }

  let parsed: z.infer<typeof RegistrationSchema>
  try {
    parsed = RegistrationSchema.parse(JSON.parse(String(form.get('payload') || '{}')))
  } catch {
    return fail(M.regCheckFields)
  }

  const leader = parsed.members[0]
  if (!leader.email || !leader.phone) {
    return fail(M.regLeaderContact)
  }
  for (const m of parsed.members) {
    if (!z.string().email().safeParse(m.email).success || !phoneSchema.safeParse(m.phone).success) {
      return fail(fill(M.regMemberContact, { name: m.name }))
    }
    if (cleanBranch(m.branch) === false) return fail(fill(M.regBranch, { name: m.name }))
    if (cleanYear(m.year) === false) return fail(fill(M.regYear, { name: m.name }))
  }

  // With a confirmed account, the leader email is always the account's email (whatever the browser sent)
  const leaderEmail = (user ? String(user.email) : leader.email).toLowerCase().trim()
  if (!user && !rateLimit(`register-email:${leaderEmail}`, 5, 60 * 60 * 1000)) {
    return fail(M.regTooManyEmail, 429)
  }


  const event = await getEventBySlug(parsed.eventSlug)
  const eventId = Number(event?.id)
  if (!event || !Number.isFinite(eventId) || event.series !== 'AURIX' || event.comingSoon) {
    return fail(M.regNotOpen)
  }
  if (event.status !== 'REGISTRATION_OPEN') {
    return fail(M.regNotOpen)
  }
  if (event.registrationClose && Date.now() > new Date(event.registrationClose).getTime()) {
    return fail(M.regClosed)
  }

  const minTeam = event.minTeamSize ?? 1
  const maxTeam = event.maxTeamSize ?? DEFAULT_MAX_TEAM
  if (parsed.members.length < minTeam || parsed.members.length > maxTeam) {
    return fail(fill(M.regTeamSize, { event: event.shortName, count: minTeam === maxTeam ? minTeam : `${minTeam}–${maxTeam}` }))
  }

  // Student IDs (field names id_0, id_1, ...): the team leader's is required, the other members' are optional
  // (owner, 8 Oct 2026). A file that is sent is always checked (size and real type).
  const files: ({ data: Buffer; mimetype: string; size: number } | null)[] = []
  for (let i = 0; i < parsed.members.length; i++) {
    const file = form.get(`id_${i}`)
    if (!(file instanceof File) || file.size === 0) {
      if (i === 0) return fail(fill(M.regIdMissing, { name: parsed.members[i].name }))
      files.push(null)
      continue
    }
    if (file.size > MAX_FILE_BYTES) {
      return fail(fill(M.regIdTooBig, { name: parsed.members[i].name }))
    }
    const data = Buffer.from(await file.arrayBuffer())
    const mimetype = sniffMime(data)
    if (!mimetype) {
      return fail(fill(M.regIdType, { name: parsed.members[i].name }))
    }
    files.push({ data, mimetype, size: data.length })
  }

  const payload = await getPayload({ config })

  const duplicate = await payload.find({
    collection: 'event-registrations',
    where: {
      and: [
        { event: { equals: eventId } },
        { leaderEmail: { equals: leaderEmail } },
        { status: { not_in: ['CANCELLED', 'REJECTED'] } },
      ],
    },
    limit: 1,
    depth: 0,
    overrideAccess: true,
  })
  if (duplicate.totalDocs > 0) {
    return fail(M.regDuplicate, 409)
  }

  const registrationCode = newRegistrationCode(event.slug)
  const createdDocIds: (number | string)[] = []
  let registrationId: number | string | undefined

  try {
    const memberRows = []
    for (let i = 0; i < parsed.members.length; i++) {
      const member = parsed.members[i]
      const upload = files[i]
      const doc = upload
        ? await payload.create({
            collection: 'id-documents',
            overrideAccess: true,
            data: { memberName: member.name, registrationCode },
            file: {
              data: upload.data,
              mimetype: upload.mimetype,
              name: `${registrationCode}-${i + 1}.${EXTENSIONS[upload.mimetype]}`,
              size: upload.size,
            },
          })
        : null
      if (doc) createdDocIds.push(doc.id)
      memberRows.push({
        name: member.name,
        email: i === 0 ? leaderEmail : member.email.toLowerCase(),
        phone: member.phone,
        college: member.college,
        branch: (cleanBranch(member.branch) as string) || undefined,
        year: (cleanYear(member.year) || undefined) as YearValue | undefined,
        ...(doc ? { idDocument: doc.id } : {}),
      })
    }

    const created = await payload.create({
      collection: 'event-registrations',
      overrideAccess: true,
      data: {
        registrationCode,
        event: eventId,
        teamName: parsed.teamName,
        leaderName: leader.name,
        leaderEmail,
        leaderPhone: leader.phone,
        college: leader.college,
        members: memberRows,
        amountDue: event.registrationFee ?? undefined,
        consent: true,
        ...(user ? { participants: [user.id] } : {}),
      },
    })
    registrationId = created.id
  } catch (err: any) {
    logger.error(`Registration failed for ${registrationCode}: ${err?.message || err}`)
    for (const id of createdDocIds) {
      await payload.delete({ collection: 'id-documents', id, overrideAccess: true }).catch(() => undefined)
    }
    // Payload rejects images it cannot read (corrupt files, unusual formats saved with a .jpg name)
    if (err?.name === 'FileUploadError' || /upload|invalid: file/i.test(String(err?.message))) {
      return fail(fill(M.regIdUnreadable, { n: createdDocIds.length + 1 }))
    }
    return fail(M.regSaveFailed, 500)
  }

  logger.audit(leaderEmail, 'AURIX_REGISTRATION_CREATED', 'EventRegistration', registrationCode, {
    event: event.slug,
    members: parsed.members.length,
  })

  const paymentUrl = buildRazorpayPaymentUrl({
    name: leader.name,
    email: leaderEmail,
    phone: leader.phone,
    college: leader.college,
    eventLabel: event.paymentEventLabel,
    amountInRupees: event.registrationFee,
  })

  // Confirmation email: only queued here (sent by the background worker); never fails the registration
  const email = registrationConfirmation({
    registrationCode,
    teamName: parsed.teamName,
    leaderName: leader.name,
    leaderEmail,
    leaderPhone: leader.phone,
    college: leader.college,
    members: parsed.members.map((m) => ({ name: m.name, college: m.college })),
    event: { title: event.title, slug: event.slug, startDate: event.startDate, endDate: event.endDate, venue: event.venue },
    amountDue: event.registrationFee,
    paymentUrl: event.registrationFee ? paymentUrl : null,
  }, texts.emails)
  await queueEmail(payload, { kind: 'REGISTRATION_CONFIRMATION', registration: registrationId, reference: registrationCode, to: leaderEmail, ...email })

  return NextResponse.json({
    success: true,
    registrationCode,
    eventTitle: event.title,
    amountDue: event.registrationFee,
    paymentUrl,
  })
}
