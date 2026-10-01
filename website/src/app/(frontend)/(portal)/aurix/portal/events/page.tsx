import React from 'react'
import Link from 'next/link'
import { getAllEvents } from '@/lib/data/events'
import { Calendar, Users, Trophy, ArrowRight, CheckCircle2 } from 'lucide-react'

// Re-read event data from the CMS at most once a minute
export const revalidate = 60

export default async function PortalEventsPage() {
  const events = await getAllEvents()
  const aurixEvents = events.filter((e) => e.series === 'AURIX')

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="space-y-2 border-b border-aurix-border pb-6">
        <span className="text-xs font-mono text-aurix-orange uppercase tracking-wider">
          Tournament Registry // Events
        </span>
        <h1 className="text-2xl sm:text-4xl font-display font-extrabold text-white">
          AURIX Competition Registration
        </h1>
        <p className="text-slate-400 text-xs sm:text-sm font-mono">
          Select a tournament track to form your squad or confirm your registration status.
        </p>
      </div>

      <div className="space-y-6">
        {aurixEvents.map((ev) => (
          <div
            key={ev.id}
            className="aurix-card rounded-2xl p-6 sm:p-8 flex flex-col md:flex-row md:items-center justify-between gap-6"
          >
            <div className="space-y-3 max-w-2xl">
              <div className="flex flex-wrap items-center gap-2 text-xs font-mono">
                <span className="px-2.5 py-0.5 rounded bg-aurix-dark text-aurix-orange font-bold border border-aurix-border">
                  {ev.eventType}
                </span>
                <span className="text-slate-400">
                  {ev.registrationFee !== null ? `Fee: ₹${ev.registrationFee}` : 'Open / Unpriced'}
                </span>
                <span className="text-slate-400">•</span>
                <span className="text-slate-400">
                  {ev.minTeamSize && ev.maxTeamSize
                    ? ev.minTeamSize === ev.maxTeamSize
                      ? `Exactly ${ev.minTeamSize} Members`
                      : `${ev.minTeamSize}–${ev.maxTeamSize} Members`
                    : ev.operatorCount
                    ? `${ev.operatorCount} Operator`
                    : 'Team'}
                </span>
              </div>

              <h2 className="font-display font-bold text-white text-xl sm:text-2xl">
                {ev.title}
              </h2>

              <p className="text-slate-400 text-xs sm:text-sm leading-relaxed">
                {ev.shortDescription}
              </p>
            </div>

            <div className="flex flex-col sm:flex-row md:flex-col gap-3 shrink-0">
              <Link
                href={`/aurix/${ev.slug}`}
                className="px-6 py-2.5 rounded-lg bg-aurix-orange text-black font-semibold text-xs font-mono uppercase text-center hover:bg-orange-400 transition-colors shadow-md"
              >
                Inspect Rules & Specs
              </Link>
              <Link
                href="/aurix/portal/teams"
                className="px-6 py-2.5 rounded-lg bg-aurix-dark border border-aurix-border text-slate-300 font-mono text-xs uppercase text-center hover:text-white hover:border-aurix-orange transition-colors"
              >
                Manage Squad
              </Link>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
