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

export function clientIp(req: Request): string {
  return (
    req.headers.get('x-real-ip') ||
    req.headers.get('cf-connecting-ip') ||
    req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    'unknown'
  )
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

