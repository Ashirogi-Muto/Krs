import React from 'react'
import Link from 'next/link'
import { getSessionUser } from '@/lib/auth/session'
import {
  Calendar,
  Users,
  CheckCircle2,
  Clock,
  ArrowRight,
  Flame,
  AlertCircle,
  FileCheck2,
} from 'lucide-react'

export default async function PortalDashboardPage() {
  const user = await getSessionUser()

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="space-y-2 border-b border-aurix-border pb-6">
        <span className="text-xs font-mono text-aurix-orange uppercase tracking-wider">
          Participant Operations // Overview
        </span>
        <h1 className="text-2xl sm:text-4xl font-display font-extrabold text-white">
          Welcome, {user ? user.name : 'Innovator'}
        </h1>
        <p className="text-slate-400 text-xs sm:text-sm font-mono">
          Affiliation: {user?.institution || 'IILM University, Greater Noida'} // AURIX 2026 Edition
        </p>
      </div>

      {/* Operational Checklist per Section 67 */}
      <section className="aurix-card rounded-2xl p-6 space-y-4 border-aurix-border">
        <h2 className="font-display font-bold text-white text-base flex items-center gap-2">
          <CheckCircle2 className="w-5 h-5 text-aurix-orange" />
          Competition Readiness Checklist
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 text-xs font-mono">
          <div className="p-3.5 rounded-lg bg-aurix-dark border border-aurix-border space-y-1">
            <span className="text-aurix-emerald flex items-center gap-1 font-bold">
              ✓ 1. Profile Verified
            </span>
            <p className="text-slate-400 text-[11px]">Identity credentials confirmed</p>
          </div>
          <div className="p-3.5 rounded-lg bg-aurix-dark border border-aurix-border space-y-1">
            <span className="text-aurix-orange flex items-center gap-1 font-bold">
              ● 2. Team Formation
            </span>
            <p className="text-slate-400 text-[11px]">Invite teammates to complete squad</p>
          </div>
          <div className="p-3.5 rounded-lg bg-aurix-dark border border-aurix-border space-y-1">
            <span className="text-slate-500 flex items-center gap-1">
              ○ 3. Round 1 Dossier
            </span>
            <p className="text-slate-400 text-[11px]">Due 20 October 2026</p>
          </div>
          <div className="p-3.5 rounded-lg bg-aurix-dark border border-aurix-border space-y-1">
            <span className="text-slate-500 flex items-center gap-1">
              ○ 4. Arena Check-in
            </span>
            <p className="text-slate-400 text-[11px]">29 October at IILM Campus</p>
          </div>
        </div>
      </section>

      {/* Grid: Active Registrations & Deadlines */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Active Registrations */}
        <div className="lg:col-span-7 space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-display font-bold text-white">
              My Registered Competitions
            </h2>
            <Link
              href="/aurix/portal/events"
              className="text-xs font-mono text-aurix-orange hover:underline"
            >
              Browse All Events
            </Link>
          </div>

          {/* Sample Active Registration Card */}
          <div className="aurix-card rounded-xl p-6 space-y-4 border-aurix-orange/40">
            <div className="flex items-center justify-between">
              <span className="px-2.5 py-0.5 rounded bg-aurix-dark text-aurix-orange text-xs font-mono font-bold border border-aurix-border">
                HACKATHON
              </span>
              <span className="px-2 py-0.5 rounded bg-emerald-950/60 border border-emerald-800 text-emerald-400 text-[11px] font-mono">
                Confirmed Entry
              </span>
            </div>

            <div>
              <h3 className="font-display font-bold text-white text-lg">
                KRS Robotics & AI Hackathon 2026
              </h3>
              <p className="text-slate-400 text-xs font-mono mt-0.5">
                Team: CyberKinetic Squad (Code: #KRS-HACK-88)
              </p>
            </div>

            <div className="p-3 rounded-lg bg-aurix-dark text-xs font-mono text-slate-300 space-y-1">
              <div className="flex justify-between">
                <span className="text-slate-500">Track:</span>
                <span className="text-white">Autonomous Campus & Smart Infrastructure</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Current Phase:</span>
                <span className="text-aurix-orange">Round 1 Online Screening</span>
              </div>
            </div>

            <div className="flex items-center justify-between pt-2">
              <Link
                href="/aurix/portal/submissions"
                className="inline-flex items-center gap-1.5 text-xs font-mono text-aurix-orange font-bold hover:underline"
              >
                Submit Proposal Dossier <ArrowRight className="w-3.5 h-3.5" />
              </Link>
              <Link
                href="/aurix/portal/teams"
                className="text-xs font-mono text-slate-400 hover:text-white"
              >
                Manage Members (5/5)
              </Link>
            </div>
          </div>
        </div>

        {/* Deadlines & Notice Sidebar */}
        <div className="lg:col-span-5 space-y-6">
          <h2 className="text-lg font-display font-bold text-white">
            Upcoming Deadlines
          </h2>

          <div className="space-y-3">
            <div className="aurix-card rounded-xl p-4 space-y-2">
              <div className="flex items-center justify-between text-xs font-mono">
                <span className="text-aurix-orange font-bold">20 OCT 2026</span>
                <span className="text-red-400">23:59 IST</span>
              </div>
              <h3 className="font-display font-bold text-white text-sm">
                Round 1 Proposal Submission Lock
              </h3>
              <p className="text-slate-400 text-xs leading-relaxed">
                Online screening dossier, circuit diagrams, and problem statements lock permanently at midnight.
              </p>
            </div>

            <div className="aurix-card rounded-xl p-4 space-y-2">
              <div className="flex items-center justify-between text-xs font-mono">
                <span className="text-aurix-orange font-bold">25 OCT 2026</span>
                <span className="text-slate-400">18:00 IST</span>
              </div>
              <h3 className="font-display font-bold text-white text-sm">
                Shortlisted 50 Teams Announcement
              </h3>
              <p className="text-slate-400 text-xs leading-relaxed">
                Jury releases the official national shortlist for Round 2 on-site build at IILM University.
              </p>
            </div>

            <div className="aurix-card rounded-xl p-4 space-y-2">
              <div className="flex items-center justify-between text-xs font-mono">
                <span className="text-aurix-orange font-bold">29 OCT 2026</span>
                <span className="text-white">09:00 IST</span>
              </div>
              <h3 className="font-display font-bold text-white text-sm">
                On-site Kickoff & Hardware Inspection
              </h3>
              <p className="text-slate-400 text-xs leading-relaxed">
                In-person physical verification at IILM Greater Noida campus and workstation allocation.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
