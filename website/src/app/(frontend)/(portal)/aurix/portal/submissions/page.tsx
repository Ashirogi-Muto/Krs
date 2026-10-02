import React from 'react'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { getPayload } from 'payload'
import config from '@payload-config'
import { getSessionUser } from '@/lib/auth/session'
import { requireVisibleRoute } from '@/lib/visibility-guard'
import { FileCheck2, Clock, ArrowRight, Info, KeyRound } from 'lucide-react'

export const dynamic = 'force-dynamic'

export const metadata = {
  title: 'Submissions | AURIX Participant Portal',
  robots: {
    index: false,
    follow: false,
    nocache: true,
  },
}

export default async function PortalSubmissionsPage() {
  requireVisibleRoute('/aurix/portal')
  const user = await getSessionUser()
  if (!user) {
    redirect('/login')
  }

  const payload = await getPayload({ config })
  const regResult = await payload.find({
    collection: 'event-registrations',
    where: {
      participants: {
        contains: user.id,
      },
    },
    depth: 2,
    overrideAccess: true,
  })

  const registrations = (regResult.docs || []) as Record<string, any>[]

  return (
    <div className="space-y-8 max-w-4xl">
      {/* Header */}
      <div className="space-y-2 border-b border-aurix-border pb-6">
        <span className="text-xs font-mono text-aurix-orange uppercase tracking-wider">
          Artifacts & Dossiers // Submissions
        </span>
        <h1 className="text-2xl sm:text-4xl font-display font-extrabold text-white">
          Competition Submissions
        </h1>
        <p className="text-slate-400 text-xs sm:text-sm font-mono">
          Upload and review technical proposals, circuit diagrams, and project repositories.
        </p>
      </div>

      <div className="aurix-card rounded-2xl p-8 sm:p-12 text-center space-y-5 border-aurix-border">
        <div className="w-14 h-14 rounded-2xl bg-aurix-dark border border-aurix-border flex items-center justify-center text-aurix-orange mx-auto">
          <Clock className="w-7 h-7" />
        </div>

        <div className="space-y-2 max-w-md mx-auto">
          <h2 className="text-xl font-display font-bold text-white">
            Submission Windows Not Yet Open
          </h2>
          <p className="text-slate-400 text-xs sm:text-sm leading-relaxed">
            Technical proposal uploads and project submission portals will open in Phase 2 once tournament tracks and evaluation deadlines are finalized by organizers.
          </p>
        </div>

        <div className="p-4 rounded-xl bg-aurix-dark/60 border border-aurix-border/60 text-left text-xs text-slate-300 max-w-lg mx-auto flex items-start gap-3">
          <Info className="w-4 h-4 text-aurix-orange shrink-0 mt-0.5" />
          <div className="space-y-1">
            <span className="font-bold text-white">What you need to do now</span>
            <p className="text-slate-400 leading-relaxed">
              Ensure your team registration is claimed, payment is completed, and all student ID cards are verified. Organizers will announce submission deadlines via the portal Announcements page.
            </p>
          </div>
        </div>

        <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link
            href="/aurix/portal/announcements"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-lg bg-aurix-orange text-black font-semibold text-xs font-mono uppercase tracking-wider hover:bg-orange-400 transition-colors"
          >
            Check Bulletins <ArrowRight className="w-4 h-4" />
          </Link>
          <Link
            href="/aurix/portal"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-lg bg-aurix-dark border border-aurix-border text-slate-300 text-xs font-mono uppercase hover:text-white transition-colors"
          >
            Dashboard
          </Link>
        </div>
      </div>

      {registrations.length > 0 && (
        <div className="space-y-4">
          <h3 className="font-display font-bold text-white text-base">
            Your Active Registrations
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {registrations.map((reg) => (
              <div
                key={reg.id}
                className="p-4 rounded-xl bg-aurix-dark/70 border border-aurix-border/70 space-y-1 text-xs font-mono"
              >
                <div className="flex items-center justify-between text-slate-400">
                  <span className="text-aurix-orange font-bold">{reg.registrationCode}</span>
                  <span className="text-[11px]">{reg.status}</span>
                </div>
                <div className="text-white font-bold text-sm">{reg.teamName}</div>
                <div className="text-slate-400">
                  {typeof reg.event === 'object' ? reg.event?.title : 'AURIX Competition'}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
