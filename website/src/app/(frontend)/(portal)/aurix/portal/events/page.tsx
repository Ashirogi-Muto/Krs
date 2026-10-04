import React from 'react'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { getPayload } from 'payload'
import config from '@payload-config'
import { getSessionUser } from '@/lib/auth/session'
import { requireVisibleRoute } from '@/lib/visibility-guard'
import { formatDateRange, formatFee } from '@/lib/format'
import { getPortalTexts } from '@/lib/portal-texts'
import {
  Calendar,
  Clock,
  MapPin,
  ArrowRight,
  AlertTriangle,
  FileText,
  KeyRound,
  ShieldAlert,
} from 'lucide-react'

export const dynamic = 'force-dynamic'

export const metadata = {
  title: 'My Events | AURIX Participant Portal',
  robots: {
    index: false,
    follow: false,
    nocache: true,
  },
}

export default async function PortalEventsPage() {
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

  // Extract unique claimed events
  const eventMap = new Map<number | string, any>()
  for (const reg of regResult.docs || []) {
    if (reg.event && typeof reg.event === 'object' && reg.event.id) {
      if (!eventMap.has(reg.event.id)) {
        eventMap.set(reg.event.id, reg.event)
      }
    }
  }

  const events = Array.from(eventMap.values())
  const t = (await getPortalTexts()).events

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="space-y-2 border-b border-aurix-border pb-6">
        <span className="text-xs font-mono text-aurix-orange uppercase tracking-wider">
          {t.eyebrow}
        </span>
        <h1 className="text-2xl sm:text-4xl font-display font-extrabold text-white">
          {t.title}
        </h1>
        <p className="text-slate-400 text-xs sm:text-sm font-mono">
          {t.intro}
        </p>
      </div>

      {events.length === 0 ? (
        <div className="aurix-card rounded-2xl p-8 sm:p-12 text-center space-y-5 border-aurix-border">
          <div className="w-14 h-14 rounded-2xl bg-aurix-dark border border-aurix-border flex items-center justify-center text-aurix-orange mx-auto">
            <Calendar className="w-7 h-7" />
          </div>
          <div className="space-y-1 max-w-md mx-auto">
            <h2 className="text-xl font-display font-bold text-white">
              {t.emptyTitle}
            </h2>
            <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
              {t.emptyText}
            </p>
          </div>
          <div className="pt-2">
            <Link
              href="/aurix/portal/claim"
              className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-lg bg-aurix-orange text-black font-semibold text-xs font-mono uppercase tracking-wider hover:bg-orange-400 transition-colors"
            >
              <KeyRound className="w-4 h-4" /> {t.emptyButton}
            </Link>
          </div>
        </div>
      ) : (
        <div className="space-y-8">
          {events.map((ev) => {
            const dateStr = ev.startDate ? formatDateRange(ev.startDate, ev.endDate) : t.dateTba
            const schedule = Array.isArray(ev.schedule) ? ev.schedule : []

            return (
              <div
                key={ev.id}
                className="aurix-card rounded-2xl p-6 sm:p-8 space-y-6 border-aurix-border"
              >
                {/* Event Title Strip */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-aurix-border/60 pb-5">
                  <div className="space-y-2">
                    <div className="flex flex-wrap items-center gap-2 text-xs font-mono">
                      <span className="px-2.5 py-0.5 rounded bg-aurix-dark text-aurix-orange font-bold border border-aurix-border">
                        {ev.eventType || 'COMPETITION'}
                      </span>
                      <span className="text-slate-400 flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5 text-slate-500" /> {dateStr}
                      </span>
                      {ev.venue && (
                        <span className="text-slate-400 flex items-center gap-1">
                          <MapPin className="w-3.5 h-3.5 text-slate-500" /> {ev.venue}
                        </span>
                      )}
                    </div>
                    <h2 className="font-display font-bold text-white text-xl sm:text-2xl">
                      {ev.title}
                    </h2>
                    {ev.shortDescription && (
                      <p className="text-slate-400 text-xs sm:text-sm leading-relaxed max-w-3xl">
                        {ev.shortDescription}
                      </p>
                    )}
                  </div>

                  {ev.slug && (
                    <Link
                      href={`/aurix/${ev.slug}`}
                      className="px-5 py-2.5 rounded-lg bg-aurix-dark border border-aurix-border text-slate-300 font-mono text-xs uppercase text-center hover:text-white hover:border-aurix-orange transition-colors shrink-0"
                    >
                      {t.rulebookButton}
                    </Link>
                  )}
                </div>

                {/* Special Notice from CMS */}
                {ev.specialNotice && (
                  <div className="p-4 rounded-xl bg-orange-950/30 border border-orange-800/60 flex items-start gap-3 text-xs">
                    <AlertTriangle className="w-4 h-4 text-aurix-orange shrink-0 mt-0.5" />
                    <div>
                      <span className="font-bold text-orange-200 block uppercase font-mono text-[11px]">
                        {t.noticeTitle}
                      </span>
                      <p className="text-orange-300/90 leading-relaxed mt-0.5">
                        {ev.specialNotice}
                      </p>
                    </div>
                  </div>
                )}

                {/* Reporting Requirements from CMS */}
                {ev.participantRequirements && (
                  <div className="p-4 rounded-xl bg-aurix-dark/70 border border-aurix-border/70 space-y-1.5 text-xs">
                    <span className="font-mono uppercase font-bold text-aurix-orange text-[11px] block">
                      {t.requirementsTitle}
                    </span>
                    <p className="text-slate-300 leading-relaxed">
                      {ev.participantRequirements}
                    </p>
                  </div>
                )}

                {/* Official Schedule from CMS */}
                <div className="space-y-3">
                  <h3 className="font-mono text-xs uppercase tracking-wider text-slate-400 font-bold flex items-center gap-2">
                    <Clock className="w-4 h-4 text-aurix-orange" /> {t.scheduleTitle}
                  </h3>

                  {schedule.length > 0 ? (
                    <div className="divide-y divide-aurix-border/50 border border-aurix-border/60 rounded-xl overflow-hidden bg-aurix-dark/40">
                      {schedule.map((item: any, i: number) => (
                        <div
                          key={i}
                          className="p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs font-mono"
                        >
                          <div className="space-y-0.5">
                            <span className="font-bold text-white text-sm block">
                              {item.title}
                            </span>
                            {item.description && (
                              <p className="text-slate-400 text-xs font-sans">
                                {item.description}
                              </p>
                            )}
                          </div>

                          <div className="text-left sm:text-right shrink-0 space-y-0.5">
                            <span className="text-aurix-orange font-bold block">
                              {item.timeLabel}
                            </span>
                            {item.location && (
                              <span className="text-slate-400 text-[11px] block">
                                {item.location}
                              </span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="p-4 rounded-xl bg-aurix-dark/40 border border-aurix-border/40 text-xs font-mono text-slate-400">
                      {t.scheduleEmpty}
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
