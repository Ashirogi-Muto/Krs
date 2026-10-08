import { headers } from 'next/headers'
import { getPayload } from 'payload'
import config from '@payload-config'
import { NextResponse } from 'next/server'
import { isSameOrigin } from '@/lib/auth/same-origin'
import { rateLimit, clientIp } from '@/lib/rateLimit'
import { getFormTexts } from '@/lib/form-texts'
import { fill } from '@/lib/form-texts-defaults'
import { EXTENSIONS, MAX_FILE_BYTES, sniffMime } from '@/lib/id-files'
import { replaceIds, reuploadableFor } from '@/lib/id-reupload'
import { logger } from '@/lib/logger'

export const dynamic = 'force-dynamic'

const fail = (message: string, status = 400) => NextResponse.json({ success: false, message }, { status, headers: { 'Cache-Control': 'no-store' } })

/**
 * New student ID cards for a team whose ID check was rejected (/aurix/update-id). Only the logged-in, confirmed team
 * leader (linked account or leader email), only while the team is "Rejected", active and before the deadline.
 * multipart: code, id_<member index> (at least one; each JPG/PNG/WebP/PDF ≤ 2 MB, real type checked).
 */
export async function POST(req: Request) {
  const texts = await getFormTexts()
  const T = texts.idUpdate
  const M = texts.messages
  if (!isSameOrigin(req)) return fail(M.invalidRequest, 403)
  const payload = await getPayload({ config })
  const { user } = await payload.auth({ headers: await headers() })
  if (!user) return fail(T.errLogin, 401)
  if (!(user as any).emailVerified) return fail(M.regConfirm, 403)
  if (!rateLimit(`id-reupload:${user.id}`, 10, 3_600_000) || !rateLimit(`id-reupload-ip:${clientIp(req)}`, 30, 3_600_000)) return fail(T.errTooMany, 429)

  let form: FormData
  try {
    form = await req.formData()
  } catch {
    return fail(M.invalidRequest)
  }
  const code = String(form.get('code') || '').trim().toUpperCase()
  const reg = (await reuploadableFor(payload, user as any)).find((r) => r.registrationCode === code)
  if (!reg) return fail(T.errClosed, 403)

  const members = (reg.members || []) as { name: string }[]
  const files = new Map<number, { data: Buffer; mimetype: string; size: number; ext: string }>()
  for (let i = 0; i < members.length; i++) {
    const f = form.get(`id_${i}`)
    if (!(f instanceof File) || f.size === 0) continue
    if (f.size > MAX_FILE_BYTES) return fail(fill(T.errFile, { name: members[i].name }))
    const data = Buffer.from(await f.arrayBuffer())
    const mimetype = sniffMime(data)
    if (!mimetype) return fail(fill(T.errFile, { name: members[i].name }))
    files.set(i, { data, mimetype, size: data.length, ext: EXTENSIONS[mimetype] })
  }
  if (!files.size) return fail(T.errNone)

  try {
    await replaceIds(payload, reg, files, String((user as any).email || user.id))
  } catch (err: any) {
    if (err?.message === 'closed') return fail(T.errClosed, 403)
    logger.error(`ID re-upload failed for ${reg.registrationCode}: ${err?.message || err}`)
    return fail(T.errFailed, 500)
  }
  return NextResponse.json({ success: true, message: T.done }, { headers: { 'Cache-Control': 'no-store' } })
}
