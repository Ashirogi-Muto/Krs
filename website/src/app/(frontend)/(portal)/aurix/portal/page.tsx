import React from 'react'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { getPayload } from 'payload'
import config from '@payload-config'
import { getSessionUser } from '@/lib/auth/session'
import { requireVisibleRoute } from '@/lib/visibility-guard'
import { formatDateRange, formatFee } from '@/lib/format'
import { buildRazorpayPaymentUrl } from '@/lib/payments/razorpayPage'
import { getPortalTexts, type PortalTexts } from '@/lib/portal-texts'
import { fill } from '@/lib/form-texts-defaults'
import {
  Calendar,
  Users,
  CheckCircle2,
  Clock,
  ArrowRight,
  AlertCircle,
  XCircle,
  ExternalLink,
  CreditCard,
  KeyRound,
  ShieldCheck,
} from 'lucide-react'

export const dynamic = 'force-dynamic'

export const metadata = {
  title: 'Dashboard | AURIX Participant Portal',
  robots: {
    index: false,
    follow: false,
    nocache: true,
  },
}

type Tone = 'good' | 'wait' | 'bad'

type DashboardTexts = PortalTexts['dashboard']
// Status wording comes from CMS → Website → Participant portal → Dashboard; the tone (icon colour) stays in code
const statusText = (t: DashboardTexts): Record<string, [string, Tone]> => ({
  PENDING: [t.statusPending, 'wait'],
  CONFIRMED: [t.statusConfirmed, 'good'],
  REJECTED: [t.statusRejected, 'bad'],
  CANCELLED: [t.statusCancelled, 'bad'],
})
const paymentText = (t: DashboardTexts): Record<string, [string, Tone]> => ({
  AWAITING_PAYMENT: [t.payAwaiting, 'wait'],
  PAID_VERIFIED: [t.payVerified, 'good'],
  NOT_FOUND: [t.payNotFound, 'bad'],
  REFUNDED: [t.payRefunded, 'bad'],
})
const idText = (t: DashboardTexts): Record<string, [string, Tone]> => ({
  PENDING: [t.idPending, 'wait'],
  APPROVED: [t.idApproved, 'good'],
  REJECTED: [t.idRejected, 'bad'],
})

const toneBadge = (label: string, [text, tone]: [string, Tone]) => {
  const icon =
    tone === 'good' ? (
      <CheckCircle2 className="w-3.5 h-3.5 text-green-400 shrink-0" />
    ) : tone === 'bad' ? (
      <XCircle className="w-3.5 h-3.5 text-red-400 shrink-0" />
    ) : (
      <Clock className="w-3.5 h-3.5 text-yellow-400 shrink-0" />
    )

  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 py-2 border-b border-aurix-border/50 last:border-0 text-xs font-mono">
      <span className="text-slate-400 uppercase text-[11px]">{label}</span>
      <span className="flex items-center gap-1.5 text-slate-200 text-left sm:text-right">
        {icon}
        <span>{text}</span>
      </span>
    </div>
  )
}

