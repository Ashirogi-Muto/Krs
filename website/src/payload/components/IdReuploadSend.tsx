'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'

/** Deadline + "Send email to N team(s)" (POST /api/admin/id-reupload). */
export function IdReuploadSend({
  t, pending, min, max, defaultDeadline,
}: {
  t: { deadlineLabel: string; send: string; sending: string; failed: string; nothingToSend: string }
  pending: number
  min: string
  max: string
  defaultDeadline: string
}) {
  const router = useRouter()
  const [deadline, setDeadline] = useState(defaultDeadline)
  const [state, setState] = useState<'idle' | 'busy'>('idle')
  const [message, setMessage] = useState('')
  const [error, setError] = useState(false)
  const send = async () => {
    setState('busy')
    setMessage('')
    try {
      const res = await fetch('/api/admin/id-reupload', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ deadline }) })
      const body = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(body.error || t.failed)
      setError(false)
      setMessage(body.message)
      router.refresh()
    } catch (err: any) {
      setError(true)
      setMessage(err.message || t.failed)
    } finally {
      setState('idle')
    }
  }
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'flex-end', gap: 16 }}>
      <label style={{ display: 'flex', flexDirection: 'column', gap: 6, fontSize: 13 }}>
        {t.deadlineLabel}
        <input
          type="date"
          value={deadline}
          min={min}
          max={max}
          onChange={(e) => setDeadline(e.target.value)}
          style={{ padding: '8px 10px', borderRadius: 4, border: '1px solid var(--theme-elevation-150)', background: 'var(--theme-input-bg)', color: 'var(--theme-text)' }}
        />
      </label>
      <button type="button" className="btn btn--style-primary btn--size-medium" style={{ margin: 0 }} disabled={state === 'busy' || pending === 0} onClick={send}>
        {state === 'busy' ? t.sending : t.send}
      </button>
      {pending === 0 && !message && <span style={{ fontSize: 13, color: 'var(--theme-elevation-600)' }}>{t.nothingToSend}</span>}
      {message && (
        <span role="status" style={{ fontSize: 13, color: error ? 'var(--theme-error-500)' : 'var(--theme-success-600)' }}>
          {message}
        </span>
      )}
    </div>
  )
}
