import React from 'react'
import Link from 'next/link'
import { constructMetadata } from '@/lib/seo/metadata'
import { BreadcrumbsJsonLd } from '@/lib/seo/structured-data'
import { getAllEvents } from '@/lib/data/events'
import { Flame, ArrowRight, Calendar, MapPin, Users } from 'lucide-react'

// Re-read event data from the CMS at most once a minute
export const revalidate = 60

export const metadata = constructMetadata({
  title: 'Robotics Competitions & Events | Kalam Robotics Society',
  description:
    'Gateway to official robotics challenges, workshops, and the flagship AURIX competition series at IILM University Greater Noida.',
  path: '/events',
})

export default async function EventsGatewayPage() {
  const events = await getAllEvents()
  const aurixEvents = events.filter((e) => e.series === 'AURIX')
  const hackathon = aurixEvents.find((e) => e.slug === 'hackathon')

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 space-y-16">
      <BreadcrumbsJsonLd
        items={[
          { name: 'Home', url: '/' },
          { name: 'Events', url: '/events' },
        ]}
      />

      <div className="max-w-3xl space-y-4">
        <span className="text-xs font-mono text-krs-cyan uppercase tracking-wider">
          Competitive Arena & Workshops // Events Gateway
        </span>
        <h1 className="text-3xl sm:text-5xl font-display font-extrabold text-white tracking-tight">
          Robotics Events & Competitions
        </h1>
        <p className="text-slate-400 text-sm sm:text-base leading-relaxed">
          KRS hosts hands-on hardware training workshops, industry seminars, and the flagship annual AURIX robotics and AI competition circuit.
        </p>
      </div>

      {/* DOMINANT AURIX FEATURED BANNER */}
      {hackathon && (
        <section className="relative rounded-2xl bg-aurix-card border-2 border-aurix-orange/80 p-8 sm:p-12 overflow-hidden bg-aurix-grid shadow-2xl shadow-aurix-orange/10">
          <div className="relative z-10 max-w-3xl space-y-5">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded bg-aurix-dark border border-aurix-border text-xs font-mono text-aurix-orange uppercase font-semibold">
              <Flame className="w-3.5 h-3.5 text-aurix-orange animate-pulse" />
              Flagship Annual Competition
            </div>

            <h2 className="text-3xl sm:text-5xl font-display font-extrabold text-white tracking-tight leading-tight">
              AURIX 2026: {hackathon.title}
            </h2>

            <p className="text-slate-300 text-sm sm:text-base leading-relaxed">
              {hackathon.description}
            </p>

            <div className="flex flex-wrap items-center gap-4 text-xs font-mono text-slate-300 pt-2">
              <span className="flex items-center gap-1.5 bg-aurix-dark px-3 py-1.5 rounded border border-aurix-border">
                <Calendar className="w-4 h-4 text-aurix-orange" />
                29–30 October 2026
              </span>
              <span className="flex items-center gap-1.5 bg-aurix-dark px-3 py-1.5 rounded border border-aurix-border">
                <MapPin className="w-4 h-4 text-aurix-orange" />
                IILM University, Greater Noida
              </span>
              <span className="flex items-center gap-1.5 bg-aurix-dark px-3 py-1.5 rounded border border-aurix-border">
                <Users className="w-4 h-4 text-aurix-orange" />
                Exactly 5 Members / Team
              </span>
            </div>

            <div className="pt-4 flex flex-wrap gap-4">
              <Link
                href="/aurix/hackathon"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-aurix-orange text-black font-semibold text-xs font-mono uppercase hover:bg-orange-400 transition-colors shadow-lg"
              >
                Enter Hackathon Hub <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                href="/aurix"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-aurix-dark border border-aurix-border text-white text-xs font-mono uppercase hover:border-aurix-orange transition-colors"
              >
                View Full AURIX Roster
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* ALL COMPETITION CARDS */}
      <section className="space-y-8">
        <div>
          <span className="text-xs font-mono text-aurix-orange uppercase tracking-wider">
            Tournament Roster
          </span>
          <h2 className="text-2xl sm:text-3xl font-display font-bold text-white tracking-tight mt-1">
            AURIX Competition Categories
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {aurixEvents.map((ev) => (
            <div
              key={ev.id}
              className="aurix-card rounded-xl p-6 flex flex-col justify-between space-y-4"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between text-xs font-mono">
                  <span className="px-2 py-0.5 rounded bg-aurix-dark border border-aurix-border text-aurix-orange">
                    {ev.eventType}
                  </span>
                  <span className="text-slate-300 font-semibold">
                    {ev.registrationFee !== null ? `₹${ev.registrationFee}` : 'Open'}
                  </span>
                </div>
                <h3 className="font-display font-bold text-white text-xl">
                  {ev.title}
                </h3>
                <p className="text-slate-400 text-xs leading-relaxed line-clamp-3">
                  {ev.shortDescription}
                </p>
              </div>

              <div className="pt-4 border-t border-aurix-border/60 flex items-center justify-between">
                <span className="text-[11px] font-mono text-slate-500">
                  {ev.minTeamSize && ev.maxTeamSize
                    ? ev.minTeamSize === ev.maxTeamSize
                      ? `Exactly ${ev.minTeamSize} Members`
                      : `${ev.minTeamSize}–${ev.maxTeamSize} Members`
                    : ev.operatorCount
                    ? `${ev.operatorCount} Operator`
                    : 'Team'}
                </span>
                <Link
                  href={`/aurix/${ev.slug}`}
                  className="inline-flex items-center gap-1 text-xs font-mono text-aurix-orange font-semibold hover:underline"
                >
                  Full Specification <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}
