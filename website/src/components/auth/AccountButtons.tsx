'use client'

import React, { useState } from 'react'
import { Loader2, LogOut, Send } from 'lucide-react'

/** Ask for a new confirmation link for the logged-in account. */
export function ResendVerification({ label, done, queuedText }: { label: string; done: string; queuedText: string }) {
  const [state, setState] = useState<'idle' | 'busy' | 'done' | 'error'>('idle')
  const [msg, setMsg] = useState('')
  async function resend() {
    setState('busy')
    try {
      const res = await fetch('/api/auth/resend-verification', { method: 'POST' })
      const data = await res.json().catch(() => ({}))
      if (data.alreadyConfirmed) return window.location.reload()
      if (!res.ok || !data.success) throw new Error(data.message || 'Could not send the email.')
      setState('done')
      setMsg(data.queued ? queuedText : done)
    } catch (err: any) {
      setState('error')
      setMsg(err.message)
    }
  }
  return (
    <div className="space-y-2">
      <button
        type="button"
        onClick={resend}
        disabled={state === 'busy' || state === 'done'}
        className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-aurix-orange text-black font-semibold text-xs font-mono uppercase hover:bg-orange-400 transition-colors disabled:opacity-60"
      >
        {state === 'busy' ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />} {label}
      </button>
      {msg && <p className={`text-xs ${state === 'error' ? 'text-red-400' : msg === queuedText ? 'text-yellow-400' : 'text-green-400'}`} role="status">{msg}</p>}
    </div>
  )
}

/** End the session and go to the AURIX home page. */
export function LogoutButton({ label }: { label: string }) {
  async function logout() {
    await fetch('/api/auth/logout', { method: 'POST' }).catch(() => undefined)
    window.location.href = '/aurix'
  }
  return (
    <button type="button" onClick={logout} className="inline-flex items-center gap-1.5 text-xs font-mono text-slate-400 hover:text-white">
      <LogOut className="w-3.5 h-3.5" /> {label}
    </button>
  )
}
