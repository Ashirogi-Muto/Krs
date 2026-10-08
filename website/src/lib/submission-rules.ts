import crypto from 'node:crypto'

/**
 * Round submissions (owner, 8 Oct 2026): pure rules, unit-tested (tests/submissions.test.ts).
 * Files go straight from the browser to Cloudflare R2 through a short-lived signed link; the server signs the exact
 * byte size (hard 15 MB limit) and content type, then checks the stored object's real type before accepting it.
 */

export const MAX_SUBMISSION_BYTES = 15 * 1024 * 1024

/** Presentations only. The server picks the content type from the extension; the browser's claim is ignored. */
export const SUBMISSION_TYPES: Record<string, string> = {
  pdf: 'application/pdf',
  ppt: 'application/vnd.ms-powerpoint',
  pptx: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
}

export const extOf = (filename: string) => (filename.toLowerCase().match(/\.([a-z0-9]{1,5})$/)?.[1] || '')

/** A safe file name to show staff (and to download as): letters, digits, . _ - and spaces only. */
export function cleanFilename(name: string): string {
  const base = name.split(/[\\/]/).pop() || 'file'
  const cleaned = base.normalize('NFKD').replace(/\p{M}/gu, '').replace(/[^A-Za-z0-9._ -]/g, '_').replace(/\s+/g, ' ').trim()
  return cleaned.slice(-120) || 'file'
}

export type UploadCheck = { ok: true; ext: string; contentType: string } | { ok: false; reason: 'type' | 'size' | 'empty' }

export function checkUpload(filename: string, size: unknown): UploadCheck {
  const ext = extOf(filename)
  if (!SUBMISSION_TYPES[ext]) return { ok: false, reason: 'type' }
  if (size === 0) return { ok: false, reason: 'empty' }
  if (!Number.isInteger(size) || (size as number) <= 0 || (size as number) > MAX_SUBMISSION_BYTES) return { ok: false, reason: 'size' }
  return { ok: true, ext, contentType: SUBMISSION_TYPES[ext] }
}

/**
 * Real type from the stored bytes. `head` = first bytes, `tail` = last ≤ 64 KB (a .pptx is a ZIP whose central
 * directory, at the end, lists ppt/presentation.xml; any other ZIP or a renamed file is refused).
 */
export function realSubmissionType(ext: string, head: Buffer, tail: Buffer): boolean {
  if (ext === 'pdf') return head.subarray(0, 5).toString('latin1') === '%PDF-'
  if (ext === 'ppt') return head.subarray(0, 8).equals(Buffer.from([0xd0, 0xcf, 0x11, 0xe0, 0xa1, 0xb1, 0x1a, 0xe1]))
  if (ext === 'pptx')
    return head.subarray(0, 4).equals(Buffer.from([0x50, 0x4b, 0x03, 0x04])) && tail.includes(Buffer.from('ppt/presentation.xml'))
  return false
}

export type Round = { number: number; name?: string; startDate?: string | null; endDate?: string | null; submissionType?: string | null }

/** Rounds that take an online submission. */
export const SUBMITTABLE = ['PROPOSAL', 'CODE_AND_DEMO']

/** Open = submittable type, start passed (or not set) and end not passed; the end must be set. */
export function roundOpen(round: Round, now = new Date()): boolean {
  if (!SUBMITTABLE.includes(String(round.submissionType)) || !round.endDate) return false
  if (round.startDate && new Date(round.startDate).getTime() > now.getTime()) return false
  return new Date(round.endDate).getTime() >= now.getTime()
}

/** A file that started uploading before the deadline may finish within this grace (slow connections). */
export const FINISH_GRACE_MS = 15 * 60_000

export type Eligibility = { ok: true } | { ok: false; reason: 'inactive' | 'notQualified' }

/** Active team; from round 2 on, only teams whose previous-round submission was marked "Qualified". */
export function eligible(reg: { status?: string }, roundNumber: number, previous?: { status?: string } | null): Eligibility {
  if (!['PENDING', 'CONFIRMED'].includes(String(reg.status))) return { ok: false, reason: 'inactive' }
  if (roundNumber > 1 && previous?.status !== 'QUALIFIED') return { ok: false, reason: 'notQualified' }
  return { ok: true }
}

/** Links typed by teams: https only (shown to judges as links). */
export const isHttpsUrl = (v: unknown): v is string => {
  if (typeof v !== 'string' || v.length > 300) return false
  try {
    const u = new URL(v)
    return u.protocol === 'https:' && Boolean(u.hostname)
  } catch {
    return false
  }
}

// ---------------------------------------------------------------------------------------------------------------
// Upload token: issued with the signed link, required to save the submission. HMAC with the server secret, so the
// browser cannot change which registration/round/object/size it refers to.

export type UploadToken = { r: number; n: number; k: string; s: number; e: string; f: string; iat: number; exp: number }

const b64 = (b: Buffer) => b.toString('base64url')

export function signUploadToken(t: UploadToken, secret: string): string {
  const body = b64(Buffer.from(JSON.stringify(t)))
  const mac = b64(crypto.createHmac('sha256', `krs-submission:${secret}`).update(body).digest())
  return `${body}.${mac}`
}

export function verifyUploadToken(token: unknown, secret: string, now = Date.now()): UploadToken | null {
  if (typeof token !== 'string' || token.length > 2000 || !secret) return null
  const [body, mac] = token.split('.')
  if (!body || !mac) return null
  const want = crypto.createHmac('sha256', `krs-submission:${secret}`).update(body).digest()
  const got = Buffer.from(mac, 'base64url')
  if (got.length !== want.length || !crypto.timingSafeEqual(got, want)) return null
  try {
    const t = JSON.parse(Buffer.from(body, 'base64url').toString('utf8')) as UploadToken
    return t.exp >= now ? t : null
  } catch {
    return null
  }
}
