import { NextResponse } from 'next/server'
import { headers } from 'next/headers'
import { createLocalReq, getPayload, logoutOperation } from 'payload'
import { generateExpiredPayloadCookie } from 'payload/shared'
import config from '@payload-config'
import { isRouteVisibleOnServer } from '@/lib/visibility-guard'
import { logger } from '@/lib/logger'

export async function POST(req: Request) {
  const payload = await getPayload({ config })

  // End this session on the server too (not just the cookie), so a copied cookie stops working at sign-out
  try {
    const { user } = await payload.auth({ headers: await headers() })
    if (user && user.collection === 'users') {
      const localReq = await createLocalReq({ user: user as any }, payload)
      await logoutOperation({ collection: payload.collections['users'], req: localReq })
    }
  } catch (err: any) {
    logger.warn(`Logout: server session not ended: ${err?.message || err}`)
  }

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
