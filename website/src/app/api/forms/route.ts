import { NextResponse } from 'next/server'
import { z } from 'zod'
import { getPayload } from 'payload'
import config from '@payload-config'
import { clientIp, rateLimit } from '@/lib/rateLimit'
import { turnstileOk } from '@/lib/turnstile'
import { getPage } from '@/lib/pages'
import { getHiddenRoutes } from '@/lib/site-settings'
import { isVisibleIn } from '@/lib/visibility'
import { logger } from '@/lib/logger'
import { getFormTexts } from '@/lib/form-texts'
import { fill } from '@/lib/form-texts-defaults'

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
  const M = (await getFormTexts()).messages // wording: CMS → Labels & messages → Messages
  const ip = clientIp(req)
  if (!rateLimit(`form:${ip}`, 5, 10 * 60 * 1000) || !rateLimit(`form-day:${ip}`, 30, 24 * 60 * 60 * 1000))
    return fail(M.formTooMany, 429)

  if (!(await turnstileOk(req, ip))) return fail(M.botCheck, 403)
  let body: z.infer<typeof Body>
  try {
    body = Body.parse(await req.json())
  } catch {
    return fail(M.formInvalid)
  }
  if (body.website) return NextResponse.json({ ok: true }) // bot filled the trap: pretend success, store nothing

  const [page, hidden] = await Promise.all([getPage(body.path), getHiddenRoutes()])
  if (!page || !isVisibleIn(hidden, body.path)) return fail(M.formUnavailable, 404)
  const idx = body.block.startsWith('i:') ? Number(body.block.slice(2)) : -1
  const block: any = page.layout.find((b: any, i: number) => b.blockType === 'form' && (b.id === body.block || i === idx))
  if (!block) return fail(M.formUnavailable, 404)

  const answers: { label: string; value: string }[] = []
  for (const [i, f] of (block.fields || []).entries()) {
    const type = (f.type || 'text') as keyof typeof LIMITS
    const value = String(body.values[String(i)] ?? '').trim()
    if (!value) {
      if (f.required) return fail(fill(M.formRequired, { label: f.label }))
      continue
    }
    if (value.length > (LIMITS[type] ?? 300)) return fail(fill(M.formTooLong, { label: f.label }))
    if (type === 'email' && !EMAIL.test(value)) return fail(fill(M.formEmail, { label: f.label }))
    if (type === 'tel' && !TEL.test(value)) return fail(fill(M.formPhone, { label: f.label }))
    if (type === 'select' && !(f.options || []).some((o: any) => o.item === value)) return fail(fill(M.formChoose, { label: f.label }))
    answers.push({ label: String(f.label).slice(0, 200), value })
  }
  if (!answers.length) return fail(M.formEmpty)

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
    return fail(M.formFailed, 500)
  }
  return NextResponse.json({ ok: true })
}
