import React from 'react'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { getPayload } from 'payload'
import config from '@payload-config'
import { getSessionUser } from '@/lib/auth/session'
import { requireVisibleRoute } from '@/lib/visibility-guard'
import { Trophy, Clock, ArrowRight, KeyRound } from 'lucide-react'

export const dynamic = 'force-dynamic'

export const metadata = {
  title: 'Results | AURIX Participant Portal',
  robots: {
    index: false,
    follow: false,
    nocache: true,
  },
}

export default async function PortalResultsPage() {
  await requireVisibleRoute('/aurix/portal')
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

  // Check if any claimed event has resultsPublished === true
  const publishedEvents: any[] = []
  for (const reg of regResult.docs || []) {
    const ev = reg.event
    if (ev && typeof ev === 'object' && 'resultsPublished' in ev && ev.resultsPublished) {
      if (!publishedEvents.some((e) => e.id === (ev as { id: number | string }).id)) {
        publishedEvents.push(ev)
      }
    }
  }

  return (
    <div className="space-y-8 max-w-4xl">
      {/* Header */}
      <div className="space-y-2 border-b border-aurix-border pb-6">
        <span className="text-xs font-mono text-aurix-orange uppercase tracking-wider">
          Adjudication // Scorecards & Standings
        </span>
        <h1 className="text-2xl sm:text-4xl font-display font-extrabold text-white">
          Competition Results & Standings
        </h1>
        <p className="text-slate-400 text-xs sm:text-sm font-mono">
          Official jury scores, mentor feedback, and tournament standings.
        </p>
      </div>

      {publishedEvents.length === 0 ? (
        <div className="aurix-card rounded-2xl p-8 sm:p-12 text-center space-y-5 border-aurix-border">
          <div className="w-14 h-14 rounded-2xl bg-aurix-dark border border-aurix-border flex items-center justify-center text-aurix-orange mx-auto">
            <Clock className="w-7 h-7" />
          </div>

          <div className="space-y-1 max-w-md mx-auto">
            <h2 className="text-xl font-display font-bold text-white">
              Results Pending Adjudication
            </h2>
            <p className="text-slate-400 text-xs sm:text-sm leading-relaxed">
              Official scorecards, jury evaluations, and podium standings will appear here once the judging process for your registered competitions concludes and results are published by tournament organizers.
            </p>
          </div>

          <div className="pt-2">
            <Link
              href="/aurix/portal"
              className="inline-flex items-center gap-2 px-6 py-2.5 rounded-lg bg-aurix-dark border border-aurix-border text-slate-300 font-mono text-xs uppercase hover:text-white hover:border-aurix-orange transition-colors"
            >
              Back to Dashboard <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          {publishedEvents.map((ev) => (
            <div key={ev.id} className="aurix-card rounded-2xl p-6 sm:p-8 space-y-4">
              <h2 className="font-display font-bold text-white text-xl">{ev.title}</h2>
              <p className="text-sm text-slate-300">
                Official results published. Visit the event details page for detailed tournament announcements.
              </p>
              <Link
                href={`/aurix/${ev.slug}`}
                className="inline-flex items-center gap-1.5 text-xs font-mono text-aurix-orange hover:underline"
              >
                View Event Page →
              </Link>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
