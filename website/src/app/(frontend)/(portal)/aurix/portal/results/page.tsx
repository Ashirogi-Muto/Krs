import React from 'react'
import { Trophy, Clock, FileText } from 'lucide-react'

export default function PortalResultsPage() {
  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="space-y-2 border-b border-aurix-border pb-6">
        <span className="text-xs font-mono text-aurix-orange uppercase tracking-wider">
          Evaluation Scores // Participant Results
        </span>
        <h1 className="text-2xl sm:text-4xl font-display font-extrabold text-white">
          Team Scorecard & Adjudication
        </h1>
        <p className="text-slate-400 text-xs sm:text-sm font-mono">
          Squad: CyberKinetic Squad // Track: Autonomous Campus & Smart Infrastructure
        </p>
      </div>

      <div className="aurix-card rounded-2xl p-8 sm:p-12 text-center space-y-4 border-aurix-border">
        <div className="w-12 h-12 rounded-xl bg-aurix-dark border border-aurix-border flex items-center justify-center text-aurix-orange mx-auto">
          <Clock className="w-6 h-6" />
        </div>

        <h2 className="text-xl font-display font-bold text-white">
          Round 1 Evaluation Underway
        </h2>

        <p className="text-slate-300 text-xs sm:text-sm max-w-md mx-auto leading-relaxed">
          Official screening scorecards and mentor feedback will appear here once the Round 1 review panel concludes scoring on 25 October 2026.
        </p>
      </div>
    </div>
  )
}
