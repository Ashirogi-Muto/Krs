import React from 'react'
import Link from 'next/link'
import { constructMetadata } from '@/lib/seo/metadata'
import { BreadcrumbsJsonLd } from '@/lib/seo/structured-data'
import { getAllEvents } from '@/lib/data/events'
import { ArrowRight, Trophy, Users, Calendar } from 'lucide-react'

// Re-read event data from the CMS at most once a minute
export const revalidate = 60

export const metadata = constructMetadata({
  title: 'All AURIX Competitions | Tournament Roster',
  description:
    'Comprehensive directory of all robotics competitions and challenges in the AURIX 2026 series at IILM University Greater Noida.',
  path: '/aurix/competitions',
})

export default async function CompetitionsDirectoryPage() {
  const events = await getAllEvents()
  const aurixEvents = events.filter((e) => e.series === 'AURIX')

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 space-y-12">
      <BreadcrumbsJsonLd
        items={[
          { name: 'Home', url: '/' },
          { name: 'AURIX', url: '/aurix' },
          { name: 'Competitions', url: '/aurix/competitions' },
        ]}
      />

      <div className="space-y-4">
        <span className="text-xs font-mono text-aurix-orange uppercase tracking-wider">
          Competitive Tracks // AURIX 2026
        </span>
        <h1 className="text-3xl sm:text-5xl font-display font-extrabold text-white tracking-tight">
          Tournament Competitions
        </h1>
        <p className="text-slate-400 text-sm sm:text-base max-w-2xl leading-relaxed">
          Five specialized competitive tracks designed to evaluate rapid cyber-physical prototyping, remote mechanical piloting, research rigor, and multidisciplinary ideation.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {aurixEvents.map((ev) => (
          <div
            key={ev.id}
            className="aurix-card rounded-2xl p-6 sm:p-8 flex flex-col justify-between space-y-6 group"
          >
            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs font-mono">
                <span className="px-2.5 py-0.5 rounded bg-aurix-dark text-aurix-orange font-bold border border-aurix-border">
                  {ev.eventType}
                </span>
                <span className="text-slate-300 font-bold">
                  {ev.comingSoon ? 'Coming Soon' : ev.registrationFee !== null ? `₹${ev.registrationFee} / team` : 'Registration Open'}
                </span>
              </div>

              <h2 className="font-display font-bold text-white text-xl sm:text-2xl group-hover:text-aurix-orange transition-colors leading-snug">
                {ev.title}
              </h2>

              <p className="text-slate-400 text-xs sm:text-sm leading-relaxed line-clamp-3">
                {ev.shortDescription}
              </p>
            </div>

            <div className="pt-4 border-t border-aurix-border/60 flex items-center justify-between">
              <div className="text-[11px] font-mono text-slate-400 space-y-0.5">
                <div>
                  {ev.minTeamSize && ev.maxTeamSize
                    ? ev.minTeamSize === ev.maxTeamSize
                      ? `Team: ${ev.minTeamSize} Members`
                      : `Team: ${ev.minTeamSize}–${ev.maxTeamSize} Members`
                    : ev.operatorCount
                    ? `${ev.operatorCount} Operator`
                    : 'Team Entry'}
                </div>
              </div>

              <Link
                href={`/aurix/${ev.slug}`}
                className="inline-flex items-center gap-1.5 text-xs font-mono font-bold text-aurix-orange hover:underline"
              >
                Inspect Specs <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
