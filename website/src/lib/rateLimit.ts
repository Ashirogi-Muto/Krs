/**
 * Small in-memory fixed-window rate limiter (single app container, so memory is enough).
 * Keys are usually the visitor IP from nginx's X-Real-IP (already the real client IP behind Cloudflare).
 */
const buckets = new Map<string, { count: number; resetAt: number }>()

export function rateLimit(key: string, limit: number, windowMs: number): boolean {
  const now = Date.now()
  if (buckets.size > 10_000) {
    for (const [k, b] of buckets) if (b.resetAt <= now) buckets.delete(k)
  }
  const bucket = buckets.get(key)
  if (!bucket || bucket.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs })
    return true
  }
  bucket.count += 1
  return bucket.count <= limit
}

/**
 * Rate-limit key for an IP: IPv4 as it is, IPv6 by its /64 network. One home or mobile connection gets a whole
 * /64, so keying on the full IPv6 address would let a visitor rotate addresses and skip every per-IP limit.
 */
export function ipKey(ip: string): string {
  const raw = (ip || '').trim().toLowerCase().replace(/^\[|\]$/g, '').split('%')[0]
  if (!raw.includes(':')) return raw || 'unknown'
  const mapped = raw.match(/^::ffff:(\d+\.\d+\.\d+\.\d+)$/)
  if (mapped) return mapped[1]
  const [head, tail = ''] = raw.split('::')
  const h = head ? head.split(':') : []
  const t = tail ? tail.split(':') : []
  if (!raw.includes('::') && h.length !== 8) return raw
  const groups = raw.includes('::') ? [...h, ...Array(Math.max(0, 8 - h.length - t.length)).fill('0'), ...t] : h
  if (groups.length !== 8 || groups.some((g) => !/^[0-9a-f]{1,4}$/.test(g))) return raw
  return `${groups.slice(0, 4).map((g) => g.replace(/^0+(?=.)/, '')).join(':')}::/64`
}

export function clientIp(req: Request | { headers: Headers }): string {
  const ip =
    req.headers.get('x-real-ip') ||
    req.headers.get('cf-connecting-ip') ||
    req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    'unknown'
  return ipKey(ip)
}

/**
 * Rate limit by authenticated user account ID.
 */
export function rateLimitUser(
  userId: string | number | undefined | null,
  action: string,
  limit: number,
  windowMs: number
): boolean {
  if (!userId) return true
  return rateLimit(`user:${userId}:${action}`, limit, windowMs)
}

/** Login attempts per network (shared by /api/auth/login and Payload's own /api/users/login). */
export const loginAllowed = (ip: string) =>
  rateLimit(`login-ip:${ip}`, 10, 60 * 1000) && rateLimit(`login-ip-hour:${ip}`, 60, 60 * 60 * 1000)