export default async function PortalDashboardPage() {
  await requireVisibleRoute('/aurix/portal')
  const user = await getSessionUser()
  if (!user) {
    redirect('/login')
  }

  const payload = await getPayload({ config })
  const result = await payload.find({
    collection: 'event-registrations',
    where: {
      participants: {
        contains: user.id,
      },
    },
    depth: 2,
    overrideAccess: true, // safe because query explicitly filters by participants containing user.id
  })

  const registrations = (result.docs || []) as Record<string, any>[]
  const t = (await getPortalTexts()).dashboard
  const [STATUS_TEXT, PAYMENT_TEXT, ID_TEXT] = [statusText(t), paymentText(t), idText(t)]

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="space-y-2 border-b border-aurix-border pb-6 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <span className="text-xs font-mono text-aurix-orange uppercase tracking-wider">
            {t.eyebrow}
          </span>
          <h1 className="text-2xl sm:text-4xl font-display font-extrabold text-white">
            {fill(t.welcome, { name: user.name })}
          </h1>
          <p className="text-slate-400 text-xs sm:text-sm font-mono mt-1">
            {user.institution ? `${user.institution} · ` : ''}{t.session}
          </p>
        </div>

        <div className="flex flex-wrap gap-2 shrink-0">
          <Link
            href="/aurix/register"
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-aurix-orange text-black font-semibold text-xs font-mono uppercase hover:bg-orange-400 transition-colors"
          >
            {t.registerButton} <ArrowRight className="w-3.5 h-3.5" />
          </Link>
          <Link
            href="/aurix/portal/claim"
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-aurix-dark border border-aurix-border text-slate-200 text-xs font-mono uppercase hover:text-white hover:border-aurix-orange transition-colors"
          >
            <KeyRound className="w-3.5 h-3.5 text-aurix-orange" /> {t.claimButton}
          </Link>
        </div>
      </div>

      {registrations.length === 0 ? (
        <div className="aurix-card rounded-2xl p-8 sm:p-12 text-center space-y-5 border-aurix-border">
          <div className="w-14 h-14 rounded-2xl bg-aurix-dark border border-aurix-border flex items-center justify-center text-aurix-orange mx-auto">
            <KeyRound className="w-7 h-7" />
          </div>
          <div className="space-y-1 max-w-md mx-auto">
            <h2 className="text-xl font-display font-bold text-white">
              {t.emptyTitle}
            </h2>
            <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
              {t.emptyText}
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
            <Link
              href="/aurix/register"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-lg bg-aurix-orange text-black font-semibold text-xs font-mono uppercase tracking-wider hover:bg-orange-400 transition-colors"
            >
              {t.registerButton} <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              href="/aurix/portal/claim"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-lg bg-aurix-dark border border-aurix-border text-slate-300 text-xs font-mono uppercase hover:text-white transition-colors"
            >
              {t.emptyClaim}
            </Link>
            <Link
              href="/aurix/competitions"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-lg bg-aurix-dark border border-aurix-border text-slate-300 text-xs font-mono uppercase hover:text-white transition-colors"
            >
              {t.emptyExplore}
            </Link>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-display font-bold text-white flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-aurix-orange" />
              {fill(t.listTitle, { n: registrations.length })}
            </h2>
            <Link
              href="/aurix/portal/events"
              className="text-xs font-mono text-aurix-orange hover:underline"
            >
              {t.schedulesLink}
            </Link>
          </div>

          <div className="grid grid-cols-1 gap-6">
            {registrations.map((reg) => {
              const event = typeof reg.event === 'object' && reg.event !== null ? reg.event : null
              const eventTitle = event?.title || 'AURIX 2026'
              const eventSlug = event?.slug || null
              const eventDates = event?.startDate ? formatDateRange(event.startDate, event.endDate) : null
              const eventVenue = event?.venue || event?.location || 'IILM University Greater Noida'

              const statusData = STATUS_TEXT[reg.status] || [t.unknown, 'wait']
              const paymentData = PAYMENT_TEXT[reg.paymentStatus] || [t.unknown, 'wait']
              const idData = ID_TEXT[reg.idVerification] || [t.unknown, 'wait']

              const needsPayment = reg.paymentStatus === 'AWAITING_PAYMENT'
              const paymentUrl = needsPayment
                ? buildRazorpayPaymentUrl({
                    name: reg.leaderName,
                    email: reg.leaderEmail,
                    phone: reg.leaderPhone,
                    college: reg.college,
                    eventLabel: event?.paymentEventLabel,
                    amountInRupees: reg.amountDue,
                  })
                : null

              return (
                <div
                  key={reg.id}
                  className="aurix-card rounded-2xl p-6 sm:p-8 space-y-6 border-aurix-border/80"
                >
                  {/* Top Bar */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-aurix-border/60 pb-4">
                    <div>
                      <div className="flex flex-wrap items-center gap-2 text-xs font-mono">
                        <span className="px-2 py-0.5 rounded bg-aurix-dark text-aurix-orange font-bold border border-aurix-border">
                          {reg.registrationCode}
                        </span>
                        {eventDates && (
                          <span className="text-slate-400 flex items-center gap-1">
                            <Calendar className="w-3.5 h-3.5 text-slate-500" />
                            {eventDates}
                          </span>
                        )}
                        <span className="text-slate-500">·</span>
                        <span className="text-slate-400">{eventVenue}</span>
                      </div>
                      <h3 className="text-xl sm:text-2xl font-display font-bold text-white mt-1">
                        {eventSlug ? (
                          <Link href={`/aurix/${eventSlug}`} className="hover:text-aurix-orange transition-colors">
                            {eventTitle}
                          </Link>
                        ) : (
                          eventTitle
                        )}
                      </h3>
                    </div>

                    <div className="text-right sm:self-center">
                      <span className="text-xs font-mono text-slate-400 block">{t.feeLabel}</span>
                      <span className="text-lg font-mono font-bold text-white">
                        {reg.amountDue !== null && reg.amountDue !== undefined ? `₹${reg.amountDue}` : '—'}
                      </span>
                    </div>
                  </div>

                  {/* Team details & Status */}
                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                    {/* Status Overview */}
                    <div className="lg:col-span-6 p-4 rounded-xl bg-aurix-dark/70 border border-aurix-border/70 space-y-1">
                      <span className="text-xs font-mono uppercase text-aurix-orange font-bold block mb-2">
                        {t.statusesTitle}
                      </span>
                      {toneBadge(t.rowEntry, statusData)}
                      {toneBadge(t.rowPayment, paymentData)}
                      {toneBadge(t.rowIds, idData)}
                    </div>

                    {/* Team Members Roster */}
                    <div className="lg:col-span-6 p-4 rounded-xl bg-aurix-dark/70 border border-aurix-border/70 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-mono uppercase text-aurix-orange font-bold">
                          {t.teamPrefix} {reg.teamName}
                        </span>
                        <span className="text-[11px] font-mono text-slate-400">
                          {reg.members?.length || 0} {(reg.members?.length || 0) === 1 ? t.memberOne : t.memberMany}
                        </span>
                      </div>
                      <ul className="text-xs text-slate-300 space-y-1.5 pt-1">
                        {(reg.members || []).map((m: any, i: number) => (
                          <li key={i} className="flex items-center justify-between gap-2 border-b border-aurix-border/40 pb-1 last:border-0">
                            <span className="text-white font-medium">
                              {m.name}
                              {i === 0 && (
                                <span className="ml-1.5 px-1.5 py-0.2 rounded text-[10px] font-mono bg-aurix-orange/20 text-aurix-orange border border-aurix-orange/30">
                                  {t.leaderBadge}
                                </span>
                              )}
                            </span>
                            <span className="text-slate-400 text-right truncate max-w-[180px]">{m.college}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  {/* Actions / Next Steps */}
                  <div className="pt-2 flex flex-wrap items-center justify-between gap-4 border-t border-aurix-border/60">
                    <div className="text-xs font-mono text-slate-400">
                      {fill(t.registeredOn, { date: new Date(reg.createdAt).toLocaleDateString('en-IN', { timeZone: 'Asia/Kolkata', dateStyle: 'medium' }) })}
                    </div>

                    <div className="flex flex-wrap items-center gap-3">
                      {needsPayment && paymentUrl && (
                        <a
                          href={paymentUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-aurix-orange text-black font-semibold text-xs font-mono uppercase tracking-wider hover:bg-orange-400 transition-colors"
                        >
                          <CreditCard className="w-3.5 h-3.5" /> {t.payButton} <ExternalLink className="w-3 h-3 ml-0.5" />
                        </a>
                      )}
                      {eventSlug && (
                        <Link
                          href={`/aurix/${eventSlug}`}
                          className="px-4 py-2 rounded-lg bg-aurix-dark border border-aurix-border text-slate-300 text-xs font-mono uppercase hover:text-white hover:border-aurix-orange transition-colors"
                        >
                          {t.rulesButton}
                        </Link>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
