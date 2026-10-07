'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { CheckCircle2, Loader2, Lock } from 'lucide-react'

type Texts = {
  verifiedText: string
  verifiedButton: string
  portalButton: string
  confirmIntro: string
  confirmPassword: string
  confirmButton: string
  confirmHelp: string
  confirmHelpLink: string
  confirmHelpAfter: string
}

/**
 * Confirming an email needs the account password too (see confirmEmail in lib/auth/participant.ts), so a sign-up made
 * with someone else's address can't be confirmed by that person clicking the email.
 * Wording: CMS → Website → Labels & messages → Account screens ("Confirm email: …").
 */
export function VerifyForm({ token, t }: { token: string; t: Texts }) {
  const [password, setPassword] = useState('')
  const [state, setState] = useState<'idle' | 'busy' | 'done'>('idle')
  const [error, setError] = useState('')
  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setState('busy')
    setError('')
    const res = await fetch('/api/auth/verify-email', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token, password }),
    })
    const data = await res.json().catch(() => ({}))
    if (!res.ok || !data.success) {
      setError(data.message || 'Please try again.')
      setState('idle')
      return
    }
    setState('done')
  }
  if (state === 'done')
    return (
      <div className="space-y-5 text-center" role="status">
        <CheckCircle2 className="w-12 h-12 text-green-400 mx-auto" />
        <p className="text-slate-300 text-sm">{t.verifiedText}</p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            href="/aurix/register"
            className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-lg bg-aurix-orange text-black font-semibold text-xs font-mono uppercase hover:bg-orange-400 transition-colors"
          >
            {t.verifiedButton}
          </Link>
          <Link href="/aurix/portal" className="text-xs font-mono text-slate-300 hover:text-white self-center">
            {t.portalButton}
          </Link>
        </div>
      </div>
    )
  return (
    <form onSubmit={submit} className="space-y-4">
      <p className="text-slate-300 text-sm">{t.confirmIntro}</p>
      <label className="block space-y-1.5">
        <span className="text-xs font-mono text-slate-300">{t.confirmPassword}</span>
        <div className="relative">
          <Lock className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
          <input
            type="password"
            required
            maxLength={128}
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full pl-9 pr-3 py-2.5 rounded-lg bg-aurix-dark border border-aurix-border text-sm text-white focus:outline-none focus:border-aurix-orange"
          />
        </div>
      </label>
      {error && (
        <p className="text-xs text-red-400" role="alert">
          {error}
        </p>
      )}
      <button
        type="submit"
        disabled={state === 'busy'}
        className="w-full inline-flex items-center justify-center gap-2 px-6 py-3 rounded-lg bg-aurix-orange text-black font-semibold text-xs font-mono uppercase hover:bg-orange-400 disabled:opacity-60"
      >
        {state === 'busy' && <Loader2 className="w-4 h-4 animate-spin" />} {t.confirmButton}
      </button>
      <p className="text-xs text-slate-400">
        {t.confirmHelp}{' '}
        <Link href="/forgot-password" className="text-aurix-orange hover:underline">
          {t.confirmHelpLink}
        </Link>
        {t.confirmHelpAfter}
      </p>
    </form>
  )
}
