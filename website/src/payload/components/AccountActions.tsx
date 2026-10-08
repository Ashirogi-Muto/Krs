'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import { fill } from '../../lib/form-texts-defaults'
import type { StaffTexts } from '../../lib/staff-texts-defaults'

type Action = 'confirm' | 'resend' | 'reset' | 'unlock' | 'delete'

const btn: React.CSSProperties = {
  padding: '4px 10px',
  borderRadius: 4,
  border: '1px solid var(--theme-elevation-200)',
  background: 'var(--theme-elevation-50)',
  color: 'var(--theme-text)',
  fontSize: 12,
  cursor: 'pointer',
}

/** One account's buttons on the Accounts screen; the server re-checks every permission. */
export function AccountActions({
  userId, label, canConfirm, canUnlock, canDelete, t,
}: { userId: number; label: string; canConfirm: boolean; canUnlock: boolean; canDelete: boolean; t: StaffTexts['accounts'] }) {
  const router = useRouter()
  const [busy, setBusy] = useState<Action | null>(null)
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null)

  async function run(action: Action, question?: string) {
    if (question && !window.confirm(question)) return
    setBusy(action)
    setMsg(null)
    try {
      const res = await fetch('/api/admin/accounts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, userId }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data.error || t.actFailed)
      setMsg({ ok: true, text: data.message || t.actDone })
      router.refresh()
    } catch (err: any) {
      setMsg({ ok: false, text: err.message })
    } finally {
      setBusy(null)
    }
  }

  const b = (action: Action, text: string, question?: string, danger = false) => (
    <button
      type="button"
      style={danger ? { ...btn, borderColor: 'var(--theme-error-300)', color: 'var(--theme-error-700)' } : btn}
      disabled={busy !== null}
      onClick={() => run(action, question)}
    >
      {busy === action ? '…' : text}
    </button>
  )

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6, minWidth: 200 }}>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
        {canConfirm && b('confirm', t.actConfirm, fill(t.actConfirmQuestion, { label }))}
        {canConfirm && b('resend', t.actResend, fill(t.actResendQuestion, { label }))}
        {b('reset', t.actReset, fill(t.actResetQuestion, { label }))}
        {canUnlock && b('unlock', t.actUnlock)}
        {canDelete && b('delete', t.actDelete, fill(t.actDeleteQuestion, { label }), true)}
      </div>
      {msg && (
        <span role="status" style={{ fontSize: 12, color: msg.ok ? 'var(--theme-success-700)' : 'var(--theme-error-600)' }}>
          {msg.text}
        </span>
      )}
    </div>
  )
}
