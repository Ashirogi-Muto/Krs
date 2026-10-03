'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { Loader2, Lock } from 'lucide-react'

export function ResetForm({ token, t }: { token: string; t: { resetLabel: string; resetButton: string; resetDone: string; portalButton: string; backToLogin: string } }) {
  const [password, setPassword] = useState('')
  const [state, setState] = useState<'idle' | 'busy' | 'done'>('idle')
  const [error, setError] = useState('')
  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setState('busy')
    setError('')
    const res = await fetch('/api/auth/reset-password', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ token, password }) })
    const data = await res.json().catch(() => ({}))
    if (!res.ok || !data.success) {
      setError(data.message || 'Please try again.')
      setState('idle')
      return
    }
    setState('done')
  }
  if (!token) return <p className="text-sm text-red-400">This reset link is incomplete. Please request a new one.</p>
  if (state === 'done')
    return (
      <div className="space-y-4">
        <p className="text-slate-300 text-sm" role="status">{t.resetDone}</p>
        <Link href="/aurix/portal" className="text-xs font-mono text-aurix-orange hover:underline">{t.portalButton}</Link>
      </div>
    )
  return (
    <form onSubmit={submit} className="space-y-4">
      <label className="block space-y-1.5">
        <span className="text-xs font-mono text-slate-300">{t.resetLabel}</span>
        <div className="relative">
          <Lock className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
          <input
            type="password"
            required
            minLength={8}
            maxLength={128}
            autoComplete="new-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full pl-9 pr-3 py-2.5 rounded-lg bg-aurix-dark border border-aurix-border text-sm text-white focus:outline-none focus:border-aurix-orange"
          />
        </div>
      </label>
      {error && <p className="text-xs text-red-400" role="alert">{error}</p>}
      <button type="submit" disabled={state === 'busy'} className="w-full inline-flex items-center justify-center gap-2 px-6 py-3 rounded-lg bg-aurix-orange text-black font-semibold text-xs font-mono uppercase hover:bg-orange-400 disabled:opacity-60">
        {state === 'busy' && <Loader2 className="w-4 h-4 animate-spin" />} {t.resetButton}
      </button>
      <Link href="/forgot-password" className="block text-center text-xs font-mono text-slate-400 hover:text-white">{t.backToLogin}</Link>
    </form>
  )
}
