import React from 'react'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { getPayload } from 'payload'
import config from '@payload-config'
import type { Metadata } from 'next'
import { CreditCard } from 'lucide-react'
import { getSessionUser } from '@/lib/auth/session'
import { getFormTexts } from '@/lib/form-texts'
import { fill } from '@/lib/form-texts-defaults'
import { checkoutRegistration, checkoutView } from '@/lib/coupons'
import { PayWithReceiptNotice } from '@/components/aurix/PayWithReceiptNotice'
import { CouponBox } from '@/components/aurix/CouponBox'

// Personal page (a logged-in team leader's registration): never cached or indexed
export const dynamic = 'force-dynamic'

export async function generateMetadata(): Promise<Metadata> {
  return { title: (await getFormTexts()).checkout.tabTitle, robots: { index: false, follow: false, nocache: true } }
}

const inr = (n: number | null) => (n === null ? '—' : `₹${n.toLocaleString('en-IN')}`)

/**
 * Checkout step before the payment page (owner, 13 Oct 2026): fee, coupon (apply / remove), the amount to pay, then the
 * payment page pre-filled with the amount the server worked out. Every on-site pay button leads here.
 * Wording: Labels & messages → Payment & coupons.
 */
export default async function PayPage({ params }: { params: Promise<{ code: string }> }) {
  const { code } = await params
  const self = `/aurix/pay/${encodeURIComponent(code)}`
  const user = await getSessionUser()
  if (!user) redirect(`/login?next=${encodeURIComponent(self)}`)
  const F = await getFormTexts()
  const T = F.checkout
  const reg = user.emailVerified ? await checkoutRegistration(await getPayload({ config }), { id: Number(user.id), email: user.email }, code) : null
  const v = reg ? checkoutView(reg) : null
  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-16 space-y-8">
      <div className="space-y-3">
        <span className="text-xs font-mono uppercase tracking-wider text-aurix-orange">{T.eyebrow}</span>
        <h1 className="text-3xl sm:text-4xl font-display font-extrabold text-white tracking-tight">{T.title}</h1>
        <p className="text-slate-400 text-sm leading-relaxed">{T.intro}</p>
      </div>
      {!user.emailVerified ? (
        <div className="aurix-card rounded-2xl p-6">
          <p className="text-slate-300 text-sm">{F.receipt.unconfirmed}</p>
        </div>
      ) : !v ? (
        <div className="aurix-card rounded-2xl p-6 space-y-4">
          <p className="text-slate-300 text-sm">{T.notFound}</p>
          <Link href="/aurix/portal" className="text-sm text-aurix-orange hover:underline">
            {T.backLink}
          </Link>
        </div>
      ) : (
        <section className="aurix-card rounded-2xl p-6 sm:p-8 space-y-6">
          <p className="text-sm font-mono text-slate-300">{fill(T.teamLine, { team: v.team, code: v.code, event: v.eventTitle })}</p>
          <dl className="space-y-2 text-sm" data-testid="checkout-amounts">
            <div className="flex justify-between gap-4">
              <dt className="text-slate-400">{T.rowFee}</dt>
              <dd className="text-white font-mono">{inr(v.fee)}</dd>
            </div>
            {v.couponCode && (
              <div className="flex justify-between gap-4">
                <dt className="text-emerald-300">{fill(T.rowDiscount, { code: v.couponCode })}</dt>
                <dd className="text-emerald-300 font-mono">− {inr(v.discount)}</dd>
              </div>
            )}
            <div className="flex justify-between gap-4 border-t border-aurix-border pt-3 text-base">
              <dt className="text-white font-semibold">{T.rowTotal}</dt>
              <dd className="text-aurix-orange font-mono font-bold" data-testid="checkout-total">
                {inr(v.paid ? 0 : v.due)}
              </dd>
            </div>
          </dl>
          {v.paid ? (
            <p className="text-sm text-emerald-300">{T.paidNote}</p>
          ) : !v.canPay || !v.paymentUrl ? (
            <p className="text-sm text-slate-400">{T.noPayNote}</p>
          ) : (
            <>
              <CouponBox
                code={v.code}
                current={v.couponCode}
                t={{ label: T.couponLabel, placeholder: T.couponPlaceholder, apply: T.apply, applying: T.applying, remove: T.remove, replaceNote: T.replaceNote, failed: T.errFailed }}
              />
              <div className="space-y-3">
                <PayWithReceiptNotice
                  href={v.paymentUrl}
                  t={F.receipt}
                  className="inline-flex items-center justify-center gap-2 w-full sm:w-auto px-8 py-3.5 rounded-lg bg-aurix-orange text-black font-semibold text-xs font-mono uppercase tracking-wider hover:bg-orange-400 transition-colors"
                >
                  <CreditCard className="w-4 h-4" /> {fill(T.proceed, { amount: Number(v.due).toLocaleString('en-IN') })}
                </PayWithReceiptNotice>
                <p className="text-xs text-yellow-200/90">{T.exactNote}</p>
              </div>
            </>
          )}
          <Link href="/aurix/portal" className="inline-block text-xs text-slate-400 hover:text-white">
            {T.backLink}
          </Link>
        </section>
      )}
    </div>
  )
}
