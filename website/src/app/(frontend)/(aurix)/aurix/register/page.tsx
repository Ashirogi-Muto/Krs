import React from 'react'
import Link from 'next/link'
import { ArrowRight, Users, IndianRupee, Calendar } from 'lucide-react'
import { getEventsBySeries } from '@/lib/data/events'
import { constructMetadata } from '@/lib/seo/metadata'

// Re-read event data from the CMS at most once a minute
export const revalidate = 60

export const metadata = constructMetadata({
  title: 'Register | AURIX 2026',
  description: 'Register your team for AURIX 2026 competitions at IILM University, Greater Noida.',
  path: '/aurix/register',
})

const teamLabel = (min: number | null, max: number | null) =>
  min && max ? (min === max ? `${min} members` : `${min}–${max} members`) : 'Team entry'

export default async function RegisterPage() {
  const events = (await getEventsBySeries('AURIX')).filter(
    (e) => !e.comingSoon && e.status === 'REGISTRATION_OPEN'
  )

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-20 space-y-10">
      <div className="space-y-4 text-center">
        <span className="text-xs font-mono text-aurix-orange uppercase tracking-wider">AURIX 2026 // Registration</span>
        <h1 className="text-3xl sm:text-5xl font-display font-extrabold text-white tracking-tight">Register Your Team</h1>
        <p className="text-slate-300 text-sm sm:text-base max-w-2xl mx-auto leading-relaxed">
          Online team registration opens shortly on this page. Review the rules and team sizes for each
          competition below so your team is ready.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {events.map((ev) => (
          <div key={ev.id} className="aurix-card rounded-2xl p-6 space-y-4 flex flex-col justify-between">
            <div className="space-y-3">
              <h2 className="font-display font-bold text-white text-xl">{ev.title}</h2>
              <div className="flex flex-wrap gap-x-5 gap-y-1 text-xs font-mono text-slate-300">
                <span className="inline-flex items-center gap-1.5">
                  <IndianRupee className="w-3.5 h-3.5 text-aurix-orange" />
                  {ev.registrationFee !== null ? `₹${ev.registrationFee} / team` : 'Fee to be announced'}
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <Users className="w-3.5 h-3.5 text-aurix-orange" />
                  {teamLabel(ev.minTeamSize, ev.maxTeamSize)}
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-aurix-orange" />
                  {new Date(ev.startDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', timeZone: 'Asia/Kolkata' })}
                  {' – '}
                  {new Date(ev.endDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'Asia/Kolkata' })}
                </span>
              </div>
              <p className="text-slate-400 text-sm leading-relaxed">{ev.shortDescription}</p>
            </div>
            <div className="flex items-center justify-between pt-3 border-t border-aurix-border/60">
              <span className="text-xs font-mono text-slate-400 uppercase">Registration opening soon</span>
              <Link
                href={`/aurix/${ev.slug}`}
                className="inline-flex items-center gap-1.5 text-xs font-mono font-bold text-aurix-orange hover:underline"
              >
                Rules &amp; details <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
