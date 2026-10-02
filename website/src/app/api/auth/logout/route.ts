import { NextResponse } from 'next/server'
import { getPayload } from 'payload'
import { generateExpiredPayloadCookie } from 'payload/shared'
import config from '@payload-config'
import { isRouteVisibleOnServer } from '@/lib/visibility-guard'

export async function POST(req: Request) {
  const payload = await getPayload({ config })

  // The portal's sign-out button is a plain form post, so send the browser back to login
  const response = NextResponse.redirect(new URL((await isRouteVisibleOnServer('/login')) ? '/login' : '/', process.env.NEXT_PUBLIC_SITE_URL || req.url), 303)
  response.headers.append(
    'Set-Cookie',
    generateExpiredPayloadCookie({
      collectionAuthConfig: payload.collections['users'].config.auth,
      cookiePrefix: payload.config.cookiePrefix,
    })
  )
  return response
}
