import { turnstileSiteKey } from '@/lib/turnstile'

export const dynamic = 'force-dynamic'

/** Public: the Turnstile site key, or null while the check is off (see lib/turnstile.ts). */
export function GET() {
  return Response.json({ siteKey: turnstileSiteKey() || null }, { headers: { 'Cache-Control': 'no-store' } })
}
