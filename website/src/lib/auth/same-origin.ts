/** True when a state-changing request comes from this site (blocks cross-site posts with the session cookie). */
export function isSameOrigin(req: Request): boolean {
  const origin = req.headers.get('origin')
  const allowed = [process.env.NEXT_PUBLIC_SITE_URL, new URL(req.url).origin].filter(Boolean)
  return Boolean(origin && allowed.includes(origin))
}
