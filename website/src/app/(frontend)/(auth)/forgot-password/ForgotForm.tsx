'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { Loader2, Mail } from 'lucide-react'
import { useTurnstile } from '@/components/auth/Turnstile'

export function ForgotForm({ t }: { t: { forgotText: string; forgotButton: string; forgotDone: string; backToLogin: string } }) {
  const [email, setEmail] = useState('')
  const [state, setState] = useState<'idle' | 'busy' | 'done'>('idle')
  const [error, setError] = useState('')
  const captcha = useTurnstile()
  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setState('busy')
    setError('')
    const res = await fetch('/api/auth/forgot-password', { method: 'POST', headers: { 'Content-Type': 'application/json', ...captcha.headers() }, body: JSON.stringify({ email }) })
    captcha.reset()
    const data = await res.json().catch(() => ({}))
    if (!res.ok) {
      setError(data.message || 'Please try again later.')
      setState('idle')
      return
    }
    setState('done')
  }
  if (state === 'done')
    return (
      <div className="space-y-4">
        <p className="text-slate-300 text-sm" role="status">{t.forgotDone}</p>
        <Link href="/login" className="text-xs font-mono text-aurix-orange hover:underline">{t.backToLogin}</Link>
      </div>
    )
  return (
    <form onSubmit={submit} className="space-y-4">
      <p className="text-slate-400 text-sm">{t.forgotText}</p>
      <div className="relative">
        <Mail className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
        <input
          type="email"
          required
          maxLength={254}
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full pl-9 pr-3 py-2.5 rounded-lg bg-aurix-dark border border-aurix-border text-sm text-white focus:outline-none focus:border-aurix-orange"
        />
      </div>
      {captcha.element}
      {error && <p className="text-xs text-red-400" role="alert">{error}</p>}
      <button type="submit" disabled={state === 'busy' || !captcha.ready} className="w-full inline-flex items-center justify-center gap-2 px-6 py-3 rounded-lg bg-aurix-orange text-black font-semibold text-xs font-mono uppercase hover:bg-orange-400 disabled:opacity-60">
        {state === 'busy' && <Loader2 className="w-4 h-4 animate-spin" />} {t.forgotButton}
      </button>
      <Link href="/login" className="block text-center text-xs font-mono text-slate-400 hover:text-white">{t.backToLogin}</Link>
    </form>
  )
}
