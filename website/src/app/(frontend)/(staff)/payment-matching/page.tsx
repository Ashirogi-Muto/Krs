import { headers } from 'next/headers'
import { redirect } from 'next/navigation'
import { getPayload } from 'payload'
import config from '@payload-config'
import type { Metadata } from 'next'
import { PAYMENT_MATCHERS, hasRole } from '@/payload/access/roles'
import PaymentMatcher from './PaymentMatcher'

export const dynamic = 'force-dynamic'
export const metadata: Metadata = { title: 'Payment matching', robots: { index: false, follow: false } }

/** Upload the Razorpay payment report and record matched payments (Finance and registration managers). */
export default async function PaymentMatchingPage() {
  const payload = await getPayload({ config })
  const { user } = await payload.auth({ headers: await headers() })
  if (!user) redirect('/admin/login?redirect=%2Fpayment-matching')

  return (
    <main className="min-h-screen bg-aurix-dark text-slate-200 px-4 py-6">
      <div className="max-w-6xl mx-auto space-y-6">
        <header className="flex items-center justify-between gap-3">
          <div>
            <p className="text-xs font-mono uppercase tracking-wider text-aurix-orange">AURIX 2026 · Finance</p>
            <h1 className="text-2xl font-display font-bold text-white">Payment matching</h1>
          </div>
          <a href="/admin" className="text-xs font-mono text-slate-400 hover:text-white">
            CMS →
          </a>
        </header>
        {hasRole(user, PAYMENT_MATCHERS) ? (
          <PaymentMatcher />
        ) : (
          <p className="text-sm text-slate-400">Only the Finance team and registration managers can match payments.</p>
        )}
      </div>
    </main>
  )
}
