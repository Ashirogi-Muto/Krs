'use client'

import React, { useState } from 'react'
import { Users, UserPlus, Copy, Check, ShieldCheck, AlertCircle } from 'lucide-react'

export default function PortalTeamsPage() {
  const [copied, setCopied] = useState(false)
  const [inviteEmail, setInviteEmail] = useState('')
  const [invitedList, setInvitedList] = useState<string[]>([])

  const teamCode = 'KRS-HACK-88'
  const maxTeamSize = 5 // Enforced exactly 5 for Hackathon

  const members = [
    { name: 'Alex Sharma (You)', email: 'alex@iilm.edu', role: 'Team Lead', status: 'Confirmed' },
    { name: 'Priya Verma', email: 'priya@iilm.edu', role: 'Hardware & Firmware', status: 'Confirmed' },
    { name: 'Rohan Gupta', email: 'rohan@iilm.edu', role: 'Perception & ROS2', status: 'Confirmed' },
    { name: 'Ananya Rao', email: 'ananya@iilm.edu', role: 'Mechanical & CAD', status: 'Confirmed' },
  ]

  const handleCopyCode = () => {
    navigator.clipboard.writeText(teamCode)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleSendInvite = (e: React.FormEvent) => {
    e.preventDefault()
    if (!inviteEmail) return
    setInvitedList([...invitedList, inviteEmail])
    setInviteEmail('')
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="space-y-2 border-b border-aurix-border pb-6">
        <span className="text-xs font-mono text-aurix-orange uppercase tracking-wider">
          Squad Operations // Team Management
        </span>
        <h1 className="text-2xl sm:text-4xl font-display font-extrabold text-white">
          Team Management
        </h1>
        <p className="text-slate-400 text-xs sm:text-sm font-mono">
          Competition: KRS Robotics & AI Hackathon 2026 // Required Squad Size: Exactly 5
        </p>
      </div>

      {/* Team Roster Card */}
      <section className="aurix-card rounded-2xl p-6 sm:p-8 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-aurix-border/60 pb-4">
          <div>
            <span className="text-xs font-mono text-slate-400">Active Squad</span>
            <h2 className="text-xl font-display font-bold text-white">
              CyberKinetic Squad
            </h2>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-xs font-mono text-aurix-orange">
              Join Code: <strong className="text-white font-mono">{teamCode}</strong>
            </span>
            <button
              type="button"
              onClick={handleCopyCode}
              className="p-2 rounded bg-aurix-dark border border-aurix-border text-slate-300 hover:text-white"
              title="Copy Team Code"
            >
              {copied ? <Check className="w-4 h-4 text-aurix-emerald" /> : <Copy className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Member Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead className="bg-aurix-dark border-b border-aurix-border text-slate-400 uppercase">
              <tr>
                <th className="p-3">Participant</th>
                <th className="p-3">Email</th>
                <th className="p-3">Assigned Role</th>
                <th className="p-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-aurix-border/60 text-slate-300">
              {members.map((m) => (
                <tr key={m.email}>
                  <td className="p-3 font-bold text-white flex items-center gap-2">
                    <ShieldCheck className="w-3.5 h-3.5 text-aurix-orange" />
                    {m.name}
                  </td>
                  <td className="p-3 text-slate-400">{m.email}</td>
                  <td className="p-3">{m.role}</td>
                  <td className="p-3">
                    <span className="px-2 py-0.5 rounded bg-emerald-950/60 border border-emerald-800 text-emerald-400 text-[10px]">
                      {m.status}
                    </span>
                  </td>
                </tr>
              ))}
              {invitedList.map((inv) => (
                <tr key={inv} className="text-slate-400">
                  <td className="p-3">Invited Member</td>
                  <td className="p-3">{inv}</td>
                  <td className="p-3">Pending Accept</td>
                  <td className="p-3">
                    <span className="px-2 py-0.5 rounded bg-yellow-950/60 border border-yellow-800 text-yellow-400 text-[10px]">
                      Invite Dispatched
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Squad Limit Gauge */}
        <div className="p-4 rounded-xl bg-aurix-dark border border-aurix-border flex flex-col sm:flex-row items-center justify-between gap-4 text-xs font-mono">
          <div>
            <span className="text-slate-400">Team Capacity: </span>
            <strong className="text-white">
              {members.length + invitedList.length} of {maxTeamSize} Members
            </strong>
          </div>
          <span className="text-aurix-orange">
            {members.length + invitedList.length === maxTeamSize
              ? '✓ Full Squad Composition Reached'
              : `Requires ${maxTeamSize - (members.length + invitedList.length)} more member to satisfy exact team size invariant`}
          </span>
        </div>

        {/* Invite Form */}
        {members.length + invitedList.length < maxTeamSize && (
          <form onSubmit={handleSendInvite} className="pt-4 border-t border-aurix-border/60 space-y-3">
            <h3 className="font-display font-semibold text-white text-sm">
              Dispatch Single-Use Cryptographic Invitation
            </h3>
            <div className="flex flex-col sm:flex-row gap-3">
              <input
                type="email"
                required
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                placeholder="teammate@university.edu"
                className="flex-1 px-4 py-2.5 rounded-lg bg-aurix-dark border border-aurix-border text-white text-sm focus:border-aurix-orange outline-none"
              />
              <button
                type="submit"
                className="inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-lg bg-aurix-orange text-black font-semibold text-xs font-mono uppercase hover:bg-orange-400 transition-colors"
              >
                <UserPlus className="w-4 h-4" /> Send Invitation
              </button>
            </div>
          </form>
        )}
      </section>
    </div>
  )
}
