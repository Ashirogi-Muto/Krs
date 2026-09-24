'use client'

import React, { useState } from 'react'
import { FileCheck2, Send, CheckCircle2, Sparkles, Clock, AlertTriangle } from 'lucide-react'

const HACKATHON_TRACKS = [
  'Track 1: Autonomous Campus & Smart Infrastructure',
  'Track 2: Disaster Response & Search / Rescue',
  'Track 3: Smart Logistics & Warehouse Automation',
  'Track 4: Smart Agriculture & Environmental',
  'Track 5: Healthcare & Assistive Robotics',
  'Track 6: Industry 5.0 & Human-Robot Collaboration',
  'Track 7: Computer Vision & Multimodal AI',
  'Track 8: Generative AI & Agentic Systems',
  'Track 9: Open Innovation',
]

export default function PortalSubmissionsPage() {
  const [submitted, setSubmitted] = useState(false)
  const [loading, setLoading] = useState(false)

  // Form State
  const [title, setTitle] = useState('')
  const [track, setTrack] = useState('')
  const [problem, setProblem] = useState('')
  const [solution, setSolution] = useState('')
  const [architecture, setArchitecture] = useState('')
  const [repoUrl, setRepoUrl] = useState('')
  const [demoUrl, setDemoUrl] = useState('')

  // Structured AI Assistance Disclosure per Section 34
  const [usedAi, setUsedAi] = useState(false)
  const [aiTools, setAiTools] = useState('')
  const [aiPurpose, setAiPurpose] = useState('')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setTimeout(() => {
      setLoading(false)
      setSubmitted(true)
    }, 1000)
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="space-y-2 border-b border-aurix-border pb-6">
        <span className="text-xs font-mono text-aurix-orange uppercase tracking-wider">
          Dossier Engine // Submissions
        </span>
        <h1 className="text-2xl sm:text-4xl font-display font-extrabold text-white">
          Round 1 Technical Proposal
        </h1>
        <p className="text-slate-400 text-xs sm:text-sm font-mono">
          Deadline: 20 October 2026 // 23:59 IST // Squad: CyberKinetic Squad
        </p>
      </div>

      {submitted ? (
        <div className="aurix-card rounded-2xl p-8 sm:p-12 text-center space-y-4 border-aurix-emerald/50">
          <div className="w-14 h-14 rounded-full bg-emerald-950/60 border border-aurix-emerald text-aurix-emerald mx-auto flex items-center justify-center">
            <CheckCircle2 className="w-7 h-7" />
          </div>
          <h2 className="text-2xl font-display font-bold text-white">
            Technical Dossier Locked & Submitted
          </h2>
          <p className="text-slate-300 text-sm max-w-md mx-auto leading-relaxed">
            Your Round 1 proposal has been successfully registered with version SHA-256 snapshot. The technical screening jury will evaluate feasibility by 25 October 2026.
          </p>
          <div className="pt-2">
            <button
              type="button"
              onClick={() => setSubmitted(false)}
              className="px-6 py-2.5 rounded bg-aurix-dark border border-aurix-border text-xs font-mono text-slate-300 hover:text-white"
            >
              Update / Review Submission
            </button>
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Project Abstract */}
          <div className="aurix-card rounded-2xl p-6 sm:p-8 space-y-5">
            <h2 className="font-display font-bold text-white text-lg border-b border-aurix-border/60 pb-3">
              1. Project Proposal & Domain Track
            </h2>

            <div className="space-y-2">
              <label htmlFor="projectTitle" className="text-xs font-mono text-slate-300 block">
                Project Title *
              </label>
              <input
                id="projectTitle"
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Autonomous Campus Infrastructure Inspector"
                className="w-full px-4 py-2.5 rounded-lg bg-aurix-dark border border-aurix-border text-white text-sm focus:border-aurix-orange outline-none"
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="challengeTrack" className="text-xs font-mono text-slate-300 block">
                Challenge Track *
              </label>
              <select
                id="challengeTrack"
                required
                value={track}
                onChange={(e) => setTrack(e.target.value)}
                className="w-full px-4 py-2.5 rounded-lg bg-aurix-dark border border-aurix-border text-white text-sm focus:border-aurix-orange outline-none"
              >
                <option value="">Select Challenge Track</option>
                {HACKATHON_TRACKS.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <label htmlFor="problemStatement" className="text-xs font-mono text-slate-300 block">
                Target Problem Statement & Real-World Relevance *
              </label>
              <textarea
                id="problemStatement"
                rows={3}
                required
                value={problem}
                onChange={(e) => setProblem(e.target.value)}
                placeholder="Describe the precise operational bottleneck, safety hazard, or inefficiency being resolved."
                className="w-full px-4 py-2.5 rounded-lg bg-aurix-dark border border-aurix-border text-white text-sm focus:border-aurix-orange outline-none"
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="proposedSolution" className="text-xs font-mono text-slate-300 block">
                Proposed Cyber-Physical Solution & Architecture *
              </label>
              <textarea
                id="proposedSolution"
                rows={4}
                required
                value={solution}
                onChange={(e) => setSolution(e.target.value)}
                placeholder="Detail the hardware selection (MCUs, sensors, chassis) and software algorithms (ROS2, SLAM, edge AI)."
                className="w-full px-4 py-2.5 rounded-lg bg-aurix-dark border border-aurix-border text-white text-sm focus:border-aurix-orange outline-none"
              />
            </div>
          </div>

          {/* Links & Repository */}
          <div className="aurix-card rounded-2xl p-6 sm:p-8 space-y-5">
            <h2 className="font-display font-bold text-white text-lg border-b border-aurix-border/60 pb-3">
              2. Technical Artifacts & Repositories
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label htmlFor="repoUrl" className="text-xs font-mono text-slate-300 block">
                  GitHub / Git Repository URL (Optional for Round 1)
                </label>
                <input
                  id="repoUrl"
                  type="url"
                  value={repoUrl}
                  onChange={(e) => setRepoUrl(e.target.value)}
                  placeholder="https://github.com/team/repo"
                  className="w-full px-4 py-2.5 rounded-lg bg-aurix-dark border border-aurix-border text-white text-sm focus:border-aurix-orange outline-none"
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="demoUrl" className="text-xs font-mono text-slate-300 block">
                  Design Deck or Video Link (Google Drive / YouTube)
                </label>
                <input
                  id="demoUrl"
                  type="url"
                  value={demoUrl}
                  onChange={(e) => setDemoUrl(e.target.value)}
                  placeholder="https://drive.google.com/..."
                  className="w-full px-4 py-2.5 rounded-lg bg-aurix-dark border border-aurix-border text-white text-sm focus:border-aurix-orange outline-none"
                />
              </div>
            </div>
          </div>

          {/* Structured Generative AI Assistance Disclosure (Section 34) */}
          <div className="aurix-card rounded-2xl p-6 sm:p-8 space-y-5 border-aurix-orange/60">
            <div className="flex items-center gap-2 text-aurix-orange font-mono text-xs uppercase font-bold">
              <Sparkles className="w-4 h-4" />
              Generative AI Assistance Disclosure Policy
            </div>

            <p className="text-slate-300 text-xs leading-relaxed">
              Generative AI tools are permitted under official AURIX policy. However, per Section 34 of tournament rules, substantial AI assistance must be disclosed transparently. Disclosure will not disqualify your submission.
            </p>

            <div className="space-y-3">
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={usedAi}
                  onChange={(e) => setUsedAi(e.target.checked)}
                  className="w-4 h-4 text-aurix-orange rounded bg-aurix-dark border-aurix-border focus:ring-0"
                />
                <span className="text-xs font-mono text-white">
                  Our team utilized Generative AI tools (LLMs, code generation, schematic helpers) during ideation or development.
                </span>
              </label>

              {usedAi && (
                <div className="space-y-4 pt-2 border-t border-aurix-border/40">
                  <div className="space-y-1.5">
                    <label htmlFor="aiTools" className="text-xs font-mono text-slate-300 block">
                      Specific Tools Employed *
                    </label>
                    <input
                      id="aiTools"
                      type="text"
                      required={usedAi}
                      value={aiTools}
                      onChange={(e) => setAiTools(e.target.value)}
                      placeholder="e.g. Claude 3.5 Sonnet, GitHub Copilot, ChatGPT, Cursor"
                      className="w-full px-4 py-2.5 rounded-lg bg-aurix-dark border border-aurix-border text-white text-sm focus:border-aurix-orange outline-none"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label htmlFor="aiPurpose" className="text-xs font-mono text-slate-300 block">
                      Purpose & Extent of Assistance *
                    </label>
                    <textarea
                      id="aiPurpose"
                      rows={3}
                      required={usedAi}
                      value={aiPurpose}
                      onChange={(e) => setAiPurpose(e.target.value)}
                      placeholder="Detail which modules, calculations, or documentation drafts were generated or assisted by AI."
                      className="w-full px-4 py-2.5 rounded-lg bg-aurix-dark border border-aurix-border text-white text-sm focus:border-aurix-orange outline-none"
                    />
                  </div>
                </div>
              )}
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="inline-flex items-center gap-2 px-8 py-3.5 rounded-lg bg-aurix-orange text-black font-semibold text-xs font-mono uppercase tracking-wider hover:bg-orange-400 transition-colors shadow-lg disabled:opacity-50"
          >
            {loading ? 'Locking Dossier...' : 'Submit Round 1 Proposal'}
            <Send className="w-4 h-4" />
          </button>
        </form>
      )}
    </div>
  )
}
