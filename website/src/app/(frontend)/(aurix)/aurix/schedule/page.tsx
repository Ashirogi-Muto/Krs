import React from 'react'
import Link from 'next/link'
import { constructMetadata } from '@/lib/seo/metadata'
import { BreadcrumbsJsonLd } from '@/lib/seo/structured-data'
import { Calendar, Clock, MapPin } from 'lucide-react'
import { getAurixSchedule } from '@/lib/data/schedule'
import { getEventsBySeries } from '@/lib/data/events'

export const metadata = constructMetadata({
  title: 'Master Tournament Schedule | AURIX 2026',
  description: 'Event-day schedule and official dates for AURIX 2026 competitions at IILM University, Greater Noida.',
  path: '/aurix/schedule',
})

export const revalidate = 60

const dayLabel = (iso: string) =>
  new Date(iso).toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric', timeZone: 'Asia/Kolkata' })
const dateRange = (start: string, end: string) => {
  const f = (iso: string) => new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'Asia/Kolkata' })
  if (!start) return 'Dates to be announced'
  return end && f(end) !== f(start) ? `${f(start)} – ${f(end)}` : f(start)
}

export default async function SchedulePage() {
  // Timeline from the CMS (AURIX Schedule); until it is filled in, only the official event dates are shown
  const [{ intro, days }, events] = await Promise.all([getAurixSchedule(), getEventsBySeries('AURIX')])

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16 space-y-12">
      <BreadcrumbsJsonLd
        items={[
          { name: 'Home', url: '/' },
          { name: 'AURIX', url: '/aurix' },
          { name: 'Schedule', url: '/aurix/schedule' },
        ]}
      />

      <div className="space-y-4">
        <span className="text-xs font-mono text-aurix-orange uppercase tracking-wider">
          Master Timeline // AURIX 2026
        </span>
        <h1 className="text-3xl sm:text-5xl font-display font-extrabold text-white tracking-tight">
          Tournament Schedule
        </h1>
        <p className="text-slate-400 text-sm sm:text-base max-w-2xl leading-relaxed">
          {intro || 'Event-day timings for AURIX 2026 at IILM University, Greater Noida.'}
        </p>
      </div>

      {days.length === 0 && (
        <section className="space-y-4">
          <p className="text-slate-400 text-sm">Detailed timings will be published here. Official event dates:</p>
          <div className="grid gap-4 sm:grid-cols-2">
            {events.map((ev) => (
              <Link key={ev.id} href={`/aurix/${ev.slug}`} className="aurix-card rounded-xl p-5 space-y-1.5 hover:border-aurix-orange transition-colors">
                <h2 className="font-display font-bold text-white text-base">{ev.title}</h2>
                <p className="text-xs font-mono text-slate-400 flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-aurix-orange" />
                  {dateRange(ev.startDate, ev.endDate)}
                </p>
                {ev.venue && (
                  <p className="text-xs font-mono text-slate-400 flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-slate-500" />
                    {ev.venue}
                  </p>
                )}
              </Link>
            ))}
          </div>
        </section>
      )}

      <div className="space-y-12">
        {days.map((day) => (
          <section key={day.date} className="space-y-6">
            <div className="border-b border-aurix-border pb-3 flex flex-col sm:flex-row sm:items-baseline justify-between gap-1">
              <h2 className="text-xl sm:text-2xl font-display font-bold text-white">{dayLabel(day.date)}</h2>
              {day.title && <span className="text-xs font-mono text-aurix-orange">{day.title}</span>}
            </div>

            <div className="space-y-4">
              {day.items.map((ev, idx) => (
                <div
                  key={`${ev.time}-${idx}`}
                  className="aurix-card rounded-xl p-5 flex flex-col sm:flex-row sm:items-start justify-between gap-4"
                >
                  <div className="space-y-1.5 flex-1">
                    {(ev.tag || ev.location) && (
                      <div className="flex flex-wrap items-center gap-2 text-xs font-mono">
                        {ev.tag &&
                          (ev.eventSlug ? (
                            <Link href={`/aurix/${ev.eventSlug}`} className="px-2 py-0.5 rounded bg-aurix-dark text-aurix-orange border border-aurix-border font-bold hover:border-aurix-orange">
                              {ev.tag}
                            </Link>
                          ) : (
                            <span className="px-2 py-0.5 rounded bg-aurix-dark text-aurix-orange border border-aurix-border font-bold">{ev.tag}</span>
                          ))}
                        {ev.location && (
                          <span className="text-slate-400 flex items-center gap-1">
                            <MapPin className="w-3 h-3 text-slate-500" />
                            {ev.location}
                          </span>
                        )}
                      </div>
                    )}

                    <h3 className="font-display font-bold text-white text-base">{ev.title}</h3>

                    {ev.description && <p className="text-slate-400 text-xs leading-relaxed">{ev.description}</p>}
                  </div>

                  <div className="shrink-0 text-left sm:text-right">
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded bg-aurix-dark border border-aurix-border text-xs font-mono font-bold text-white">
                      <Clock className="w-3.5 h-3.5 text-aurix-orange" />
                      {ev.time}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </section>
        ))}
      </div>
    </div>
  )
}
