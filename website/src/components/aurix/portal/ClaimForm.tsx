'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { AlertCircle, CheckCircle2, KeyRound, Loader2, ArrowRight } from 'lucide-react'
import type { PortalTexts } from '@/lib/portal-texts-defaults'
import { fill } from '@/lib/form-texts-defaults'

const inputClass =
  'w-full px-3 py-2.5 rounded-lg bg-aurix-dark border border-aurix-border text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-aurix-orange font-mono'

/** Wording: CMS → Website → Participant portal → Claim (passed in by the server page). */
export function ClaimForm({ userEmail, t }: { userEmail: string; t: PortalTexts['claim'] }) {
  const [code, setCode] = useState('')
  const [leaderEmail, setLeaderEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [successData, setSuccessData] = useState<{ registrationCode: string; teamName: string } | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    try {
      const res = await fetch('/api/aurix/portal/claim', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: code.trim(), leaderEmail: leaderEmail.trim() }),
      })

      const data = await res.json().catch(() => ({}))
      if (!res.ok || !data.success) {
        throw new Error(data.message || t.failed)
      }

      setSuccessData(data.registration || { registrationCode: code.toUpperCase(), teamName: 'Your Team' })
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  if (successData) {
    return (
      <div className="aurix-card rounded-2xl p-6 sm:p-8 space-y-5 border-emerald-800/80">
        <div className="w-12 h-12 rounded-xl bg-emerald-950/60 border border-emerald-700 flex items-center justify-center text-emerald-400">
          <CheckCircle2 className="w-6 h-6" />
        </div>
        <div className="space-y-1">
          <h2 className="text-xl font-display font-bold text-white">{t.successTitle}</h2>
          <p className="text-sm text-slate-300">{fill(t.successText, { team: successData.teamName, code: successData.registrationCode })}</p>
        </div>
        <div className="pt-2 flex flex-col sm:flex-row gap-3">
          <Link
            href="/aurix/portal"
            className="inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-lg bg-aurix-orange text-black font-semibold text-xs font-mono uppercase tracking-wider hover:bg-orange-400 transition-colors"
          >
            {t.dashboardButton} <ArrowRight className="w-4 h-4" />
          </Link>
          <button
            type="button"
            onClick={() => {
              setSuccessData(null)
              setCode('')
              setLeaderEmail('')
            }}
            className="px-6 py-2.5 rounded-lg bg-aurix-dark border border-aurix-border text-slate-300 text-xs font-mono uppercase hover:text-white transition-colors"
          >
            {t.another}
          </button>
        </div>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="aurix-card rounded-2xl p-6 sm:p-8 space-y-6">
      <div className="space-y-1 border-b border-aurix-border/60 pb-4">
        <h2 className="text-lg font-display font-bold text-white flex items-center gap-2">
          <KeyRound className="w-4 h-4 text-aurix-orange" /> {t.formTitle}
        </h2>
        <p className="text-xs text-slate-400">{fill(t.formIntro, { email: userEmail })}</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <label className="block space-y-1.5">
          <span className="text-xs font-mono uppercase text-slate-400">{t.codeLabel}</span>
          <input
            className={`${inputClass} uppercase`}
            placeholder={t.codePlaceholder}
            value={code}
            onChange={(e) => setCode(e.target.value)}
            required
            autoCapitalize="characters"
          />
        </label>

        <label className="block space-y-1.5">
          <span className="text-xs font-mono uppercase text-slate-400">{t.emailLabel}</span>
          <input
            className={inputClass}
            type="email"
            placeholder={t.emailPlaceholder}
            value={leaderEmail}
            onChange={(e) => setLeaderEmail(e.target.value)}
            required
          />
        </label>
      </div>

      {error && (
        <div className="p-3 rounded-lg bg-red-950/50 border border-red-800 text-red-300 text-xs sm:text-sm flex items-start gap-2">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2">
        <button
          type="submit"
          disabled={loading}
          className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-lg bg-aurix-orange text-black font-semibold text-xs font-mono uppercase tracking-wider hover:bg-orange-400 transition-colors disabled:opacity-60"
        >
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <KeyRound className="w-4 h-4" />}
          {t.submit}
        </button>

        <Link
          href="/aurix/portal"
          className="text-xs font-mono text-slate-400 hover:text-white hover:underline"
        >
          {t.back}
        </Link>
      </div>
    </form>
  )
}
