import React from 'react'
import { Bell, AlertCircle, Info, Calendar } from 'lucide-react'

const ANNOUNCEMENTS = [
  {
    id: 'ann-1',
    title: 'Round 1 Proposal Screening Window Now Active',
    priority: 'HIGH',
    audience: 'EVENT_PARTICIPANTS',
    date: '20 September 2026',
    content:
      'All registered teams for the KRS Robotics & AI Hackathon 2026 can now submit their initial architecture proposals, system block diagrams, and hardware requirements via the Submissions tab. Proposal lock is scheduled for 20 October 2026 at 23:59 IST.',
  },
  {
    id: 'ann-2',
    title: 'Lab Workbench Hardware Guidelines Released',
    priority: 'NORMAL',
    audience: 'ALL',
    date: '15 September 2026',
    content:
      'The organizing committee has published laboratory safety rules, power rail constraints, and approved soldering station protocols for on-site prototyping at IILM University Greater Noida.',
  },
]

export default function PortalAnnouncementsPage() {
  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="space-y-2 border-b border-aurix-border pb-6">
        <span className="text-xs font-mono text-aurix-orange uppercase tracking-wider">
          Telemetry & Bulletins // Announcements
        </span>
        <h1 className="text-2xl sm:text-4xl font-display font-extrabold text-white">
          Official Tournament Bulletins
        </h1>
        <p className="text-slate-400 text-xs sm:text-sm font-mono">
          Real-time updates, schedule adjustments, and mentor feedback notices.
        </p>
      </div>

      <div className="space-y-6">
        {ANNOUNCEMENTS.map((ann) => (
          <div
            key={ann.id}
            className="aurix-card rounded-2xl p-6 sm:p-8 space-y-4 border-aurix-border"
          >
            <div className="flex flex-wrap items-center justify-between gap-2 text-xs font-mono">
              <span
                className={`px-2.5 py-0.5 rounded uppercase font-bold text-[10px] ${
                  ann.priority === 'HIGH'
                    ? 'bg-red-950/60 border border-red-800 text-red-400'
                    : 'bg-aurix-dark border border-aurix-border text-aurix-orange'
                }`}
              >
                {ann.priority} Priority
              </span>
              <span className="text-slate-500 flex items-center gap-1">
                <Calendar className="w-3 h-3" />
                {ann.date}
              </span>
            </div>

            <h2 className="font-display font-bold text-white text-xl">
              {ann.title}
            </h2>

            <p className="text-slate-300 text-sm leading-relaxed">
              {ann.content}
            </p>

            <div className="pt-2 text-[11px] font-mono text-slate-500">
              Audience Scope: <span className="text-slate-400 uppercase">{ann.audience}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
