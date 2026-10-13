'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'

type T = { label: string; placeholder: string; apply: string; applying: string; remove: string; replaceNote: string; failed: string }

/** Checkout step: apply or remove a coupon. The server works out and stores the amount; the page then reloads it. */
export function CouponBox({ code, current, t }: { code: string; current: string | null; t: T }) {
  const router = useRouter()
  const [value, setValue] = useState('')
  const [busy, setBusy] = useState(false)
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null)
  const send = async (method: 'POST' | 'DELETE') => {
    setBusy(true)
    setMsg(null)
    try {
      const res = await fetch('/api/aurix/coupon', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(method === 'POST' ? { code, coupon: value } : { code }),
      })
      const data = await res.json().catch(() => ({}))
      setMsg({ ok: Boolean(data?.success), text: String(data?.message || t.failed) })
      if (data?.success) {
        setValue('')
        router.refresh()
      }
    } catch {
      setMsg({ ok: false, text: t.failed })
    } finally {
      setBusy(false)
    }
  }
  return (
    <div className="rounded-xl border border-aurix-border bg-aurix-dark/60 p-4 space-y-3">
      <label htmlFor="coupon-code" className="block text-sm font-semibold text-white">
        {t.label}
      </label>
      <form
        className="flex flex-col sm:flex-row gap-2"
        onSubmit={(e) => {
          e.preventDefault()
          if (value.trim()) send('POST')
        }}
      >
        <input
          id="coupon-code"
          value={value}
          onChange={(e) => setValue(e.target.value.toUpperCase())}
          placeholder={t.placeholder}
          maxLength={30}
          autoComplete="off"
          className="flex-1 rounded-lg border border-aurix-border bg-aurix-dark px-4 py-2.5 font-mono text-sm text-white placeholder:text-slate-500 focus:border-aurix-orange focus:outline-none"
        />
        <button type="submit" disabled={busy || !value.trim()} className="rounded-lg bg-white/10 border border-aurix-border px-5 py-2.5 text-xs font-mono uppercase tracking-wider text-white hover:border-aurix-orange disabled:opacity-50">
          {busy ? t.applying : t.apply}
        </button>
      </form>
      {current && (
        <button type="button" disabled={busy} onClick={() => send('DELETE')} className="text-xs text-slate-400 underline hover:text-white disabled:opacity-50">
          {t.remove}
        </button>
      )}
      <p className="text-xs text-slate-500">{t.replaceNote}</p>
      {msg && (
        <p role="status" className={`text-sm ${msg.ok ? 'text-emerald-300' : 'text-red-300'}`}>
          {msg.text}
        </p>
      )}
    </div>
  )
}
