import { notFound } from 'next/navigation'
import React from 'react'
import Link from 'next/link'
import { GenericEvent } from '@/lib/data/types'
import { isVisibleIn } from '@/lib/visibility'
import { getHiddenRoutes } from '@/lib/site-settings'
import { Countdown } from '@/components/aurix/Countdown'
import { EventJsonLd, BreadcrumbsJsonLd } from '@/lib/seo/structured-data'
import {
  Calendar,
  MapPin,
  Users,
  Trophy,
  Ticket,
  AlertTriangle,
  CheckCircle2,
  HelpCircle,
  Clock,
  ArrowRight,
  Shield,
  Layers,
  Sparkles,
} from 'lucide-react'
import { formatDateRange } from '@/lib/format'
import { formatINR } from '@/lib/format'
import { getEventLabels } from '@/lib/event-labels'

interface EventPageProps {
  event: GenericEvent
}

export async function EventPage({ event }: EventPageProps) {
  const [hidden, L] = await Promise.all([getHiddenRoutes(), getEventLabels()])
  const isRouteVisible = (href: string) => isVisibleIn(hidden, href)
  // Competition page hidden on the Page visibility screen
  if (!isRouteVisible(`/aurix/${event.slug}`)) notFound()

  // Status label & CTA mapping per Section 97
  const getCtaConfig = () => {
    switch (event.status) {
      case 'REGISTRATION_OPEN':
        if (event.registrationUrl) {
          return { label: L.ctaOpen, href: event.registrationUrl, disabled: false }
        }
        return { label: L.ctaOpen, href: `/aurix/register?event=${event.slug}`, disabled: false }
      case 'REGISTRATION_CLOSED':
        return { label: L.ctaClosed, href: '#', disabled: true }
      case 'IN_PROGRESS':
        return { label: L.ctaLive, href: '/aurix/portal', disabled: !isRouteVisible('/aurix/portal') }
      case 'RESULTS_PENDING':
        return { label: L.ctaResultsPending, href: '/aurix/results', disabled: !isRouteVisible('/aurix/results') }
      case 'RESULTS_PUBLISHED':
        return { label: L.ctaResults, href: '/aurix/results', disabled: !isRouteVisible('/aurix/results') }
      case 'ARCHIVED':
        return { label: L.ctaArchived, href: '#', disabled: true }
      default:
        return { label: L.ctaAnnounced, href: '#overview', disabled: false }
    }
  }

  const cta = getCtaConfig()

  if (event.comingSoon) {
    return (
      <article className="pb-20">
        <BreadcrumbsJsonLd
          items={[
            { name: 'Home', url: '/' },
            { name: 'AURIX', url: '/aurix' },
            { name: 'Competitions', url: '/aurix/competitions' },
            { name: event.title, url: `/aurix/${event.slug}` },
          ]}
        />
        <section className="relative pt-16 sm:pt-28 pb-20 px-4 sm:px-6 lg:px-8 border-b border-aurix-border bg-aurix-grid overflow-hidden">
          <div className="max-w-3xl mx-auto text-center space-y-6 relative z-10">
            <span className="inline-block px-3 py-1 rounded bg-aurix-dark border border-aurix-border text-xs font-mono text-aurix-orange uppercase font-bold tracking-wider">
              AURIX {event.edition}
            </span>
            <h1 className="text-4xl sm:text-6xl font-display font-extrabold text-white uppercase tracking-tight leading-none">
              {event.title}
            </h1>
            <p className="text-2xl sm:text-3xl font-display font-bold text-aurix-orange uppercase tracking-wider">
              {L.comingSoonText}
            </p>
            {event.prizePool ? (
              <p className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-aurix-dark border border-aurix-border text-white font-mono font-bold">
                <Trophy className="w-4 h-4 text-aurix-orange" /> {L.comingSoonPrize} {formatINR(event.prizePool)}
              </p>
            ) : null}
            <p className="text-slate-300 text-sm sm:text-base leading-relaxed">{event.description}</p>
            <div className="pt-4">
              <Link
                href="/aurix/competitions"
                className="inline-flex items-center gap-2 px-8 py-3.5 rounded-lg bg-aurix-orange text-black font-semibold text-xs font-mono uppercase tracking-wider hover:bg-orange-400 transition-colors shadow-lg shadow-aurix-orange/20"
              >
                {L.comingSoonButton}
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </section>
      </article>
    )
  }

  return (
    <article className="space-y-16 sm:space-y-24 pb-20">
      <EventJsonLd event={event} />
      <BreadcrumbsJsonLd
        items={[
          { name: 'Home', url: '/' },
          { name: 'AURIX', url: '/aurix' },
          { name: 'Competitions', url: '/aurix/competitions' },
          { name: event.title, url: `/aurix/${event.slug}` },
        ]}
      />

      {/* 1. HERO SECTION */}
      <section className="relative pt-12 sm:pt-20 pb-12 px-4 sm:px-6 lg:px-8 border-b border-aurix-border bg-aurix-grid overflow-hidden">
        <div className="max-w-6xl mx-auto space-y-6 relative z-10">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <span className="px-3 py-1 rounded bg-aurix-dark border border-aurix-border text-xs font-mono text-aurix-orange uppercase font-bold tracking-wider">
                AURIX {event.edition} // {event.eventType}
              </span>
              <span className="px-3 py-1 rounded bg-aurix-surface text-slate-300 border border-aurix-border text-xs font-mono">
                {L.statusLabel} {event.status.replace('_', ' ')}
              </span>
            </div>

            {/* Countdown Component */}
            <Countdown targetDate={event.startDate} label={L.countdownLabel} />
          </div>

          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-display font-extrabold text-white tracking-tight uppercase leading-tight">
            {event.title}
          </h1>

          <p className="text-slate-300 text-sm sm:text-lg max-w-3xl leading-relaxed">
            {event.shortDescription || event.description}
          </p>

          {/* Quick Stats Strip */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 pt-4">
            <div className="aurix-card rounded-xl p-4 space-y-1">
              <div className="flex items-center gap-2 text-slate-400 text-xs font-mono">
                <Calendar className="w-3.5 h-3.5 text-aurix-orange" />
                <span>{L.statDate}</span>
              </div>
              <p className="text-white font-mono font-bold text-sm sm:text-base">
                {formatDateRange(event.startDate, event.endDate)}
              </p>
            </div>

            <div className="aurix-card rounded-xl p-4 space-y-1">
              <div className="flex items-center gap-2 text-slate-400 text-xs font-mono">
                <MapPin className="w-3.5 h-3.5 text-aurix-orange" />
                <span>{L.statVenue}</span>
              </div>
              <p className="text-white font-mono font-bold text-sm sm:text-base truncate">
                {event.venue || L.venueValue}
              </p>
            </div>

            <div className="aurix-card rounded-xl p-4 space-y-1">
              <div className="flex items-center gap-2 text-slate-400 text-xs font-mono">
                <Users className="w-3.5 h-3.5 text-aurix-orange" />
                <span>{L.statTeam}</span>
              </div>
              <p className="text-white font-mono font-bold text-sm sm:text-base">
                {event.minTeamSize && event.maxTeamSize
                  ? event.minTeamSize === event.maxTeamSize
                    ? `Exactly ${event.minTeamSize} Members`
                    : `${event.minTeamSize}–${event.maxTeamSize} Members`
                  : event.operatorCount
                  ? `${event.operatorCount} Operator`
                  : 'Team'}
              </p>
            </div>

            <div className="aurix-card rounded-xl p-4 space-y-1">
              <div className="flex items-center gap-2 text-slate-400 text-xs font-mono">
                <Ticket className="w-3.5 h-3.5 text-aurix-orange" />
                <span>{L.statFee}</span>
              </div>
              <p className="text-white font-mono font-bold text-sm sm:text-base">
                {event.registrationFee !== null ? `₹${event.registrationFee}${L.feeSuffix}` : L.unpriced}
              </p>
            </div>

            <div className="aurix-card rounded-xl p-4 space-y-1">
              <div className="flex items-center gap-2 text-slate-400 text-xs font-mono">
                <Trophy className="w-3.5 h-3.5 text-aurix-orange" />
                <span>{L.statPrize}</span>
              </div>
              <p className="text-white font-mono font-bold text-sm sm:text-base">
                {event.prizePool ? formatINR(event.prizePool) : L.prizeTba}
              </p>
            </div>
          </div>

          {/* Action CTAs */}
          <div className="pt-4 flex flex-wrap items-center gap-4">
            {cta.disabled ? (
              <span className="px-8 py-3.5 rounded-lg bg-slate-800 text-slate-400 font-mono text-xs uppercase font-bold cursor-not-allowed">
                {cta.label}
              </span>
            ) : (
              <Link
                href={cta.href}
                className="inline-flex items-center gap-2 px-8 py-3.5 rounded-lg bg-aurix-orange text-black font-semibold text-xs font-mono uppercase tracking-wider hover:bg-orange-400 transition-colors shadow-lg shadow-aurix-orange/20"
              >
                {cta.label}
                <ArrowRight className="w-4 h-4" />
              </Link>
            )}
            <a
              href="#rules"
              className="inline-flex items-center gap-2 px-6 py-3.5 rounded-lg bg-aurix-surface border border-aurix-border text-slate-300 font-mono text-xs uppercase hover:text-white hover:border-aurix-orange transition-colors"
            >
              {L.rulesButton}
            </a>
            {event.mediaGalleryUrl && (
              <a
                href={event.mediaGalleryUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-6 py-3.5 rounded-lg bg-aurix-surface border border-aurix-orange/50 text-aurix-orange font-mono text-xs uppercase hover:bg-aurix-orange/10 transition-colors"
              >
                {L.footageButton}
              </a>
            )}
          </div>
        </div>
      </section>

      {/* SPECIAL DISCLOSURE NOTICE IF APPLICABLE */}
      {event.specialNotice && (
        <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="p-5 rounded-xl bg-orange-950/40 border border-aurix-orange/60 flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-aurix-orange shrink-0 mt-0.5" />
            <div className="space-y-1 text-xs sm:text-sm">
              <span className="font-mono text-aurix-orange font-bold uppercase tracking-wider block">
                {L.noticeTitle}
              </span>
              <p className="text-slate-300 leading-relaxed">
                {event.specialNotice}
              </p>
            </div>
          </div>
        </section>
      )}

      {/* 2. OVERVIEW */}
      <section id="overview" className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 space-y-4">
        <span className="text-xs font-mono text-aurix-orange uppercase tracking-wider">
          {L.overviewEyebrow}
        </span>
        <h2 className="text-2xl sm:text-3xl font-display font-bold text-white tracking-tight">
          {L.overviewTitle}
        </h2>
        <div className="aurix-card rounded-2xl p-6 sm:p-8 space-y-4">
          <p className="text-slate-300 text-sm sm:text-base leading-relaxed">
            {event.description}
          </p>
          {event.participantRequirements && (
            <div className="p-4 rounded-lg bg-aurix-dark border border-aurix-border text-xs text-slate-300 space-y-1">
              <span className="font-mono text-aurix-orange uppercase font-semibold">
                {L.eligibilityLabel}
              </span>
              <p>{event.participantRequirements}</p>
            </div>
          )}
        </div>
      </section>

      {/* 3. CHALLENGE TRACKS (IF PRESENT) */}
      {event.tracks && event.tracks.length > 0 && (
        <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
          <div>
            <span className="text-xs font-mono text-aurix-orange uppercase tracking-wider">
              {L.tracksEyebrow}
            </span>
            <h2 className="text-2xl sm:text-3xl font-display font-bold text-white tracking-tight mt-1">
              {L.tracksTitle}
            </h2>
            <p className="text-slate-400 text-xs sm:text-sm mt-1">
              {L.tracksIntro}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {event.tracks.map((track) => (
              <div
                key={track.id}
                className="aurix-card rounded-xl p-6 flex flex-col justify-between space-y-4 group"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-xs font-mono">
                    <span className="px-2 py-0.5 rounded bg-aurix-dark text-aurix-orange font-bold border border-aurix-border">
                      {L.trackLabel} 0{track.number}
                    </span>
                  </div>
                  <h3 className="font-display font-bold text-white text-base group-hover:text-aurix-orange transition-colors">
                    {track.name}
                  </h3>
                  <p className="text-slate-400 text-xs leading-relaxed">
                    {track.mission}
                  </p>
                </div>

                {track.examples && track.examples.length > 0 && (
                  <div className="pt-3 border-t border-aurix-border/60 space-y-1.5">
                    <span className="text-[10px] font-mono text-slate-500 uppercase tracking-wider block">
                      {L.targetFocus}
                    </span>
                    <ul className="text-[11px] text-slate-300 space-y-1">
                      {track.examples.map((ex) => (
                        <li key={ex} className="flex items-start gap-1.5">
                          <span className="text-aurix-orange">•</span>
                          <span>{ex}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>
      )}

      {/* 4. COMPETITION ROUNDS */}
      {event.rounds && event.rounds.length > 0 && (
        <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
          <div>
            <span className="text-xs font-mono text-aurix-orange uppercase tracking-wider">
              {L.roundsEyebrow}
            </span>
            <h2 className="text-2xl sm:text-3xl font-display font-bold text-white tracking-tight mt-1">
              {L.roundsTitle}
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {event.rounds.map((round) => (
              <div
                key={round.id}
                className="aurix-card rounded-xl p-6 flex flex-col justify-between space-y-4"
              >
                <div className="space-y-3">
                  <span className="px-2 py-0.5 rounded bg-aurix-dark text-aurix-orange font-mono text-xs font-bold border border-aurix-border">
                    {L.roundLabel} 0{round.number}
                  </span>
                  <h3 className="font-display font-bold text-white text-lg">
                    {round.name}
                  </h3>
                  <p className="text-slate-400 text-xs leading-relaxed">
                    {round.description}
                  </p>
                </div>

                <div className="pt-4 border-t border-aurix-border/60 text-[11px] font-mono text-slate-400 space-y-1">
                  <div>
                    <span className="text-slate-500">{L.submissionLabel}</span> {round.submissionType}
                  </div>
                  {round.evaluationFormat && (
                    <div className="text-aurix-orange">
                      {round.evaluationFormat}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* 5. BUILD FLOW / SCHEDULE */}
      {event.schedule && event.schedule.length > 0 && (
        <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
          <div>
            <span className="text-xs font-mono text-aurix-orange uppercase tracking-wider">
              {L.scheduleEyebrow}
            </span>
            <h2 className="text-2xl sm:text-3xl font-display font-bold text-white tracking-tight mt-1">
              {L.scheduleTitle}
            </h2>
          </div>

          <div className="aurix-card rounded-2xl p-6 sm:p-8 space-y-4">
            <div className="divide-y divide-aurix-border/60">
              {event.schedule.map((item, idx) => (
                <div
                  key={item.timeLabel}
                  className="py-4 first:pt-0 last:pb-0 flex flex-col sm:flex-row sm:items-center justify-between gap-2"
                >
                  <div className="flex items-center gap-3">
                    <span className="w-8 h-8 rounded bg-aurix-dark border border-aurix-border text-aurix-orange font-mono text-xs font-bold flex items-center justify-center shrink-0">
                      0{idx + 1}
                    </span>
                    <div>
                      <h3 className="font-display font-bold text-white text-base">
                        {item.title}
                      </h3>
                      <p className="text-slate-400 text-xs">
                        {item.description}
                      </p>
                    </div>
                  </div>
                  <span className="font-mono text-xs text-aurix-orange font-semibold whitespace-nowrap pl-11 sm:pl-0">
                    {item.timeLabel}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* 6. JUDGING RUBRIC (IF PRESENT) */}
      {event.judgingCriteria && event.judgingCriteria.length > 0 && (
        <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
          <div>
            <span className="text-xs font-mono text-aurix-orange uppercase tracking-wider">
              {L.rubricEyebrow}
            </span>
            <h2 className="text-2xl sm:text-3xl font-display font-bold text-white tracking-tight mt-1">
              {L.rubricTitle}
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {event.judgingCriteria.map((crit) => (
              <div
                key={crit.id}
                className="aurix-card rounded-xl p-5 flex flex-col justify-between space-y-3"
              >
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-mono text-slate-400">{L.criterionLabel}</span>
                    <span className="text-sm font-mono font-bold text-aurix-orange">
                      {crit.maxScore} {L.marksLabel} {crit.weightPercent ? `(${crit.weightPercent}%)` : ''}
                    </span>
                  </div>
                  <h3 className="font-display font-bold text-white text-base">
                    {crit.name}
                  </h3>
                  <p className="text-slate-400 text-xs leading-relaxed">
                    {crit.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* 7. RULES SECTIONS */}
      {event.rulesSections && event.rulesSections.length > 0 && (
        <section id="rules" className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6 scroll-mt-24">
          <div>
            <span className="text-xs font-mono text-aurix-orange uppercase tracking-wider">
              {L.rulesEyebrow}
            </span>
            <h2 className="text-2xl sm:text-3xl font-display font-bold text-white tracking-tight mt-1">
              {L.rulesTitle}
            </h2>
          </div>

          <div className="space-y-6">
            {event.rulesSections.map((sec) => (
              <div
                key={sec.title}
                className="aurix-card rounded-2xl p-6 sm:p-8 space-y-4"
              >
                <h3 className="font-display font-bold text-white text-lg border-b border-aurix-border/60 pb-2">
                  {sec.title}
                </h3>
                <ul className="space-y-2 text-xs sm:text-sm text-slate-300">
                  {sec.rules.map((rule) => (
                    <li key={rule} className="flex items-start gap-2.5">
                      <CheckCircle2 className="w-4 h-4 text-aurix-orange shrink-0 mt-0.5" />
                      <span>{rule}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* 8. FAQS */}
      {event.faqs && event.faqs.length > 0 && (
        <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
          <div>
            <span className="text-xs font-mono text-aurix-orange uppercase tracking-wider">
              {L.faqEyebrow}
            </span>
            <h2 className="text-2xl sm:text-3xl font-display font-bold text-white tracking-tight mt-1">
              {L.faqTitle}
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {event.faqs.map((faq) => (
              <div
                key={faq.question}
                className="aurix-card rounded-xl p-6 space-y-2"
              >
                <div className="flex items-start gap-2">
                  <HelpCircle className="w-4 h-4 text-aurix-orange shrink-0 mt-0.5" />
                  <h3 className="font-display font-bold text-white text-sm">
                    {faq.question}
                  </h3>
                </div>
                <p className="text-slate-400 text-xs leading-relaxed pl-6">
                  {faq.answer}
                </p>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* 9. BOTTOM REGISTRATION CTA */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="aurix-card rounded-2xl p-8 sm:p-12 text-center space-y-6 bg-aurix-grid border-aurix-orange/60">
          <div className="max-w-2xl mx-auto space-y-3">
            <h2 className="text-2xl sm:text-4xl font-display font-extrabold text-white uppercase tracking-tight">
              {L.ctaTitle.replace(/\{name\}/g, event.shortName)}
            </h2>
            <p className="text-slate-300 text-xs sm:text-sm leading-relaxed">
              {L.ctaText}
            </p>
          </div>
          <div className="pt-2">
            {cta.disabled ? (
              <span className="px-8 py-3.5 rounded-lg bg-slate-800 text-slate-400 font-mono text-xs uppercase font-bold cursor-not-allowed">
                {cta.label}
              </span>
            ) : (
              <Link
                href={cta.href}
                className="inline-flex items-center gap-2 px-8 py-3.5 rounded-lg bg-aurix-orange text-black font-semibold text-xs font-mono uppercase tracking-wider hover:bg-orange-400 transition-colors shadow-lg"
              >
                {cta.label}
                <ArrowRight className="w-4 h-4" />
              </Link>
            )}
          </div>
        </div>
      </section>
    </article>
  )
}
