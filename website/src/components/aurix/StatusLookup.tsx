'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { AlertCircle, CheckCircle2, Clock, ExternalLink, Loader2, Search, XCircle } from 'lucide-react'
import { DEFAULT_FORM_TEXTS, fill, type FormTexts } from '@/lib/form-texts-defaults'

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
  paymentUrl?: string | null // only while not paid yet (pre-filled payment page)
}

type Tone = 'good' | 'wait' | 'bad'

// Wording comes from the CMS (Forms & messages) via the server; defaults are today's text
const tables = (t: FormTexts['status']) => ({
  status: {
    PENDING: [t.regPending, 'wait'],
    CONFIRMED: [t.regConfirmed, 'good'],
    REJECTED: [t.regRejected, 'bad'],
    CANCELLED: [t.regCancelled, 'bad'],
  } as Record<RegistrationStatus['status'], [string, Tone]>,
  payment: {
    AWAITING_PAYMENT: [t.payAwaiting, 'wait'],
    PAID_VERIFIED: [t.payVerified, 'good'],
    NOT_FOUND: [t.payNotFound, 'bad'],
    REFUNDED: [t.payRefunded, 'bad'],
  } as Record<RegistrationStatus['paymentStatus'], [string, Tone]>,
  ids: {
    PENDING: [t.idPending, 'wait'],
    APPROVED: [t.idApproved, 'good'],
    REJECTED: [t.idRejected, 'bad'],
  } as Record<RegistrationStatus['idVerification'], [string, Tone]>,
})

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

export function StatusLookup({ initialCode, t = DEFAULT_FORM_TEXTS.status }: { initialCode?: string; t?: FormTexts['status'] & { errLookup?: string } }) {
  const T = tables(t)
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
      if (!res.ok || !body.success) throw new Error(body.message || t.errLookup || DEFAULT_FORM_TEXTS.general.errLookup)
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
            <span className="text-xs font-mono uppercase text-slate-400">{t.code}</span>
            <input
              className={`${inputClass} uppercase font-mono`}
              placeholder={t.codePlaceholder}
              value={code}
              onChange={(e) => setCode(e.target.value)}
              required
            />
          </label>
          <label className="block space-y-1.5">
            <span className="text-xs font-mono uppercase text-slate-400">{t.email}</span>
            <input className={inputClass} type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
          </label>
        </div>
        <button
          type="submit"
          disabled={loading}
          className="w-full inline-flex items-center justify-center gap-2 px-6 py-3 rounded-lg bg-aurix-orange text-black font-semibold text-xs font-mono uppercase tracking-wider hover:bg-orange-400 transition-colors disabled:opacity-60"
        >
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />} {t.check}
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
              {result.amountDue ? ` · ₹${result.amountDue} ${t.perTeam}` : ''}
            </p>
          </div>
          <div>
            {row(t.rowRegistration, T.status[result.status] || [t.unknown, 'wait'])}
            {row(t.rowPayment, T.payment[result.paymentStatus] || [t.unknown, 'wait'])}
            {row(t.rowIds, T.ids[result.idVerification] || [t.unknown, 'wait'])}
          </div>
          {result.paymentUrl && (
            <div className="rounded-xl border border-aurix-orange/60 bg-aurix-dark p-4 space-y-3">
              <div className="text-sm font-semibold text-white">{t.payTitle}</div>
              <a
                href={result.paymentUrl}
                className="inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-aurix-orange text-black font-semibold text-xs font-mono uppercase tracking-wider hover:bg-orange-400 transition-colors"
              >
                {t.payButton} <ExternalLink className="w-4 h-4" />
              </a>
              <p className="text-xs text-slate-400">{t.payCollege}</p>
              <p className="text-xs text-yellow-300">{t.payAlready}</p>
            </div>
          )}
          <div className="space-y-2">
            <div className="text-xs font-mono uppercase text-slate-400">{t.membersTitle}</div>
            <ul className="text-sm text-slate-200 space-y-1">
              {result.members.map((m, i) => (
                <li key={i}>
                  {m.name} <span className="text-slate-400">— {m.college}</span>
                  {i === 0 && <span className="ml-2 text-[10px] font-mono uppercase text-aurix-orange">{t.leaderBadge}</span>}
                </li>
              ))}
            </ul>
          </div>
          <p className="text-xs text-slate-400">
            {fill(t.registeredNote, {
              date: new Date(result.registeredAt).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short', timeZone: 'Asia/Kolkata' }),
            })}
          </p>
        </div>
      )}
    </div>
  )
}
