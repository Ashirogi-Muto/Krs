'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { AlertCircle, CheckCircle2, Clock, Loader2, Search, XCircle } from 'lucide-react'

interface RegistrationStatus {
  registrationCode: string
  eventTitle: string
  eventSlug: string | null
  teamName: string
  members: { name: string; college: string }[]
  amountDue: number | null
  status: 'PENDING' | 'CONFIRMED' | 'REJECTED' | 'CANCELLED'
  paymentStatus: 'AWAITING_PAYMENT' | 'PAID_VERIFIED' | 'NOT_FOUND' | 'REFUNDED'
  idVerification: 'PENDING' | 'APPROVED' | 'REJECTED'
  registeredAt: string
}

type Tone = 'good' | 'wait' | 'bad'

const STATUS_TEXT: Record<RegistrationStatus['status'], [string, Tone]> = {
  PENDING: ['Pending verification', 'wait'],
  CONFIRMED: ['Confirmed', 'good'],
  REJECTED: ['Rejected — please contact the organizers', 'bad'],
  CANCELLED: ['Cancelled', 'bad'],
}
const PAYMENT_TEXT: Record<RegistrationStatus['paymentStatus'], [string, Tone]> = {
  AWAITING_PAYMENT: ['Not yet verified (payments are checked once a day)', 'wait'],
  PAID_VERIFIED: ['Payment verified', 'good'],
  NOT_FOUND: ['Payment not found — please contact the organizers', 'bad'],
  REFUNDED: ['Refunded', 'bad'],
}
const ID_TEXT: Record<RegistrationStatus['idVerification'], [string, Tone]> = {
  PENDING: ['Being checked', 'wait'],
  APPROVED: ['Approved', 'good'],
  REJECTED: ['Rejected — please contact the organizers', 'bad'],
}

const toneIcon = (tone: Tone) =>
  tone === 'good' ? (
    <CheckCircle2 className="w-4 h-4 text-green-400 shrink-0" />
  ) : tone === 'bad' ? (
    <XCircle className="w-4 h-4 text-red-400 shrink-0" />
  ) : (
    <Clock className="w-4 h-4 text-yellow-400 shrink-0" />
  )

const inputClass =
  'w-full px-3 py-2.5 rounded-lg bg-aurix-dark border border-aurix-border text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-aurix-orange'

export function StatusLookup({ initialCode }: { initialCode?: string }) {
  const [code, setCode] = useState(initialCode || '')
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<RegistrationStatus | null>(null)

  const lookup = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setResult(null)
    setLoading(true)
    try {
      const res = await fetch('/api/aurix/status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code, email }),
      })
      const body = await res.json().catch(() => ({}))
      if (!res.ok || !body.success) throw new Error(body.message || 'Lookup failed. Please try again.')
      setResult(body.registration as RegistrationStatus)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const row = (label: string, [text, tone]: [string, Tone]) => (
    <div className="flex items-start justify-between gap-4 py-3 border-b border-aurix-border/60 last:border-0">
      <span className="text-xs font-mono uppercase text-slate-400">{label}</span>
      <span className="flex items-center gap-2 text-sm text-white text-right">
        {toneIcon(tone)} {text}
      </span>
    </div>
  )

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <form onSubmit={lookup} className="aurix-card rounded-2xl p-5 sm:p-8 space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <label className="block space-y-1.5">
            <span className="text-xs font-mono uppercase text-slate-400">Registration code</span>
            <input
              className={`${inputClass} uppercase font-mono`}
              placeholder="AX26-SOC-XXXXXX"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              required
            />
          </label>
          <label className="block space-y-1.5">
            <span className="text-xs font-mono uppercase text-slate-400">Team leader email</span>
            <input className={inputClass} type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
          </label>
        </div>
        <button
          type="submit"
          disabled={loading}
          className="w-full inline-flex items-center justify-center gap-2 px-6 py-3 rounded-lg bg-aurix-orange text-black font-semibold text-xs font-mono uppercase tracking-wider hover:bg-orange-400 transition-colors disabled:opacity-60"
        >
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />} Check status
        </button>
        {error && (
          <div className="p-3 rounded-lg bg-red-950/50 border border-red-800 text-red-300 text-sm flex items-start gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" /> {error}
          </div>
        )}
      </form>

      {result && (
        <div className="aurix-card rounded-2xl p-5 sm:p-8 space-y-5">
          <div className="space-y-1">
            <div className="text-xs font-mono uppercase text-aurix-orange">{result.registrationCode}</div>
            <h2 className="text-2xl font-display font-bold text-white">{result.teamName}</h2>
            <p className="text-sm text-slate-300">
              {result.eventSlug ? (
                <Link href={`/aurix/${result.eventSlug}`} className="hover:text-aurix-orange underline-offset-2 hover:underline">
                  {result.eventTitle}
                </Link>
              ) : (
                result.eventTitle
              )}
              {result.amountDue ? ` · ₹${result.amountDue} / team` : ''}
            </p>
          </div>
          <div>
            {row('Registration', STATUS_TEXT[result.status] || ['Unknown', 'wait'])}
            {row('Payment', PAYMENT_TEXT[result.paymentStatus] || ['Unknown', 'wait'])}
            {row('Student IDs', ID_TEXT[result.idVerification] || ['Unknown', 'wait'])}
          </div>
          <div className="space-y-2">
            <div className="text-xs font-mono uppercase text-slate-400">Team members</div>
            <ul className="text-sm text-slate-200 space-y-1">
              {result.members.map((m, i) => (
                <li key={i}>
                  {m.name} <span className="text-slate-400">— {m.college}</span>
                  {i === 0 && <span className="ml-2 text-[10px] font-mono uppercase text-aurix-orange">Leader</span>}
                </li>
              ))}
            </ul>
          </div>
          <p className="text-xs text-slate-400">
            Registered on{' '}
            {new Date(result.registeredAt).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short', timeZone: 'Asia/Kolkata' })}{' '}
            IST. Payments are verified once a day, so a new payment can take up to 24–48 hours to show here.
          </p>
        </div>
      )}
    </div>
  )
}
