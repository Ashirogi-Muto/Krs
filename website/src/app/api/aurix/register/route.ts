import crypto from 'node:crypto'
import { NextResponse } from 'next/server'
import { z } from 'zod'
import { getPayload } from 'payload'
import config from '@payload-config'
import { getEventBySlug } from '@/lib/data/events'
import { buildRazorpayPaymentUrl } from '@/lib/payments/razorpayPage'
import { clientIp, rateLimit } from '@/lib/rateLimit'
import { logger } from '@/lib/logger'

export const dynamic = 'force-dynamic'

const MAX_FILE_BYTES = 2 * 1024 * 1024
const DEFAULT_MAX_TEAM = 5

const phoneSchema = z
  .string()
  .trim()
  .refine((v) => {
    const digits = v.replace(/\D/g, '')
    return digits.length >= 10 && digits.length <= 13
  }, 'Invalid phone number')

const MemberSchema = z.object({
  name: z.string().trim().min(2).max(120),
  email: z.string().trim().email().max(254).optional().or(z.literal('')),
  phone: phoneSchema.optional().or(z.literal('')),
  college: z.string().trim().min(2).max(200),
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
  return `AX26-${EVENT_CODES[slug] || 'EVT'}-${suffix}`
}

/** Detects the real file type from its first bytes; the browser-supplied type is not trusted. */
function sniffMime(buf: Buffer): string | null {
  if (buf.length >= 3 && buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) return 'image/jpeg'
  if (buf.length >= 8 && buf.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])))
    return 'image/png'
  if (buf.length >= 12 && buf.subarray(0, 4).toString('latin1') === 'RIFF' && buf.subarray(8, 12).toString('latin1') === 'WEBP')
    return 'image/webp'
  if (buf.length >= 5 && buf.subarray(0, 5).toString('latin1') === '%PDF-') return 'application/pdf'
  return null
}

const EXTENSIONS: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'application/pdf': 'pdf',
}

const fail = (message: string, status = 400) => NextResponse.json({ success: false, message }, { status })

export async function POST(req: Request) {
  const ip = clientIp(req)
  if (!rateLimit(`register:${ip}`, 8, 60 * 60 * 1000)) {
    return fail('Too many registration attempts from your network. Please try again later.', 429)
  }

  let form: FormData
  try {
    form = await req.formData()
  } catch {
    return fail('Invalid form submission.')
  }

  let parsed: z.infer<typeof RegistrationSchema>
  try {
    parsed = RegistrationSchema.parse(JSON.parse(String(form.get('payload') || '{}')))
  } catch {
    return fail('Please check all fields and try again.')
  }

  const leader = parsed.members[0]
  if (!leader.email || !leader.phone) {
    return fail('The team leader needs an email address and phone number.')
  }

  const event = await getEventBySlug(parsed.eventSlug)
  const eventId = Number(event?.id)
  if (!event || !Number.isFinite(eventId) || event.series !== 'AURIX' || event.comingSoon) {
    return fail('Registration is not open for this event.')
  }
  if (event.status !== 'REGISTRATION_OPEN') {
    return fail('Registration is not open for this event.')
  }
  if (event.registrationClose && Date.now() > new Date(event.registrationClose).getTime()) {
    return fail('Registration for this event has closed.')
  }

  const minTeam = event.minTeamSize ?? 1
  const maxTeam = event.maxTeamSize ?? DEFAULT_MAX_TEAM
  if (parsed.members.length < minTeam || parsed.members.length > maxTeam) {
    return fail(`${event.shortName} teams must have ${minTeam === maxTeam ? minTeam : `${minTeam}–${maxTeam}`} members.`)
  }

  // Every member must upload a student ID (field names id_0, id_1, ...)
  const files: { data: Buffer; mimetype: string; size: number }[] = []
  for (let i = 0; i < parsed.members.length; i++) {
    const file = form.get(`id_${i}`)
    if (!(file instanceof File) || file.size === 0) {
      return fail(`Please upload a student ID for ${parsed.members[i].name}.`)
    }
    if (file.size > MAX_FILE_BYTES) {
      return fail(`The ID file for ${parsed.members[i].name} is larger than 2 MB.`)
    }
    const data = Buffer.from(await file.arrayBuffer())
    const mimetype = sniffMime(data)
    if (!mimetype) {
      return fail(`The ID file for ${parsed.members[i].name} must be a JPG, PNG, WebP or PDF.`)
    }
    files.push({ data, mimetype, size: data.length })
  }

  const payload = await getPayload({ config })
  const leaderEmail = leader.email.toLowerCase()

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
    return fail(
      'A registration for this event already exists with this team leader email. Please contact the organizers if you need to change it.',
      409
    )
  }

  const registrationCode = newRegistrationCode(event.slug)
  const createdDocIds: (number | string)[] = []

  try {
    const memberRows = []
    for (let i = 0; i < parsed.members.length; i++) {
      const member = parsed.members[i]
      const doc = await payload.create({
        collection: 'id-documents',
        overrideAccess: true,
        data: { memberName: member.name, registrationCode },
        file: {
          data: files[i].data,
          mimetype: files[i].mimetype,
          name: `${registrationCode}-${i + 1}.${EXTENSIONS[files[i].mimetype]}`,
          size: files[i].size,
        },
      })
      createdDocIds.push(doc.id)
      memberRows.push({
        name: member.name,
        email: member.email ? member.email.toLowerCase() : undefined,
        phone: member.phone || undefined,
        college: member.college,
        idDocument: doc.id,
      })
    }

    await payload.create({
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
      },
    })
  } catch (err: any) {
    logger.error(`Registration failed for ${registrationCode}: ${err?.message || err}`)
    for (const id of createdDocIds) {
      await payload.delete({ collection: 'id-documents', id, overrideAccess: true }).catch(() => undefined)
    }
    // Payload rejects images it cannot read (corrupt files, unusual formats saved with a .jpg name)
    if (err?.name === 'FileUploadError' || /upload|invalid: file/i.test(String(err?.message))) {
      return fail(
        `We couldn't read one of the ID files (member ${createdDocIds.length + 1}). Please upload a clear JPG, PNG or PDF and try again.`
      )
    }
    return fail('Registration could not be saved. Please try again in a few minutes.', 500)
  }

  logger.audit(leaderEmail, 'AURIX_REGISTRATION_CREATED', 'EventRegistration', registrationCode, {
    event: event.slug,
    members: parsed.members.length,
  })

  return NextResponse.json({
    success: true,
    registrationCode,
    eventTitle: event.title,
    amountDue: event.registrationFee,
    paymentUrl: buildRazorpayPaymentUrl({
      name: leader.name,
      email: leaderEmail,
      phone: leader.phone,
      college: leader.college,
      eventLabel: event.paymentEventLabel,
      amountInRupees: event.registrationFee,
    }),
  })
}
