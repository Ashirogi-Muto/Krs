/* Payload's REST handlers, wrapped with rate limits (see checkRateLimit). */
import config from '@payload-config'
import {
  REST_DELETE,
  REST_GET,
  REST_OPTIONS,
  REST_PATCH,
  REST_POST,
  REST_PUT,
} from '@payloadcms/next/routes'
import { clientIp, rateLimit } from '@/lib/rateLimit'
import { getFormTexts } from '@/lib/form-texts'

const defaultGet = REST_GET(config)
const defaultPost = REST_POST(config)
const defaultDelete = REST_DELETE(config)
const defaultPatch = REST_PATCH(config)
const defaultPut = REST_PUT(config)

const MIN = 60 * 1000

// Wording: CMS → Labels & messages → Messages ("Common: too many requests", "Log in: too many from one network")
const tooMany = async (retryAfterSeconds: number, login = false) => {
  const M = (await getFormTexts()).messages
  const message = login ? M.loginTooManyIp : M.tooManyRequests
  return new Response(JSON.stringify({ errors: [{ message }] }), {
    status: 429,
    headers: { 'Content-Type': 'application/json', 'Retry-After': String(retryAfterSeconds) },
  })
}

/**
 * Per-IP limits for the Payload REST API.
 * - CMS login / password reset: strict (brute force), on top of Payload's own lock after 5 wrong passwords.
 * - Requests carrying a session cookie (the admin panel makes many calls per screen, and organisers often share
 *   one campus IP): high limit, so staff are never locked out mid-edit. Access control still applies per user.
 * - Everything else (anonymous): 600 per 15 minutes.
 */
function checkRateLimit(req: Request): Promise<Response> | null {
  const ip = clientIp(req)
  const path = new URL(req.url).pathname
  if (req.method === 'POST' && /^\/api\/users\/login\/?$/.test(path)) {
    if (!rateLimit(`payload-login:${ip}`, 10, MIN) || !rateLimit(`payload-login-hour:${ip}`, 60, 60 * MIN))
      return tooMany(60, true)
  }
  if (req.method === 'POST' && /^\/api\/users\/(forgot-password|reset-password)\/?$/.test(path)) {
    if (!rateLimit(`payload-reset:${ip}`, 5, 60 * MIN)) return tooMany(3600)
  }
  const hasSession = /(?:^|;\s*)payload-token=/.test(req.headers.get('cookie') || '')
  if (hasSession) {
    if (!rateLimit(`payload-rest-session:${ip}`, 6000, 15 * MIN)) return tooMany(900)
    return null
  }
  if (!rateLimit(`payload-rest:${ip}`, 600, 15 * MIN)) return tooMany(900)
  return null
}

export const GET = async (req: Request, context: any) => (await checkRateLimit(req)) ?? defaultGet(req, context)
export const POST = async (req: Request, context: any) => (await checkRateLimit(req)) ?? defaultPost(req, context)
export const DELETE = async (req: Request, context: any) => (await checkRateLimit(req)) ?? defaultDelete(req, context)
export const PATCH = async (req: Request, context: any) => (await checkRateLimit(req)) ?? defaultPatch(req, context)
export const PUT = async (req: Request, context: any) => (await checkRateLimit(req)) ?? defaultPut(req, context)

export const OPTIONS = REST_OPTIONS(config)
