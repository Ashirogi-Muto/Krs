'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Flame, ArrowRight, Lock, Mail, User, Building, Phone, AlertCircle } from 'lucide-react'
import { fill, type FormTexts } from '@/lib/form-texts-defaults'
import { ResendVerification } from '@/components/auth/AccountButtons'

export function RegisterForm({ t, a, next = '/aurix/portal' }: { t: FormTexts['signIn']; a: FormTexts['account']; next?: string }) {
  const [done, setDone] = useState<{ email: string; deleteOn: string; verification: string } | null>(null)
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [institution, setInstitution] = useState('')
  const [phone, setPhone] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password, institution, phone }),
      })

      const data = await res.json().catch(() => ({}))
      if (!res.ok || !data.success) throw new Error(data.message || t.regError)
      setDone({ email: email.trim().toLowerCase(), deleteOn: data.deleteOn || '', verification: data.verification || '' })
    } catch (err: any) {
      setError(err.message || 'An error occurred during account creation.')
    } finally {
      setLoading(false)
    }
  }

  if (done)
    return (
      <div className="min-h-screen bg-aurix-dark flex flex-col justify-center items-center p-4 sm:p-6 bg-aurix-grid">
        <div className="w-full max-w-md aurix-card rounded-2xl p-6 sm:p-8 space-y-4 border-aurix-border">
          <h1 className="text-2xl font-display font-extrabold text-white uppercase tracking-tight">{a.checkTitle}</h1>
          <p className="text-slate-300 text-sm leading-relaxed">{fill(a.checkText, { email: done.email, date: done.deleteOn })}</p>
          {done.verification === 'queued' && <p className="text-xs text-yellow-400">{a.mailLimit}</p>}
          <p className="text-slate-400 text-xs">{a.checkSpam}</p>
          <div className="flex flex-wrap items-center justify-between gap-4 pt-2 border-t border-aurix-border/60">
            <ResendVerification label={a.resend} done={a.resent} queuedText={a.mailLimit} />
            <Link href={next} className="text-xs font-mono text-slate-300 hover:text-white">{a.portalButton}</Link>
          </div>
        </div>
      </div>
    )

  return (
    <div className="min-h-screen bg-aurix-dark flex flex-col justify-center items-center p-4 sm:p-6 bg-aurix-grid">
      <div className="w-full max-w-lg space-y-6">
        <div className="text-center space-y-2">
          <Link href="/aurix" className="inline-flex items-center gap-2 group">
            <div className="w-10 h-10 rounded-lg bg-aurix-surface border border-aurix-border flex items-center justify-center text-aurix-orange group-hover:scale-105 transition-transform">
              <Flame className="w-5 h-5" />
            </div>
          </Link>
          <h1 className="text-2xl sm:text-3xl font-display font-extrabold text-white uppercase tracking-tight">
            {t.regTitle}
          </h1>
          <p className="text-slate-400 text-xs font-mono">
            {t.regSubtitle}
          </p>
        </div>

        {error && (
          <div className="p-3.5 rounded-lg bg-red-950/50 border border-red-800 text-red-300 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleRegister} className="aurix-card rounded-2xl p-6 sm:p-8 space-y-4 border-aurix-border">
          <div className="space-y-1.5">
            <label htmlFor="regName" className="text-xs font-mono text-slate-300 block">
              {t.regName}
            </label>
            <div className="relative">
              <User className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
              <input
                id="regName"
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder={t.regNamePlaceholder}
                className="w-full pl-9 pr-4 py-2.5 rounded-lg bg-aurix-dark border border-aurix-border text-white text-sm focus:border-aurix-orange outline-none"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label htmlFor="regEmail" className="text-xs font-mono text-slate-300 block">
              {t.regEmail}
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
              <input
                id="regEmail"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={t.regEmailPlaceholder}
                className="w-full pl-9 pr-4 py-2.5 rounded-lg bg-aurix-dark border border-aurix-border text-white text-sm focus:border-aurix-orange outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label htmlFor="regInst" className="text-xs font-mono text-slate-300 block">
                {t.regCollege}
              </label>
              <div className="relative">
                <Building className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
                <input
                  id="regInst"
                  type="text"
                  required
                  value={institution}
                  onChange={(e) => setInstitution(e.target.value)}
                  placeholder={t.regCollegePlaceholder}
                  className="w-full pl-9 pr-4 py-2.5 rounded-lg bg-aurix-dark border border-aurix-border text-white text-sm focus:border-aurix-orange outline-none"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label htmlFor="regPhone" className="text-xs font-mono text-slate-300 block">
                {t.regPhone}
              </label>
              <div className="relative">
                <Phone className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
                <input
                  id="regPhone"
                  type="tel"
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder={t.regPhonePlaceholder}
                  className="w-full pl-9 pr-4 py-2.5 rounded-lg bg-aurix-dark border border-aurix-border text-white text-sm focus:border-aurix-orange outline-none"
                />
              </div>
            </div>
          </div>

          <div className="space-y-1.5">
            <label htmlFor="regPass" className="text-xs font-mono text-slate-300 block">
              {t.regPassword}
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
              <input
                id="regPass"
                type="password"
                required
                minLength={8}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                className="w-full pl-9 pr-4 py-2.5 rounded-lg bg-aurix-dark border border-aurix-border text-white text-sm focus:border-aurix-orange outline-none"
              />
            </div>
          </div>

          <p className="text-[11px] text-slate-400 leading-relaxed">{a.regNotice}</p>

          <button
            type="submit"
            disabled={loading}
            className="w-full inline-flex items-center justify-center gap-2 py-3 rounded-lg bg-aurix-orange text-black font-semibold text-xs font-mono uppercase tracking-wider hover:bg-orange-400 transition-colors shadow-lg disabled:opacity-50 mt-2"
          >
            {loading ? t.regBusy : t.regButton}
            <ArrowRight className="w-4 h-4" />
          </button>

          <div className="pt-4 border-t border-aurix-border/60 text-center text-xs font-mono text-slate-400">
            {t.haveAccount}{' '}
            <Link href={`/login?next=${encodeURIComponent(next)}`} className="text-aurix-orange font-semibold hover:underline">
              {t.loginLink}
            </Link>
          </div>
        </form>
      </div>
    </div>
  )
}
