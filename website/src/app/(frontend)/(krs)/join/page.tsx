'use client'

import React, { useState } from 'react'
import { Cpu, Send, CheckCircle2 } from 'lucide-react'

export default function JoinPage() {
  const [submitted, setSubmitted] = useState(false)
  const [loading, setLoading] = useState(false)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setTimeout(() => {
      setLoading(false)
      setSubmitted(true)
    }, 800)
  }

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-16 space-y-10">
      <div className="space-y-3">
        <span className="text-xs font-mono text-krs-cyan uppercase tracking-wider">
          Society Recruitment // Season 2026–2027
        </span>
        <h1 className="text-3xl sm:text-5xl font-display font-extrabold text-white tracking-tight">
          Apply to Join KRS
        </h1>
        <p className="text-slate-400 text-sm sm:text-base leading-relaxed">
          Open to all undergraduate and postgraduate engineering students at IILM University Greater Noida who are eager to commit to rigorous hands-on hardware and software development.
        </p>
      </div>

      {submitted ? (
        <div className="p-8 rounded-2xl bg-krs-surface border border-krs-cyan/40 text-center space-y-4">
          <div className="w-12 h-12 rounded-full bg-cyan-950/60 border border-krs-cyan text-krs-cyan mx-auto flex items-center justify-center">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <h2 className="text-2xl font-display font-bold text-white">
            Application Received
          </h2>
          <p className="text-slate-300 text-sm max-w-md mx-auto">
            Your membership application has been registered. The KRS Core Technical Committee will contact you for laboratory onboarding and initial interview rounds.
          </p>
        </div>
      ) : (
        <form
          onSubmit={handleSubmit}
          className="tech-card rounded-2xl p-6 sm:p-8 space-y-6"
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label htmlFor="fullName" className="text-xs font-mono text-slate-300 block">
                Full Name *
              </label>
              <input
                id="fullName"
                type="text"
                required
                className="w-full px-4 py-2.5 rounded-lg bg-krs-dark border border-krs-border text-white text-sm focus:border-krs-cyan outline-none"
                placeholder="e.g. Alex Sharma"
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="studentEmail" className="text-xs font-mono text-slate-300 block">
                Institutional Email *
              </label>
              <input
                id="studentEmail"
                type="email"
                required
                className="w-full px-4 py-2.5 rounded-lg bg-krs-dark border border-krs-border text-white text-sm focus:border-krs-cyan outline-none"
                placeholder="name@iilm.edu"
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="studentId" className="text-xs font-mono text-slate-300 block">
                Student ID / Roll Number *
              </label>
              <input
                id="studentId"
                type="text"
                required
                className="w-full px-4 py-2.5 rounded-lg bg-krs-dark border border-krs-border text-white text-sm focus:border-krs-cyan outline-none"
                placeholder="e.g. 2024CS012"
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="department" className="text-xs font-mono text-slate-300 block">
                Branch & Year *
              </label>
              <input
                id="department"
                type="text"
                required
                className="w-full px-4 py-2.5 rounded-lg bg-krs-dark border border-krs-border text-white text-sm focus:border-krs-cyan outline-none"
                placeholder="e.g. B.Tech CSE / 2nd Year"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label htmlFor="interests" className="text-xs font-mono text-slate-300 block">
              Primary Domain of Interest *
            </label>
            <select
              id="interests"
              required
              className="w-full px-4 py-2.5 rounded-lg bg-krs-dark border border-krs-border text-white text-sm focus:border-krs-cyan outline-none"
            >
              <option value="">Select Domain</option>
              <option value="robotics">Autonomous Robotics & ROS2</option>
              <option value="electronics">Embedded Systems & Custom PCB Design</option>
              <option value="ai">Computer Vision & Edge Deep Learning</option>
              <option value="mechanical">CAD, Mechanical Kinematics & 3D Prototyping</option>
              <option value="operations">Event Management & Media Operations</option>
            </select>
          </div>

          <div className="space-y-2">
            <label htmlFor="priorExp" className="text-xs font-mono text-slate-300 block">
              Prior Experience or Key Projects (Optional)
            </label>
            <textarea
              id="priorExp"
              rows={4}
              className="w-full px-4 py-2.5 rounded-lg bg-krs-dark border border-krs-border text-white text-sm focus:border-krs-cyan outline-none"
              placeholder="Detail any past microcontroller programming, CAD modeling, hackathon projects, or technical tools you have used."
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-3 rounded-lg bg-krs-cyan text-black font-semibold text-xs font-mono uppercase hover:bg-cyan-400 transition-colors shadow-md disabled:opacity-50"
          >
            {loading ? 'Submitting Application...' : 'Submit Application'}
            <Send className="w-4 h-4" />
          </button>
        </form>
      )}
    </div>
  )
}
