import { headers } from 'next/headers'
import { redirect } from 'next/navigation'
import { getPayload } from 'payload'
import config from '@payload-config'
import type { Metadata } from 'next'
import { PAYMENT_MATCHERS, hasRole } from '@/payload/access/roles'
import PaymentMatcher from './PaymentMatcher'
import { getStaffTexts } from '@/lib/staff-texts'

export const dynamic = 'force-dynamic'
export async function generateMetadata(): Promise<Metadata> {
  return { title: (await getStaffTexts()).payments.tabTitle, robots: { index: false, follow: false } }
}

/** Upload the Razorpay payment report and record matched payments (Finance and registration managers). */
export default async function PaymentMatchingPage() {
  const payload = await getPayload({ config })
  const { user } = await payload.auth({ headers: await headers() })
  if (!user) redirect('/admin/login?redirect=%2Fpayment-matching')
  const staff = await getStaffTexts(payload)
  const t = staff.payments // wording: CMS → Admin tools → Staff & admin texts

  return (
    <main className="min-h-screen bg-aurix-dark text-slate-200 px-4 py-6">
      <div className="max-w-6xl mx-auto space-y-6">
        <header className="flex items-center justify-between gap-3">
          <div>
            <p className="text-xs font-mono uppercase tracking-wider text-aurix-orange">{t.eyebrow}</p>
            <h1 className="text-2xl font-display font-bold text-white">{t.title}</h1>
          </div>
          <a href="/admin" className="text-xs font-mono text-slate-400 hover:text-white">
            {staff.checkin.cmsLink}
          </a>
        </header>
        {hasRole(user, PAYMENT_MATCHERS) ? (
          <PaymentMatcher t={t} />
        ) : (
          <p className="text-sm text-slate-400">{t.noAccess}</p>
        )}
      </div>
    </main>
  )
}
