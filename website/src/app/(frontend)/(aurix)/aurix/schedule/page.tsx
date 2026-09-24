import React from 'react'
import Link from 'next/link'
import { constructMetadata } from '@/lib/seo/metadata'
import { BreadcrumbsJsonLd } from '@/lib/seo/structured-data'
import { Calendar, Clock, MapPin } from 'lucide-react'

export const metadata = constructMetadata({
  title: 'Master Tournament Schedule | AURIX 2026',
  description:
    'Complete timeline of events, screening deadlines, 24-hour build milestones, and final pitch sessions for AURIX 2026 at IILM University Greater Noida.',
  path: '/aurix/schedule',
})

const SCHEDULE_DAYS = [
  {
    date: '20 October 2026',
    title: 'Round 1 Online Screening Deadline',
    events: [
      {
        time: '23:59 IST',
        title: 'Hackathon Round 1 Proposal Dossier Lock',
        track: 'Hackathon',
        location: 'Online Portal',
        description: 'Final submission deadline for online project proposals, system architectures, and component lists.',
      },
    ],
  },
  {
    date: '29 October 2026 — Day 1',
    title: 'Kickoff, Arena Matches & 24-Hour Build Sprint',
    events: [
      {
        time: '08:30 – 09:30',
        title: 'Participant Check-in & Hardware Inspection',
        track: 'All Competitions',
        location: 'Main Auditorium / Lab Foyer',
        description: 'Physical registration desk verification, team badge collection, and safety compliance checks.',
      },
      {
        time: '09:30 – 10:00',
        title: 'AURIX 2026 Opening Ceremony',
        track: 'All Competitions',
        location: 'Main Auditorium',
        description: 'Keynote by faculty advisors, jury introduction, and official tournament briefing.',
      },
      {
        time: '10:00',
        title: '24-Hour Robotics & AI Hackathon Sprint Commences',
        track: 'Hackathon',
        location: 'Engineering Workshops',
        description: 'Hour 00:00 clock starts. Teams access hardware workstations, power supplies, and 3D printing labs.',
      },
      {
        time: '11:00 – 13:00',
        title: 'Robo Soccer Preliminary Group Matches',
        track: 'Robo Soccer',
        location: 'Robotics Arena A',
        description: 'Round-robin group league matches under referee supervision.',
      },
      {
        time: '14:00 – 17:00',
        title: 'Robo Race Time-Trial Qualifying Heats',
        track: 'Robo Race',
        location: 'Robotics Arena B',
        description: 'Single-operator obstacle course time trials.',
      },
      {
        time: '16:00',
        title: 'Hackathon Hour 06: Mentor Technical Review',
        track: 'Hackathon',
        location: 'Engineering Workshops',
        description: 'Industry mentors inspect hardware schematics and code repository initialization.',
      },
      {
        time: '22:00',
        title: 'Hackathon Hour 12: Midpoint Integration Benchmark',
        track: 'Hackathon',
        location: 'Engineering Workshops',
        description: 'Validation of actuator responses, sensor fusion telemetry, and perception models.',
      },
    ],
  },
  {
    date: '30 October 2026 — Day 2',
    title: 'Final Evaluations, Finals & Awards Ceremony',
    events: [
      {
        time: '09:00 – 10:00',
        title: 'Hackathon Hour 23: Code Freeze & Dossier Lock',
        track: 'Hackathon',
        location: 'Engineering Workshops',
        description: 'Git commits frozen. Final demonstration decks and AI disclosures locked in portal.',
      },
      {
        time: '10:00 – 13:00',
        title: 'Hackathon Round 3 Final Presentations & Live Demos',
        track: 'Hackathon',
        location: 'Auditorium & Live Test Rig',
        description: '5-minute pitch, 7-minute live demonstration, and 5-minute technical Q&A before the jury.',
      },
      {
        time: '10:30 – 13:30',
        title: 'Robo Expo Project Exhibition & Jury Interrogation',
        track: 'Robo Expo',
        location: 'Exhibition Hall',
        description: 'Working demonstration assessments across the 7 structured evaluation criteria.',
      },
      {
        time: '14:00 – 15:30',
        title: 'AURIX Robo Soccer & Robo Race Grand Finals',
        track: 'Arena Competitions',
        location: 'Central Arena',
        description: 'Podium matches and championship heats.',
      },
      {
        time: '16:30 – 17:30',
        title: 'Valedictory & Prize Distribution Ceremony',
        track: 'All Competitions',
        location: 'Main Auditorium',
        description: 'Official award announcements, certificate distribution, and celebration.',
      },
    ],
  },
]

export default function SchedulePage() {
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
          Comprehensive schedule of screening windows, laboratory build checkpoints, arena fixtures, and final evaluation slots at IILM University Greater Noida.
        </p>
      </div>

      <div className="space-y-12">
        {SCHEDULE_DAYS.map((day) => (
          <section key={day.date} className="space-y-6">
            <div className="border-b border-aurix-border pb-3 flex flex-col sm:flex-row sm:items-baseline justify-between gap-1">
              <h2 className="text-xl sm:text-2xl font-display font-bold text-white">
                {day.date}
              </h2>
              <span className="text-xs font-mono text-aurix-orange">
                {day.title}
              </span>
            </div>

            <div className="space-y-4">
              {day.events.map((ev, idx) => (
                <div
                  key={`${ev.time}-${idx}`}
                  className="aurix-card rounded-xl p-5 flex flex-col sm:flex-row sm:items-start justify-between gap-4"
                >
                  <div className="space-y-1.5 flex-1">
                    <div className="flex flex-wrap items-center gap-2 text-xs font-mono">
                      <span className="px-2 py-0.5 rounded bg-aurix-dark text-aurix-orange border border-aurix-border font-bold">
                        {ev.track}
                      </span>
                      <span className="text-slate-400 flex items-center gap-1">
                        <MapPin className="w-3 h-3 text-slate-500" />
                        {ev.location}
                      </span>
                    </div>

                    <h3 className="font-display font-bold text-white text-base">
                      {ev.title}
                    </h3>

                    <p className="text-slate-400 text-xs leading-relaxed">
                      {ev.description}
                    </p>
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
