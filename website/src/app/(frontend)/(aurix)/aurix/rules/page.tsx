import React from 'react'
import Link from 'next/link'
import { constructMetadata } from '@/lib/seo/metadata'
import { BreadcrumbsJsonLd } from '@/lib/seo/structured-data'
import { getAllEvents } from '@/lib/data/events'
import { Shield, CheckCircle2, FileText, ExternalLink } from 'lucide-react'

// Re-read event data from the CMS at most once a minute
export const revalidate = 60

export const metadata = constructMetadata({
  title: 'Official Technical Rulebooks | AURIX 2026',
  description:
    'Crawlable technical rulebooks, robot dimension constraints, generative AI policies, and safety protocols for all AURIX 2026 competitions.',
  path: '/aurix/rules',
})

export default async function RulesCentralPage() {
  const events = await getAllEvents()
  const aurixEvents = events.filter((e) => e.series === 'AURIX')

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16 space-y-12">
      <BreadcrumbsJsonLd
        items={[
          { name: 'Home', url: '/' },
          { name: 'AURIX', url: '/aurix' },
          { name: 'Rules', url: '/aurix/rules' },
        ]}
      />

      <div className="space-y-4">
        <span className="text-xs font-mono text-aurix-orange uppercase tracking-wider">
          Technical Specifications & Policies // AURIX 2026
        </span>
        <h1 className="text-3xl sm:text-5xl font-display font-extrabold text-white tracking-tight">
          Official Tournament Rulebooks
        </h1>
        <p className="text-slate-400 text-sm sm:text-base max-w-2xl leading-relaxed">
          Comprehensive, crawlable technical rules governing vehicle dimensions, power safety, software repositories, team compositions, and AI disclosure.
        </p>
      </div>

      <div className="space-y-16">
        {aurixEvents.map((ev) => (
          <section key={ev.id} id={ev.slug} className="aurix-card rounded-2xl p-6 sm:p-10 space-y-8 scroll-mt-24">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-aurix-border/60 pb-6">
              <div>
                <span className="text-xs font-mono text-aurix-orange uppercase font-bold tracking-wider">
                  Rulebook // {ev.eventType}
                </span>
                <h2 className="text-2xl sm:text-3xl font-display font-bold text-white tracking-tight mt-1">
                  {ev.title}
                </h2>
              </div>
              <Link
                href={`/aurix/${ev.slug}`}
                className="self-start sm:self-auto px-4 py-2 rounded bg-aurix-dark border border-aurix-border text-aurix-orange text-xs font-mono uppercase font-semibold hover:border-aurix-orange transition-colors"
              >
                View Full Event Page
              </Link>
            </div>

            {/* Quick Specs Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs font-mono">
              <div className="p-3 rounded bg-aurix-dark border border-aurix-border">
                <span className="text-slate-500 block uppercase">Fee</span>
                <span className="text-white font-bold">
                  {ev.registrationFee !== null ? `₹${ev.registrationFee}` : 'Unpriced'}
                </span>
              </div>
              <div className="p-3 rounded bg-aurix-dark border border-aurix-border">
                <span className="text-slate-500 block uppercase">Team Size</span>
                <span className="text-white font-bold">
                  {ev.minTeamSize && ev.maxTeamSize
                    ? ev.minTeamSize === ev.maxTeamSize
                      ? `${ev.minTeamSize} Members`
                      : `${ev.minTeamSize}–${ev.maxTeamSize} Members`
                    : ev.operatorCount
                    ? `${ev.operatorCount} Operator`
                    : 'Team Entry'}
                </span>
              </div>
              <div className="p-3 rounded bg-aurix-dark border border-aurix-border">
                <span className="text-slate-500 block uppercase">Dates</span>
                <span className="text-white font-bold">29–30 Oct 2026</span>
              </div>
              <div className="p-3 rounded bg-aurix-dark border border-aurix-border">
                <span className="text-slate-500 block uppercase">Version</span>
                <span className="text-aurix-orange font-bold">v1.0 (Official)</span>
              </div>
            </div>

            {/* Special Notice if applicable */}
            {ev.specialNotice && (
              <div className="p-4 rounded-xl bg-orange-950/30 border border-aurix-orange/50 text-xs text-slate-300">
                <strong className="text-aurix-orange font-mono uppercase mr-2">Notice:</strong>
                {ev.specialNotice}
              </div>
            )}

            {/* Detailed Rule Sections */}
            {ev.rulesSections && ev.rulesSections.length > 0 && (
              <div className="space-y-6">
                {ev.rulesSections.map((sec) => (
                  <div key={sec.title} className="space-y-3">
                    <h3 className="font-display font-semibold text-white text-base">
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
            )}
          </section>
        ))}
      </div>
    </div>
  )
}
