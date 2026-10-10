import React from 'react'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { getPayload } from 'payload'
import config from '@payload-config'
import type { Metadata } from 'next'
import { getSessionUser } from '@/lib/auth/session'
import { getFormTexts } from '@/lib/form-texts'
import { fill } from '@/lib/form-texts-defaults'
import { receiptRegistrations } from '@/lib/receipts'
import { cleanPaymentId } from '@/lib/receipt-rules'
import { ReceiptUploadForm } from '@/components/aurix/ReceiptUploadForm'

// Personal page (a logged-in team leader's registrations): never cached or indexed
export const dynamic = 'force-dynamic'

export async function generateMetadata(): Promise<Metadata> {
  return { title: (await getFormTexts()).receipt.tabTitle, robots: { index: false, follow: false, nocache: true } }
}

const ist = (d: string) => new Date(d).toLocaleString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: 'numeric', minute: '2-digit', timeZone: 'Asia/Kolkata' })

/**
 * After paying (owner, 10 Oct 2026): the Razorpay payment page sends the payer here; the team leader uploads the
 * receipt (PDF) or a screenshot for each active team. Required, but only marked when missing. Works whether or not
 * the participant portal is shown. Wording: Labels & messages → Payment receipt.
 */
export default async function PaymentDonePage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const sp = await searchParams
  // Razorpay may add the payment ID to the return link; kept only if it looks like one (the team can still edit it)
  const fromRazorpay = cleanPaymentId(Array.isArray(sp.razorpay_payment_id) ? sp.razorpay_payment_id[0] : sp.razorpay_payment_id) || ''
  const user = await getSessionUser()
  if (!user) redirect(`/login?next=${encodeURIComponent(`/aurix/payment-done${fromRazorpay ? `?razorpay_payment_id=${fromRazorpay}` : ''}`)}`)
  const T = (await getFormTexts()).receipt
  const regs = user.emailVerified ? await receiptRegistrations(await getPayload({ config }), { id: Number(user.id), email: user.email }) : []
  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-16 space-y-8">
      <div className="space-y-3">
        <span className="text-xs font-mono uppercase tracking-wider text-aurix-orange">{T.eyebrow}</span>
        <h1 className="text-3xl sm:text-4xl font-display font-extrabold text-white tracking-tight">{T.title}</h1>
        <p className="text-slate-400 text-sm leading-relaxed">{T.intro}</p>
      </div>
      {!user.emailVerified ? (
        <div className="aurix-card rounded-2xl p-6">
          <p className="text-slate-300 text-sm">{T.unconfirmed}</p>
        </div>
      ) : regs.length === 0 ? (
        <div className="aurix-card rounded-2xl p-6 space-y-4">
          <p className="text-slate-300 text-sm">{T.none}</p>
          <Link href="/aurix/status" className="text-sm text-aurix-orange hover:underline">
            {T.statusLink}
          </Link>
        </div>
      ) : (
        regs.map((r: any) => {
          const verified = r.paymentStatus === 'PAID_VERIFIED'
          const event = r.event && typeof r.event === 'object' ? r.event : null
          return (
            <section key={r.id} className="aurix-card rounded-2xl p-6 space-y-4">
              <div className="space-y-1">
                <div className="text-xs font-mono uppercase text-aurix-orange">{r.registrationCode}</div>
                <h2 className="text-xl font-display font-bold text-white">{r.teamName}</h2>
                <p className="text-sm text-slate-400">
                  {event?.title || ''}
                  {r.amountDue ? ` · ${fill(T.amount, { amount: `₹${r.amountDue}` })}` : ''}
                </p>
              </div>
              <p className={`text-sm ${r.receiptUploadedAt ? 'text-green-300' : verified ? 'text-slate-300' : 'text-yellow-300'}`}>
                {r.receiptUploadedAt ? fill(T.uploaded, { date: ist(r.receiptUploadedAt), file: r.receiptFilename || '' }) : verified ? T.verified : T.missing}
              </p>
              {r.receiptUploadedAt && <p className="text-xs text-slate-500">{T.replaceNote}</p>}
              <ReceiptUploadForm code={r.registrationCode} paymentId={r.receiptPaymentId || fromRazorpay} t={T} />
            </section>
          )
        })
      )}
    </div>
  )
}
