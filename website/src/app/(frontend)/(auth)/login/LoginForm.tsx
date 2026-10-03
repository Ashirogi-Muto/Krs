'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Flame, ArrowRight, Lock, Mail, AlertCircle } from 'lucide-react'
import type { FormTexts } from '@/lib/form-texts-defaults'

export function LoginForm({ t, next = '/aurix/portal' }: { t: FormTexts['signIn']; next?: string }) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      // In production calls Payload /api/users/login
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      })

      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.message || t.loginError)
      }

      router.push(next) // validated on the server page (site paths only)
      router.refresh()
    } catch (err: any) {
      setError(err.message || 'Authentication failed. Please verify credentials.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-aurix-dark flex flex-col justify-center items-center p-4 sm:p-6 bg-aurix-grid">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center space-y-2">
          <Link href="/aurix" className="inline-flex items-center gap-2 group">
            <div className="w-10 h-10 rounded-lg bg-aurix-surface border border-aurix-border flex items-center justify-center text-aurix-orange group-hover:scale-105 transition-transform">
              <Flame className="w-5 h-5" />
            </div>
          </Link>
          <h1 className="text-2xl sm:text-3xl font-display font-extrabold text-white uppercase tracking-tight">
            {t.loginTitle}
          </h1>
          <p className="text-slate-400 text-xs font-mono">
            {t.loginSubtitle}
          </p>
        </div>

        {error && (
          <div className="p-3.5 rounded-lg bg-red-950/50 border border-red-800 text-red-300 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleLogin} className="aurix-card rounded-2xl p-6 sm:p-8 space-y-5 border-aurix-border">
          <div className="space-y-1.5">
            <label htmlFor="loginEmail" className="text-xs font-mono text-slate-300 block">
              {t.email}
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
              <input
                id="loginEmail"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={t.emailPlaceholder}
                className="w-full pl-9 pr-4 py-2.5 rounded-lg bg-aurix-dark border border-aurix-border text-white text-sm focus:border-aurix-orange outline-none"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label htmlFor="loginPassword" text-slate-300 className="text-xs font-mono text-slate-300 block">
                {t.password}
              </label>
              <Link
                href="/forgot-password"
                className="text-[11px] font-mono text-aurix-orange hover:underline"
              >
                {t.forgot}
              </Link>
            </div>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
              <input
                id="loginPassword"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                className="w-full pl-9 pr-4 py-2.5 rounded-lg bg-aurix-dark border border-aurix-border text-white text-sm focus:border-aurix-orange outline-none"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full inline-flex items-center justify-center gap-2 py-3 rounded-lg bg-aurix-orange text-black font-semibold text-xs font-mono uppercase tracking-wider hover:bg-orange-400 transition-colors shadow-lg disabled:opacity-50"
          >
            {loading ? t.loginBusy : t.loginButton}
            <ArrowRight className="w-4 h-4" />
          </button>

          <div className="pt-4 border-t border-aurix-border/60 text-center text-xs font-mono text-slate-400">
            {t.noAccount}{' '}
            <Link href={`/register?next=${encodeURIComponent(next)}`} className="text-aurix-orange font-semibold hover:underline">
              {t.registerLink}
            </Link>
          </div>
        </form>
      </div>
    </div>
  )
}
