'use client'

import React, { useState } from 'react'
import { MapPin, Mail, Building, Send, CheckCircle2 } from 'lucide-react'

export default function ContactPage() {
  const [sent, setSent] = useState(false)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setSent(true)
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 space-y-12">
      <div className="max-w-3xl space-y-4">
        <span className="text-xs font-mono text-krs-cyan uppercase tracking-wider">
          Official Inquiries // Contact Hub
        </span>
        <h1 className="text-3xl sm:text-5xl font-display font-extrabold text-white tracking-tight">
          Connect with Kalam Robotics Society
        </h1>
        <p className="text-slate-400 text-sm sm:text-base leading-relaxed">
          For competition inquiries, institutional partnerships, sponsorship discussions, or laboratory visits at IILM University Greater Noida.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Contact Info Column */}
        <div className="lg:col-span-5 space-y-6">
          <div className="tech-card rounded-2xl p-6 space-y-4">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-lg bg-krs-surface border border-krs-border flex items-center justify-center text-krs-cyan shrink-0">
                <Building className="w-5 h-5" />
              </div>
              <div>
                <h2 className="font-display font-bold text-white text-base">
                  Physical Laboratory Location
                </h2>
                <p className="text-slate-300 text-xs sm:text-sm mt-1 leading-relaxed">
                  Kalam Robotics Society Laboratory
                  <br />
                  School of Engineering & Technology
                  <br />
                  IILM University, Greater Noida
                  <br />
                  Knowledge Park II, Greater Noida, Uttar Pradesh, India
                </p>
              </div>
            </div>

            <div className="pt-4 border-t border-krs-border/60 flex items-start gap-3">
              <div className="w-10 h-10 rounded-lg bg-krs-surface border border-krs-border flex items-center justify-center text-krs-cyan shrink-0">
                <Mail className="w-5 h-5" />
              </div>
              <div>
                <h2 className="font-display font-bold text-white text-base">
                  Official Society Correspondence
                </h2>
                <p className="text-slate-400 text-xs mt-1">
                  General inquiries & AURIX support:
                </p>
                <p className="text-krs-cyan text-xs font-mono font-semibold mt-0.5">
                  contact@kalamrobotics.in
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Message Form */}
        <div className="lg:col-span-7">
          {sent ? (
            <div className="tech-card rounded-2xl p-8 text-center space-y-3">
              <div className="w-12 h-12 rounded-full bg-cyan-950/60 border border-krs-cyan text-krs-cyan mx-auto flex items-center justify-center">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <h2 className="text-xl font-display font-bold text-white">
                Message Dispatched
              </h2>
              <p className="text-slate-300 text-xs">
                Your message has been received by the organizing committee. We will respond via official correspondence.
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="tech-card rounded-2xl p-6 sm:p-8 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label htmlFor="contactName" className="text-xs font-mono text-slate-300 block">
                    Your Name *
                  </label>
                  <input
                    id="contactName"
                    type="text"
                    required
                    className="w-full px-4 py-2.5 rounded-lg bg-krs-dark border border-krs-border text-white text-sm focus:border-krs-cyan outline-none"
                  />
                </div>
                <div className="space-y-1.5">
                  <label htmlFor="contactEmail" className="text-xs font-mono text-slate-300 block">
                    Email Address *
                  </label>
                  <input
                    id="contactEmail"
                    type="email"
                    required
                    className="w-full px-4 py-2.5 rounded-lg bg-krs-dark border border-krs-border text-white text-sm focus:border-krs-cyan outline-none"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label htmlFor="subject" className="text-xs font-mono text-slate-300 block">
                  Subject *
                </label>
                <input
                  id="subject"
                  type="text"
                  required
                  placeholder="e.g. AURIX 2026 Hackathon Inquiry"
                  className="w-full px-4 py-2.5 rounded-lg bg-krs-dark border border-krs-border text-white text-sm focus:border-krs-cyan outline-none"
                />
              </div>

              <div className="space-y-1.5">
                <label htmlFor="message" className="text-xs font-mono text-slate-300 block">
                  Message *
                </label>
                <textarea
                  id="message"
                  required
                  rows={4}
                  className="w-full px-4 py-2.5 rounded-lg bg-krs-dark border border-krs-border text-white text-sm focus:border-krs-cyan outline-none"
                />
              </div>

              <button
                type="submit"
                className="inline-flex items-center gap-2 px-6 py-2.5 rounded-lg bg-krs-cyan text-black font-semibold text-xs font-mono uppercase hover:bg-cyan-400 transition-colors shadow-sm"
              >
                Send Inscription <Send className="w-3.5 h-3.5" />
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}
