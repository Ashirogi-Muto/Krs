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

const defaultGet = REST_GET(config)
const defaultPost = REST_POST(config)
const defaultDelete = REST_DELETE(config)
const defaultPatch = REST_PATCH(config)
const defaultPut = REST_PUT(config)

function checkRateLimit(req: Request): Response | null {
  const ip = clientIp(req)
  // 600 requests per 15 minutes per IP for Payload CMS REST API
  if (!rateLimit(`payload-rest:${ip}`, 600, 15 * 60 * 1000)) {
    return new Response(
      JSON.stringify({ errors: [{ message: 'Too many requests. Please try again later.' }] }),
      {
        status: 429,
        headers: {
          'Content-Type': 'application/json',
          'Retry-After': '900',
        },
      }
    )
  }
  return null
}

export const GET = async (req: Request, context: any) => {
  const limited = checkRateLimit(req)
  if (limited) return limited
  return defaultGet(req, context)
}

export const POST = async (req: Request, context: any) => {
  const limited = checkRateLimit(req)
  if (limited) return limited
  return defaultPost(req, context)
}

export const DELETE = async (req: Request, context: any) => {
  const limited = checkRateLimit(req)
  if (limited) return limited
  return defaultDelete(req, context)
}

export const PATCH = async (req: Request, context: any) => {
  const limited = checkRateLimit(req)
  if (limited) return limited
  return defaultPatch(req, context)
}

export const PUT = async (req: Request, context: any) => {
  const limited = checkRateLimit(req)
  if (limited) return limited
  return defaultPut(req, context)
}

export const OPTIONS = REST_OPTIONS(config)

