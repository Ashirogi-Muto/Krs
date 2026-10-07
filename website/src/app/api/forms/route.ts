import { NextResponse } from 'next/server'
import { z } from 'zod'
import { getPayload } from 'payload'
import config from '@payload-config'
import { clientIp, rateLimit } from '@/lib/rateLimit'
import { TURNSTILE_FAILED, turnstileOk } from '@/lib/turnstile'
import { getPage } from '@/lib/pages'
import { getHiddenRoutes } from '@/lib/site-settings'
import { isVisibleIn } from '@/lib/visibility'
import { logger } from '@/lib/logger'

export const dynamic = 'force-dynamic'

const Body = z.object({
  path: z.string().max(200),
  block: z.string().max(100), // block id, or "i:<index>" for a built-in page not yet in the CMS
  values: z.record(z.string().max(5000)).refine((v) => Object.keys(v).length <= 40),
  website: z.string().max(200).optional(), // spam trap: hidden field real visitors leave empty
})

const LIMITS = { text: 300, email: 254, tel: 30, select: 300, textarea: 5000 } as const
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/
const TEL = /^[+0-9 ()-]{6,30}$/
const fail = (message: string, status = 400) => NextResponse.json({ ok: false, message }, { status })

/**
 * Submit a "Form" section of a website page. The answers are checked against that form's field list as
 * stored in the CMS (required, type, length, dropdown choices); anything else is rejected.
 */
export async function POST(req: Request) {
  const ip = clientIp(req)
  if (!rateLimit(`form:${ip}`, 5, 10 * 60 * 1000) || !rateLimit(`form-day:${ip}`, 30, 24 * 60 * 60 * 1000))
    return fail('Too many submissions. Please try again later.', 429)

  if (!(await turnstileOk(req, ip))) return fail(TURNSTILE_FAILED, 403)
  let body: z.infer<typeof Body>
  try {
    body = Body.parse(await req.json())
  } catch {
    return fail('Invalid form data.')
  }
  if (body.website) return NextResponse.json({ ok: true }) // bot filled the trap: pretend success, store nothing

  const [page, hidden] = await Promise.all([getPage(body.path), getHiddenRoutes()])
  if (!page || !isVisibleIn(hidden, body.path)) return fail('This form is not available.', 404)
  const idx = body.block.startsWith('i:') ? Number(body.block.slice(2)) : -1
  const block: any = page.layout.find((b: any, i: number) => b.blockType === 'form' && (b.id === body.block || i === idx))
  if (!block) return fail('This form is not available.', 404)

  const answers: { label: string; value: string }[] = []
  for (const [i, f] of (block.fields || []).entries()) {
    const type = (f.type || 'text') as keyof typeof LIMITS
    const value = String(body.values[String(i)] ?? '').trim()
    if (!value) {
      if (f.required) return fail(`Please fill in "${f.label}".`)
      continue
    }
    if (value.length > (LIMITS[type] ?? 300)) return fail(`"${f.label}" is too long.`)
    if (type === 'email' && !EMAIL.test(value)) return fail(`"${f.label}" is not a valid email address.`)
    if (type === 'tel' && !TEL.test(value)) return fail(`"${f.label}" is not a valid phone number.`)
    if (type === 'select' && !(f.options || []).some((o: any) => o.item === value)) return fail(`Choose an option for "${f.label}".`)
    answers.push({ label: String(f.label).slice(0, 200), value })
  }
  if (!answers.length) return fail('The form is empty.')

  try {
    const payload = await getPayload({ config })
    const created = await payload.create({
      collection: 'form-submissions',
      overrideAccess: true,
      data: {
        formName: String(block.formName || 'Website form').slice(0, 200),
        page: body.path,
        summary: answers.slice(0, 2).map((a) => a.value).join(' · ').slice(0, 200),
        answers,
      },
    })
    logger.audit('PUBLIC', 'FORM_SUBMITTED', 'FormSubmission', String(created.id), { form: block.formName, page: body.path })
  } catch (err: any) {
    logger.error(`Form submission failed (${body.path}): ${err?.message || err}`)
    return fail('Could not send the form right now. Please try again later.', 500)
  }
  return NextResponse.json({ ok: true })
}
