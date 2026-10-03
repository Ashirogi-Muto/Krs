/**
 * True when a state-changing request comes from this site (blocks cross-site posts with the session cookie).
 * Normalizes origins to handle trailing slashes, case differences, and apex/www variants.
 */
function toOrigin(val?: string | null): string | null {
  if (!val) return null
  try {
    return new URL(val.trim()).origin.toLowerCase()
  } catch {
    return null
  }
}

export function isSameOrigin(req: Request): boolean {
  const reqOrigin = toOrigin(req.headers.get('origin'))
  if (!reqOrigin) return false

  const allowed = new Set<string>()

  const selfOrigin = toOrigin(req.url)
  if (selfOrigin) allowed.add(selfOrigin)

  const siteOrigin = toOrigin(process.env.NEXT_PUBLIC_SITE_URL)
  if (siteOrigin) {
    allowed.add(siteOrigin)
    // Also include www/non-www variant of configured site URL
    try {
      const u = new URL(siteOrigin)
      if (u.hostname.startsWith('www.')) {
        allowed.add(`${u.protocol}//${u.hostname.slice(4)}${u.port ? ':' + u.port : ''}`)
      } else {
        allowed.add(`${u.protocol}//www.${u.hostname}${u.port ? ':' + u.port : ''}`)
      }
    } catch {
      // Ignore URL parse error
    }
  }

  // Development convenience: permit local origin if not production
  if (process.env.NODE_ENV !== 'production') {
    allowed.add('http://localhost:3000')
    allowed.add('http://localhost:3003')
    allowed.add('http://127.0.0.1:3000')
    allowed.add('http://127.0.0.1:3003')
  }

  return allowed.has(reqOrigin)
}

