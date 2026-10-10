import { notFound } from 'next/navigation'
import { isPreview } from '@/lib/preview'
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
  FileUp,
} from 'lucide-react'
import { formatDateRange } from '@/lib/format'
import { formatINR } from '@/lib/format'
import { getEventLabels } from '@/lib/event-labels'
import { getFormTexts } from '@/lib/form-texts'
import { countdownWords, statusWord } from '@/lib/event-labels-defaults'
import { fill } from '@/lib/form-texts-defaults'
import { SUBMITTABLE, shownDeadline } from '@/lib/submission-rules'
import { getSponsorData, sponsorsForEvent } from '@/lib/sponsors'
import { HeroSponsors } from '@/components/aurix/HeroSponsors'
import { optimizedSrc } from '@/lib/img'
import { NO_CMS, cmsFor, cmsGlobal } from '@/lib/cms-attrs'

interface EventPageProps {
  event: GenericEvent
}

export async function EventPage({ event }: EventPageProps) {
  const [hidden, L, texts, sponsorData] = await Promise.all([getHiddenRoutes(), getEventLabels(), getFormTexts(), getSponsorData()])
  const allSponsors = sponsorData.sponsors
  // Sponsors strip (owner, 10 Oct 2026): Site settings → Sponsors (AURIX), "show on competition pages"
  const sponsors = sponsorsForEvent(allSponsors, event.id)
  const G = texts.general
  const isRouteVisible = (href: string) => isVisibleIn(hidden, href)
  // Hidden on the Page visibility screen: 404 (CMS editors in live preview still see it)
  const preview = await isPreview()
  if (!isRouteVisible(`/aurix/${event.slug}`) && !preview) notFound()
  // Live preview only: data-cms-* attributes tie the text to the Event's fields (e) and the shared Event pages labels (l)
  const e = preview && /^[0-9]+$/.test(String(event.id)) ? cmsFor(`events/${event.id}`) : NO_CMS
  const l = preview ? cmsGlobal('event-page-labels') : NO_CMS
  // Online submission round (Hackathon Round 1): its deadline gets a box. Before a planned reopening this is the early
  // close (owner, 9 Oct: "PPT submission 15 Oct"), afterwards the real end; the page refreshes every minute.
  const subIdx = (event.rounds || []).findIndex((r) => SUBMITTABLE.includes(String(r.submissionType)) && r.endDate)
  const subRound = subIdx >= 0 ? event.rounds![subIdx] : null
  const subDeadline = subRound ? shownDeadline(subRound) : null
  const subWhen = subDeadline
    ? new Date(subDeadline).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit', hour12: true, timeZone: 'Asia/Kolkata' }).replace(/\b(am|pm)\b/, (m) => m.toUpperCase())
    : ''
  const subField = subRound && subDeadline !== subRound.endDate ? 'pauseFrom' : 'endDate'

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
            { name: G.crumbHome, url: '/' },
            { name: G.crumbAurix, url: '/aurix' },
            { name: G.crumbCompetitions, url: '/aurix/competitions' },
            { name: event.title, url: `/aurix/${event.slug}` },
          ]}
        />
        <section className="relative pt-16 sm:pt-28 pb-20 px-4 sm:px-6 lg:px-8 border-b border-aurix-border bg-aurix-grid overflow-hidden">
          <div className="max-w-3xl mx-auto text-center space-y-6 relative z-10">
            <span className="inline-block px-3 py-1 rounded bg-aurix-dark border border-aurix-border text-xs font-mono text-aurix-orange uppercase font-bold tracking-wider">
              AURIX {event.edition}
            </span>
            <h1 className="text-4xl sm:text-6xl font-display font-extrabold text-white uppercase tracking-tight leading-none" {...e('title')}>
              {event.title}
            </h1>
            <p className="text-2xl sm:text-3xl font-display font-bold text-aurix-orange uppercase tracking-wider" {...l('comingSoonText')}>
              {L.comingSoonText}
            </p>
            {event.prizePool ? (
              <p className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-aurix-dark border border-aurix-border text-white font-mono font-bold">
                <Trophy className="w-4 h-4 text-aurix-orange" /> {L.comingSoonPrize} {formatINR(event.prizePool)}
              </p>
            ) : null}
            <p className="text-slate-300 text-sm sm:text-base leading-relaxed" {...e('description')}>{event.description}</p>
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
          { name: G.crumbHome, url: '/' },
          { name: G.crumbAurix, url: '/aurix' },
          { name: G.crumbCompetitions, url: '/aurix/competitions' },
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
                {L.statusLabel} {statusWord(L, event.status)}
              </span>
            </div>

            {/* Countdown Component */}
            <Countdown targetDate={event.startDate} label={L.countdownLabel} words={countdownWords(L)} />
          </div>

          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-display font-extrabold text-white tracking-tight uppercase leading-tight" {...e('title')}>
            {event.title}
          </h1>

          <p className="text-slate-300 text-sm sm:text-lg max-w-3xl leading-relaxed" {...e(event.shortDescription ? 'shortDescription' : 'description')}>
            {event.shortDescription || event.description}
          </p>

          {/* Quick Stats Strip */}
          <div className={`grid grid-cols-2 sm:grid-cols-3 ${subDeadline ? 'lg:grid-cols-6' : 'lg:grid-cols-5'} gap-4 pt-4`}>
            <div className="aurix-card rounded-xl p-4 space-y-1">
              <div className="flex items-center gap-2 text-slate-400 text-xs font-mono">
                <Calendar className="w-3.5 h-3.5 text-aurix-orange" />
                <span {...l('statDate')}>{L.statDate}</span>
              </div>
              <p className="text-white font-mono font-bold text-sm sm:text-base" {...e('startDate')}>
                {formatDateRange(event.startDate, event.endDate, 'short', texts.general)}
              </p>
            </div>

            <div className="aurix-card rounded-xl p-4 space-y-1">
              <div className="flex items-center gap-2 text-slate-400 text-xs font-mono">
                <MapPin className="w-3.5 h-3.5 text-aurix-orange" />
                <span {...l('statVenue')}>{L.statVenue}</span>
              </div>
              <p className="text-white font-mono font-bold text-sm sm:text-base truncate" {...e('venue')}>
                {event.venue || L.venueValue}
              </p>
            </div>

            <div className="aurix-card rounded-xl p-4 space-y-1">
              <div className="flex items-center gap-2 text-slate-400 text-xs font-mono">
                <Users className="w-3.5 h-3.5 text-aurix-orange" />
                <span {...l('statTeam')}>{L.statTeam}</span>
              </div>
              <p className="text-white font-mono font-bold text-sm sm:text-base" {...e('minTeamSize')}>
                {event.minTeamSize && event.maxTeamSize
                  ? event.minTeamSize === event.maxTeamSize
                    ? fill(L.teamExact, { count: event.minTeamSize })
                    : fill(L.teamRange, { min: event.minTeamSize, max: event.maxTeamSize })
                  : event.operatorCount
                  ? fill(L.teamOperator, { count: event.operatorCount })
                  : L.teamUnknown}
              </p>
            </div>

            <div className="aurix-card rounded-xl p-4 space-y-1">
              <div className="flex items-center gap-2 text-slate-400 text-xs font-mono">
                <Ticket className="w-3.5 h-3.5 text-aurix-orange" />
                <span {...l('statFee')}>{L.statFee}</span>
              </div>
              <p className="text-white font-mono font-bold text-sm sm:text-base" {...e('registrationFee')}>
                {event.registrationFee !== null ? `₹${event.registrationFee}${L.feeSuffix}` : L.unpriced}
              </p>
            </div>

            <div className="aurix-card rounded-xl p-4 space-y-1">
              <div className="flex items-center gap-2 text-slate-400 text-xs font-mono">
                <Trophy className="w-3.5 h-3.5 text-aurix-orange" />
                <span {...l('statPrize')}>{L.statPrize}</span>
              </div>
              <p className="text-white font-mono font-bold text-sm sm:text-base" {...e('prizePool')}>
                {event.prizePool ? formatINR(event.prizePool) : L.prizeTba}
              </p>
            </div>

            {subDeadline && (
              <div className="aurix-card rounded-xl p-4 space-y-1">
                <div className="flex items-center gap-2 text-slate-400 text-xs font-mono">
                  <FileUp className="w-3.5 h-3.5 text-aurix-orange" />
                  <span {...l('statSubmission')}>{L.statSubmission}</span>
                </div>
                <p className="text-white font-mono font-bold text-sm sm:text-base" {...e(`rounds.${subIdx}.${subField}`)}>
                  {subWhen}
                </p>
              </div>
            )}
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
             {...l('rulesButton')}>
              {L.rulesButton}
            </a>
            {event.mediaGalleryUrl && (
              <a
                href={event.mediaGalleryUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-6 py-3.5 rounded-lg bg-aurix-surface border border-aurix-orange/50 text-aurix-orange font-mono text-xs uppercase hover:bg-aurix-orange/10 transition-colors"
               {...l('footageButton')}>
                {L.footageButton}
              </a>
            )}
          </div>
          {/* Small sponsor logos: sponsors ticked for the hero, same competition choice as the strip */}
          <HeroSponsors sponsors={sponsors} label={sponsorData.heroLabel} align="start" preview={Boolean(preview)} />
        </div>
      </section>

      {/* SPECIAL DISCLOSURE NOTICE IF APPLICABLE */}
      {event.specialNotice && (
        <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="p-5 rounded-xl bg-orange-950/40 border border-aurix-orange/60 flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-aurix-orange shrink-0 mt-0.5" />
            <div className="space-y-1 text-xs sm:text-sm">
              <span className="font-mono text-aurix-orange font-bold uppercase tracking-wider block" {...(event.noticeTitle ? e('noticeTitle') : l('noticeTitle'))}>
                {event.noticeTitle || L.noticeTitle}
              </span>
              <p className="text-slate-300 leading-relaxed" {...e('specialNotice')}>
                {event.specialNotice}
              </p>
            </div>
          </div>
        </section>
      )}

      {/* SPONSORS STRIP (Site settings → Sponsors (AURIX)) */}
      {sponsors.length > 0 && (
        <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8" aria-label={L.sponsorsTitle}>
          <div className="aurix-card rounded-xl px-5 py-4 flex flex-col sm:flex-row items-center gap-4 sm:gap-8">
            <span className="text-xs font-mono uppercase tracking-wider text-slate-400 shrink-0" {...l('sponsorsTitle')}>
              {L.sponsorsTitle}
            </span>
            <ul className="flex flex-wrap items-center justify-center sm:justify-start gap-x-10 gap-y-4">
              {sponsors.map((s, i) => {
                const g = preview ? cmsGlobal('site-settings') : NO_CMS
                const inner = (
                  <span className="flex flex-col items-center sm:items-start gap-1.5">
                    {s.label && <span className="text-[10px] font-mono uppercase tracking-widest text-aurix-orange">{s.label}</span>}
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={optimizedSrc(s.logo, 384)} alt={s.name} className="h-7 sm:h-8 w-auto max-w-[180px] object-contain" loading="lazy" {...g(`sponsors.${s.index}.logo`)} />
                  </span>
                )
                return (
                  <li key={`${s.name}-${i}`}>
                    {s.url ? (
                      <a href={s.url} target="_blank" rel="sponsored noopener noreferrer" className="block opacity-90 hover:opacity-100 transition-opacity">
                        {inner}
                      </a>
                    ) : (
                      inner
                    )}
                  </li>
                )
              })}
            </ul>
          </div>
        </section>
      )}

      {/* 2. OVERVIEW */}
      <section id="overview" className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 space-y-4">
        <span className="text-xs font-mono text-aurix-orange uppercase tracking-wider" {...l('overviewEyebrow')}>
          {L.overviewEyebrow}
        </span>
        <h2 className="text-2xl sm:text-3xl font-display font-bold text-white tracking-tight" {...l('overviewTitle')}>
          {L.overviewTitle}
        </h2>
        <div className="aurix-card rounded-2xl p-6 sm:p-8 space-y-4">
          <p className="text-slate-300 text-sm sm:text-base leading-relaxed" {...e('description')}>
            {event.description}
          </p>
          {event.participantRequirements && (
            <div className="p-4 rounded-lg bg-aurix-dark border border-aurix-border text-xs text-slate-300 space-y-1">
              <span className="font-mono text-aurix-orange uppercase font-semibold" {...l('eligibilityLabel')}>
                {L.eligibilityLabel}
              </span>
              <p {...e('participantRequirements')}>{event.participantRequirements}</p>
            </div>
          )}
        </div>
      </section>

      {/* 3. CHALLENGE TRACKS (IF PRESENT) */}
      {event.tracks && event.tracks.length > 0 && (
        <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
          <div>
            <span className="text-xs font-mono text-aurix-orange uppercase tracking-wider" {...l('tracksEyebrow')}>
              {L.tracksEyebrow}
            </span>
            <h2 className="text-2xl sm:text-3xl font-display font-bold text-white tracking-tight mt-1" {...l('tracksTitle')}>
              {L.tracksTitle}
            </h2>
            <p className="text-slate-400 text-xs sm:text-sm mt-1" {...l('tracksIntro')}>
              {L.tracksIntro}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {event.tracks.map((track, ti) => (
              <div
                key={track.id}
                {...e(`tracks.${ti}`)}
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
                    <span className="text-[10px] font-mono text-slate-500 uppercase tracking-wider block" {...l('targetFocus')}>
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
            <span className="text-xs font-mono text-aurix-orange uppercase tracking-wider" {...l('roundsEyebrow')}>
              {L.roundsEyebrow}
            </span>
            <h2 className="text-2xl sm:text-3xl font-display font-bold text-white tracking-tight mt-1" {...l('roundsTitle')}>
              {L.roundsTitle}
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {event.rounds.map((round, oi) => (
              <div
                key={round.id}
                {...e(`rounds.${oi}`)}
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
                    <span className="text-slate-500" {...l('submissionLabel')}>{L.submissionLabel}</span> {round.submissionType}
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
            <span className="text-xs font-mono text-aurix-orange uppercase tracking-wider" {...l('scheduleEyebrow')}>
              {L.scheduleEyebrow}
            </span>
            <h2 className="text-2xl sm:text-3xl font-display font-bold text-white tracking-tight mt-1" {...l('scheduleTitle')}>
              {L.scheduleTitle}
            </h2>
          </div>

          <div className="aurix-card rounded-2xl p-6 sm:p-8 space-y-4">
            <div className="divide-y divide-aurix-border/60">
              {event.schedule.map((item, idx) => (
                <div
                  key={item.timeLabel}
                  {...e(`schedule.${idx}`)}
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
            <span className="text-xs font-mono text-aurix-orange uppercase tracking-wider" {...l('rubricEyebrow')}>
              {L.rubricEyebrow}
            </span>
            <h2 className="text-2xl sm:text-3xl font-display font-bold text-white tracking-tight mt-1" {...l('rubricTitle')}>
              {L.rubricTitle}
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {event.judgingCriteria.map((crit, ci) => (
              <div
                key={crit.id}
                {...e(`judgingCriteria.${ci}`)}
                className="aurix-card rounded-xl p-5 flex flex-col justify-between space-y-3"
              >
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-mono text-slate-400" {...l('criterionLabel')}>{L.criterionLabel}</span>
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
            <span className="text-xs font-mono text-aurix-orange uppercase tracking-wider" {...l('rulesEyebrow')}>
              {L.rulesEyebrow}
            </span>
            <h2 className="text-2xl sm:text-3xl font-display font-bold text-white tracking-tight mt-1" {...l('rulesTitle')}>
              {L.rulesTitle}
            </h2>
          </div>

          <div className="space-y-6">
            {event.rulesSections.map((sec, si) => (
              <div
                key={sec.title}
                {...e(`rulesSections.${si}`)}
                className="aurix-card rounded-2xl p-6 sm:p-8 space-y-4"
              >
                <h3 className="font-display font-bold text-white text-lg border-b border-aurix-border/60 pb-2">
                  {sec.title}
                </h3>
                <ul className="space-y-2 text-xs sm:text-sm text-slate-300">
                  {sec.rules.map((rule, ri) => (
                    <li key={rule} className="flex items-start gap-2.5" {...e(`rulesSections.${si}.rules.${ri}.rule`)}>
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
            <span className="text-xs font-mono text-aurix-orange uppercase tracking-wider" {...l('faqEyebrow')}>
              {L.faqEyebrow}
            </span>
            <h2 className="text-2xl sm:text-3xl font-display font-bold text-white tracking-tight mt-1" {...l('faqTitle')}>
              {L.faqTitle}
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {event.faqs.map((faq, fi) => (
              <div
                key={faq.question}
                {...e(`faqs.${fi}`)}
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
            <p className="text-slate-300 text-xs sm:text-sm leading-relaxed" {...l('ctaText')}>
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
