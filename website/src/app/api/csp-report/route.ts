import { clientIp, rateLimit } from '@/lib/rateLimit'
import { logger } from '@/lib/logger'

export const dynamic = 'force-dynamic'

/**
 * Receives Content-Security-Policy violation reports from browsers (the report-only policy in next.config.mjs),
 * so the policy can be tightened with evidence. Logs a short summary only; never stores the raw report.
 */
export async function POST(req: Request) {
  if (!rateLimit(`csp:${clientIp(req)}`, 30, 60_000)) return new Response(null, { status: 204 })
  try {
    const text = (await req.text()).slice(0, 8000)
    const body = JSON.parse(text)
    const reports = Array.isArray(body) ? body.map((r: any) => r?.body || r) : [body?.['csp-report'] || body?.body || body]
    for (const r of reports.slice(0, 5)) {
      const directive = String(r?.['effective-directive'] || r?.effectiveDirective || r?.['violated-directive'] || '').slice(0, 60)
      const blocked = String(r?.['blocked-uri'] || r?.blockedURL || '').slice(0, 200)
      const page = String(r?.['document-uri'] || r?.documentURL || '').replace(/\?.*$/, '').slice(0, 200)
      logger.warn(`CSP report: ${directive} blocked ${blocked} on ${page}`)
    }
  } catch {
    // ignore malformed reports
  }
  return new Response(null, { status: 204 })
}
