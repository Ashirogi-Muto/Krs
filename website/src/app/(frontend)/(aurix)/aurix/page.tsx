import React from 'react'
import Link from 'next/link'
import { constructMetadata } from '@/lib/seo/metadata'
import { getAllEvents } from '@/lib/data/events'
import { Countdown } from '@/components/aurix/Countdown'
import {
  Flame,
  ArrowRight,
  Shield,
  Trophy,
  Zap,
  Users,
  Compass,
  Calendar,
  CheckCircle2,
} from 'lucide-react'
import { isVisibleIn } from '@/lib/visibility'
import { getHiddenRoutes } from '@/lib/site-settings'
import { getPageTexts } from '@/lib/page-texts'
import { formatDateRange, formatFee, formatINR, formatTeamSize } from '@/lib/format'

// Re-read event data from the CMS at most once a minute
export const revalidate = 60

export const metadata = constructMetadata({
  title: 'AURIX 2026 | National Robotics & AI Competition Arena',
  description:
    'National robotics arena hosted by Kalam Robotics Society at IILM University Greater Noida. Robo Soccer, Robo Race, Robo Expo and Robo Ideathon.',
  path: '/aurix',
})

export default async function AURIXHomePage() {
  const t = await getPageTexts()
  const hidden = await getHiddenRoutes()
  const isRouteVisible = (href: string) => isVisibleIn(hidden, href)
  const events = await getAllEvents()
  const aurixCompetitions = events.filter((e) => e.series === 'AURIX')
  // Overall AURIX dates = earliest start to latest end across competitions (from the CMS)
  const festStart = aurixCompetitions.map((e) => e.startDate).filter(Boolean).sort()[0]
  const festEnd = aurixCompetitions.map((e) => e.endDate).filter(Boolean).sort().slice(-1)[0]
  const festDates = festStart ? formatDateRange(festStart, festEnd, 'long') : 'dates to be announced'
  const totalPrizePool = aurixCompetitions.reduce((sum, e) => sum + (e.prizePool || 0), 0)
  const hackathon = aurixCompetitions.find((e) => e.slug === 'hackathon')

  return (
    <div className="space-y-24 md:space-y-32 pb-24">
      {/* 1. ARENA HERO */}
      <section className="relative min-h-[80vh] flex items-center justify-center pt-16 pb-12 px-4 sm:px-6 lg:px-8 bg-aurix-grid border-b border-aurix-border overflow-hidden">
        {/* Glow accent */}
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[650px] h-[350px] bg-aurix-orange/10 blur-[140px] rounded-full pointer-events-none" />

        <div className="max-w-5xl mx-auto text-center relative z-10 space-y-6">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/images/aurix-logo-full.png"
            alt="AURIX — Innovate | Build | Beyond"
            width={520}
            height={485}
            className="mx-auto h-32 sm:h-44 w-auto drop-shadow-[0_0_30px_rgba(56,189,248,0.25)]"
          />
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-aurix-surface border border-aurix-border text-[11px] font-mono text-aurix-orange uppercase tracking-wider shadow-sm">
            <Flame className="w-3.5 h-3.5 text-aurix-orange animate-pulse" />
            {t.aurix.heroEyebrow}
          </div>

          <h1 className="text-4xl sm:text-6xl lg:text-7xl font-display font-extrabold tracking-tight text-white uppercase leading-[1.05]">
            AURIX 2026 <br className="hidden sm:inline" />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-aurix-orange via-white to-aurix-orange">
              COMPETITION ARENA
            </span>
          </h1>

          <div className="flex flex-wrap items-center justify-center gap-x-3 gap-y-1 sm:gap-x-6 text-xs sm:text-sm font-mono tracking-widest text-slate-300 font-bold py-1">
            <span className="uppercase">{festDates}</span>
            <span className="text-aurix-orange">•</span>
            <span>GREATER NOIDA</span>
            {totalPrizePool > 0 && (
              <>
                <span className="text-aurix-orange">•</span>
                <span className="text-aurix-orange">{formatINR(totalPrizePool)} PRIZE POOL</span>
              </>
            )}
            <span className="text-aurix-orange">•</span>
            <span>NATIONAL STAGE</span>
          </div>

          <p className="max-w-2xl mx-auto text-slate-300 text-sm sm:text-base leading-relaxed">
            {t.aurix.heroIntro}
          </p>

          {/* Central Countdown */}
          {hackathon && (
            <div className="pt-2 flex justify-center">
              <Countdown targetDate={hackathon.startDate} label="Tournament Commences In" />
            </div>
          )}

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
            <Link
              href="/aurix/competitions"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-3.5 rounded-lg bg-aurix-orange text-black font-semibold text-xs font-mono uppercase hover:bg-orange-400 transition-colors shadow-lg shadow-aurix-orange/20"
            >
              {t.aurix.exploreButton}
              <ArrowRight className="w-4 h-4" />
            </Link>
            {isRouteVisible('/aurix/portal') && (
              <Link
                href="/aurix/portal"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-lg bg-aurix-surface border border-aurix-border text-white text-xs font-mono uppercase hover:border-aurix-orange transition-colors"
              >
                {t.aurix.portalButton}
              </Link>
            )}
          </div>
        </div>
      </section>

      {/* 2. FIVE PREMIER CHALLENGES */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        <div>
          <span className="text-xs font-mono text-aurix-orange uppercase tracking-wider">
            {t.aurix.categoriesEyebrow}
          </span>
          <h2 className="text-3xl sm:text-4xl font-display font-extrabold text-white tracking-tight mt-1">
            {t.aurix.categoriesTitle}
          </h2>
          <p className="text-slate-400 text-xs sm:text-sm mt-1">
            {t.aurix.categoriesIntro}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {aurixCompetitions.map((comp) => (
            <div
              key={comp.id}
              className="aurix-card rounded-2xl p-6 md:p-8 flex flex-col justify-between space-y-6 group"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between text-xs font-mono">
                  <span className="px-2.5 py-0.5 rounded bg-aurix-dark text-aurix-orange font-bold border border-aurix-border">
                    {comp.eventType}
                  </span>
                  <span className="text-slate-300 font-bold">
                    {comp.comingSoon ? 'Coming Soon' : comp.registrationFee !== null ? `₹${comp.registrationFee} / team` : 'Registration Open'}
                  </span>
                </div>

                <h3 className="font-display font-extrabold text-white text-xl group-hover:text-aurix-orange transition-colors leading-snug">
                  {comp.title}
                </h3>

                <p className="text-slate-400 text-xs leading-relaxed line-clamp-3">
                  {comp.shortDescription}
                </p>
              </div>

              <div className="pt-4 border-t border-aurix-border/60 flex items-center justify-between">
                <span className="text-[11px] font-mono text-slate-400">
                  {comp.minTeamSize && comp.maxTeamSize
                    ? comp.minTeamSize === comp.maxTeamSize
                      ? `Exactly ${comp.minTeamSize} Members`
                      : `${comp.minTeamSize}–${comp.maxTeamSize} Members`
                    : comp.operatorCount
                    ? `${comp.operatorCount} Operator`
                    : 'Team Entry'}
                </span>
                <Link
                  href={`/aurix/${comp.slug}`}
                  className="inline-flex items-center gap-1.5 text-xs font-mono text-aurix-orange font-semibold hover:underline"
                >
                  Inspect Rulebook <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 3. HOW PARTICIPATION WORKS */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        <div>
          <span className="text-xs font-mono text-aurix-orange uppercase tracking-wider">
            {t.aurix.stepsEyebrow}
          </span>
          <h2 className="text-3xl sm:text-4xl font-display font-extrabold text-white tracking-tight mt-1">
            {t.aurix.stepsTitle}
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {t.aurix.steps.map((step, i) => (
            <div key={i} className="aurix-card rounded-xl p-6 space-y-3">
              <span className="w-8 h-8 rounded bg-aurix-dark border border-aurix-border text-aurix-orange font-mono text-xs font-bold flex items-center justify-center">
                {String(i + 1).padStart(2, '0')}
              </span>
              <h3 className="font-display font-bold text-white text-base">{step.title}</h3>
              <p className="text-slate-400 text-xs leading-relaxed">{(step.text || '').replace('{dates}', festDates)}</p>
            </div>
          ))}
        </div>
      </section>

      {/* 4. COMPETITION COMPARISON TABLE */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        <div>
          <span className="text-xs font-mono text-aurix-orange uppercase tracking-wider">
            {t.aurix.comparisonEyebrow}
          </span>
          <h2 className="text-2xl sm:text-3xl font-display font-bold text-white tracking-tight mt-1">
            {t.aurix.comparisonTitle}
          </h2>
        </div>

        <div className="aurix-card rounded-2xl overflow-x-auto border-aurix-border">
          <table className="w-full text-left text-xs font-mono">
            <thead className="bg-aurix-dark border-b border-aurix-border text-slate-400 uppercase">
              <tr>
                <th className="p-4">Competition</th>
                <th className="p-4">Team Composition</th>
                <th className="p-4">Registration Fee</th>
                <th className="p-4">Prize Pool</th>
                <th className="p-4">Robot Constraints</th>
                <th className="p-4">Dates</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-aurix-border/60 text-slate-300">
              {aurixCompetitions.map((ev) => (
                <tr key={ev.id}>
                  <td className="p-4 font-bold text-white">{ev.title}</td>
                  <td className="p-4">{ev.comingSoon ? 'Coming Soon' : formatTeamSize(ev.minTeamSize, ev.maxTeamSize)}</td>
                  <td className="p-4">{formatFee(ev.registrationFee, ev.comingSoon)}</td>
                  <td className="p-4 text-aurix-orange font-bold">{ev.prizePool ? formatINR(ev.prizePool) : '—'}</td>
                  <td className="p-4">{ev.comingSoon ? '—' : ev.specsSummary || '—'}</td>
                  <td className="p-4">{formatDateRange(ev.startDate, ev.endDate)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {isRouteVisible('/aurix/portal') && (
        <>
          {/* 5. PORTAL CALLOUT */}
          <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="aurix-card rounded-2xl p-8 sm:p-14 text-center space-y-6 bg-aurix-grid border-aurix-orange/80 shadow-xl">
              <div className="max-w-2xl mx-auto space-y-3">
                <span className="text-xs font-mono text-aurix-orange uppercase tracking-wider">
                  Participant Hub // Autonomous Operations
                </span>
                <h2 className="text-3xl sm:text-5xl font-display font-extrabold text-white uppercase tracking-tight">
                  Enter the Participant Portal
                </h2>
                <p className="text-slate-300 text-sm leading-relaxed">
                  Create and manage your competition squad, generate team invitation tokens, monitor proposal screening status, and access live tournament announcements.
                </p>
              </div>
              <div className="pt-2">
                            <Link
                  href="/aurix/portal"
                  className="inline-flex items-center gap-2 px-8 py-3.5 rounded-lg bg-aurix-orange text-black font-semibold text-xs font-mono uppercase tracking-wider hover:bg-orange-400 transition-colors shadow-lg"
                >
                  Access Portal Dashboard
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </div>
          </section>
        </>
      )}
    </div>
  )
}
