import React from 'react'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { getSessionUser } from '@/lib/auth/session'
import { ShieldCheck, Award, FileText, CheckCircle2, Clock, AlertTriangle } from 'lucide-react'

export const metadata = {
  title: 'Judge Evaluation Portal | AURIX 2026',
  robots: {
    index: false,
    follow: false,
  },
}

export default async function JudgePortalPage() {
  const user = await getSessionUser()
  if (!user) {
    redirect('/login')
  }
  if (user.role !== 'JUDGE' && user.role !== 'ADMIN' && user.role !== 'SUPER_ADMIN') {
    redirect('/aurix/portal')
  }

  return (
    <div className="min-h-screen bg-aurix-dark text-slate-100 p-6 sm:p-10 max-w-6xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-aurix-border pb-6">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono text-aurix-orange uppercase">
            <ShieldCheck className="w-4 h-4" />
            Adjudication Suite // AURIX Jury Panel
          </div>
          <h1 className="text-3xl sm:text-4xl font-display font-extrabold text-white mt-1">
            Judge Evaluation Dashboard
          </h1>
          <p className="text-slate-400 text-xs font-mono mt-1">
            Evaluator: {user?.name || 'Verified Jury Member'} // Assigned: AURIX Hackathon 2026
          </p>
        </div>

        <Link
          href="/aurix"
          className="self-start sm:self-auto px-4 py-2 rounded bg-aurix-surface border border-aurix-border text-xs font-mono text-slate-300 hover:text-white"
        >
          Exit to Public Arena
        </Link>
      </div>

      {/* Evaluation Queue */}
      <section className="space-y-6">
        <h2 className="text-xl font-display font-bold text-white flex items-center gap-2">
          <Award className="w-5 h-5 text-aurix-orange" />
          Assigned Teams Pending Evaluation
        </h2>

        <div className="space-y-4">
          <div className="aurix-card rounded-2xl p-6 sm:p-8 space-y-4 border-aurix-border">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-aurix-border/60 pb-3">
              <div>
                <span className="text-xs font-mono text-aurix-orange">Round 1 Online Screening</span>
                <h3 className="font-display font-bold text-white text-lg sm:text-xl">
                  Team: CyberKinetic Squad (Code: #KRS-HACK-88)
                </h3>
              </div>
              <span className="self-start sm:self-auto px-3 py-1 rounded bg-yellow-950/60 border border-yellow-800 text-yellow-400 text-xs font-mono">
                Evaluation Pending
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-mono text-slate-300">
              <div className="p-3 rounded bg-aurix-dark border border-aurix-border">
                <span className="text-slate-500 block uppercase">Project Title</span>
                <span className="text-white font-semibold">
                  Autonomous Campus Infrastructure Inspector
                </span>
              </div>
              <div className="p-3 rounded bg-aurix-dark border border-aurix-border">
                <span className="text-slate-500 block uppercase">Selected Track</span>
                <span className="text-white font-semibold">
                  Track 1: Autonomous Campus & Smart Infrastructure
                </span>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-aurix-dark border border-aurix-border space-y-3">
              <h4 className="text-xs font-mono text-slate-400 uppercase tracking-wider">
                Scoring Rubric (Server-Enforced Calculation)
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs font-mono">
                <div className="space-y-1">
                  <label className="text-slate-400">Innovation & Feasibility (Max 40)</label>
                  <input
                    type="number"
                    min={0}
                    max={40}
                    defaultValue={35}
                    className="w-full px-3 py-1.5 rounded bg-aurix-surface border border-aurix-border text-white text-xs outline-none focus:border-aurix-orange"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-slate-400">Architecture & Schematics (Max 35)</label>
                  <input
                    type="number"
                    min={0}
                    max={35}
                    defaultValue={30}
                    className="w-full px-3 py-1.5 rounded bg-aurix-surface border border-aurix-border text-white text-xs outline-none focus:border-aurix-orange"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-slate-400">Real-World Relevance (Max 25)</label>
                  <input
                    type="number"
                    min={0}
                    max={25}
                    defaultValue={22}
                    className="w-full px-3 py-1.5 rounded bg-aurix-surface border border-aurix-border text-white text-xs outline-none focus:border-aurix-orange"
                  />
                </div>
              </div>

              <div className="space-y-1 pt-2">
                <label className="text-xs font-mono text-slate-400">
                  Confidential Judge Remarks (Never exposed to participants)
                </label>
                <textarea
                  rows={2}
                  defaultValue="Solid mechanical design. Recommend testing motor driver thermal dissipation under continuous load."
                  className="w-full px-3 py-2 rounded bg-aurix-surface border border-aurix-border text-white text-xs outline-none focus:border-aurix-orange"
                />
              </div>

              <button
                type="button"
                className="px-6 py-2.5 rounded bg-aurix-orange text-black font-semibold text-xs font-mono uppercase hover:bg-orange-400 transition-colors"
              >
                Submit Verified Scorecard
              </button>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
