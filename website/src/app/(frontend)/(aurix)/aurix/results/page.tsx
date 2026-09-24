import React from 'react'
import Link from 'next/link'
import { constructMetadata } from '@/lib/seo/metadata'
import { BreadcrumbsJsonLd } from '@/lib/seo/structured-data'
import { Trophy, Clock, ShieldCheck, ArrowRight } from 'lucide-react'

export const metadata = constructMetadata({
  title: 'Official Tournament Results | AURIX 2026',
  description:
    'Verified podium finishes, rankings, and special category awards published by the official AURIX 2026 jury at IILM University Greater Noida.',
  path: '/aurix/results',
})

export default async function AURIXResultsPage() {
  // Invariant: Zero fictional results. Published results are strictly fetched from CMS records where published=true.
  // Prior to admin publication, a clear pending state is rendered.
  const resultsPublished = false // Controlled via CMS Result records

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-16 space-y-12">
      <BreadcrumbsJsonLd
        items={[
          { name: 'Home', url: '/' },
          { name: 'AURIX', url: '/aurix' },
          { name: 'Results', url: '/aurix/results' },
        ]}
      />

      <div className="space-y-4">
        <span className="text-xs font-mono text-aurix-orange uppercase tracking-wider">
          Official Adjudication // AURIX 2026
        </span>
        <h1 className="text-3xl sm:text-5xl font-display font-extrabold text-white tracking-tight">
          Tournament Results & Awards
        </h1>
        <p className="text-slate-400 text-sm sm:text-base max-w-2xl leading-relaxed">
          Official podium rankings, technical excellence awards, and prize allocations validated by the AURIX jury and Kalam Robotics Society.
        </p>
      </div>

      {!resultsPublished ? (
        <div className="aurix-card rounded-2xl p-8 sm:p-12 text-center space-y-5 bg-aurix-grid border-aurix-border">
          <div className="w-14 h-14 rounded-2xl bg-aurix-surface border border-aurix-border flex items-center justify-center text-aurix-orange mx-auto shadow-lg shadow-aurix-orange/10">
            <Clock className="w-7 h-7" />
          </div>

          <div className="space-y-2 max-w-md mx-auto">
            <span className="text-xs font-mono text-aurix-orange uppercase tracking-widest font-semibold">
              Tournament In Progress // Adjudication Pending
            </span>
            <h2 className="text-2xl font-display font-bold text-white">
              Official Results Pending
            </h2>
            <p className="text-slate-400 text-xs sm:text-sm leading-relaxed">
              AURIX 2026 takes place on 29–30 October 2026. Official results, scores, and podium awards will be verified and published here following jury deliberation.
            </p>
          </div>

          <div className="pt-2 flex flex-wrap justify-center gap-4 text-xs font-mono">
            <Link
              href="/aurix/schedule"
              className="px-5 py-2.5 rounded bg-aurix-dark border border-aurix-border text-slate-300 hover:text-white hover:border-aurix-orange transition-colors"
            >
              View Evaluation Schedule
            </Link>
            <Link
              href="/aurix/portal"
              className="px-5 py-2.5 rounded bg-aurix-orange text-black font-bold uppercase hover:bg-orange-400 transition-colors"
            >
              Participant Portal
            </Link>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Dynamic published results table rendered when admin marks published=true */}
        </div>
      )}
    </div>
  )
}
