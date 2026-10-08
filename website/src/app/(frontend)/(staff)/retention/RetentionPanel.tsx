'use client'

import { useCallback, useEffect, useState } from 'react'
import { fill } from '@/lib/form-texts-defaults'
import type { StaffTexts } from '@/lib/staff-texts-defaults'

type Due = { id: number; title: string; slug: string; deleteAfter: string; registrations: number; idFiles: number; emails: number }

export default function RetentionPanel({ t }: { t: StaffTexts['retention'] }) {
  const [due, setDue] = useState<Due[] | null>(null)
  const [confirm, setConfirm] = useState<Record<number, string>>({})
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null)
  const [busy, setBusy] = useState(false)

  const load = useCallback(async () => {
    const r = await fetch('/api/admin/retention', { cache: 'no-store' })
    setDue(r.ok ? (await r.json()).due : [])
  }, [])
  useEffect(() => {
    load()
  }, [load])

  const purge = async (ev: Due) => {
    setBusy(true)
    setMessage(null)
    const r = await fetch('/api/admin/retention', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ eventId: ev.id, confirm: confirm[ev.id] || '' }),
    })
    setBusy(false)
    const body = await r.json().catch(() => ({}))
    if (!r.ok) return setMessage({ ok: false, text: body.error || t.deleteFailed })
    const d = body.deleted
    setMessage({ ok: true, text: fill(t.deleted, { event: d.event, registrations: d.registrations, files: d.idFiles, emails: d.emails }) })
    load()
  }

  if (!due) return <p className="text-sm text-slate-500">{t.loading}</p>
  return (
    <div className="space-y-4">
      {message && <p className={`text-sm ${message.ok ? 'text-emerald-400' : 'text-amber-400'}`}>{message.text}</p>}
      {due.length === 0 && <p className="text-sm text-emerald-400">{t.nothingDue}</p>}
      {due.map((ev) => (
        <section key={ev.id} className="rounded-xl border border-aurix-border bg-aurix-surface p-4 space-y-3">
          <h2 className="text-lg font-bold text-white">{ev.title}</h2>
          <p className="text-sm text-slate-400">
            {fill(t.dueSince, {
              date: new Date(ev.deleteAfter).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'Asia/Kolkata' }),
              registrations: ev.registrations,
              files: ev.idFiles,
              emails: ev.emails,
            })}
          </p>
          <a href={`/api/admin/registrations-export?view=full&event=${ev.slug}`} className="inline-block text-sm text-aurix-orange underline">
            {t.export}
          </a>
          <div className="flex flex-col sm:flex-row gap-2">
            <input
              value={confirm[ev.id] || ''}
              onChange={(e) => setConfirm({ ...confirm, [ev.id]: e.target.value })}
              placeholder={fill(t.confirmPlaceholder, { title: ev.title })}
              className="flex-1 rounded-lg bg-aurix-dark border border-aurix-border px-3 py-2 text-sm text-white"
            />
            <button
              disabled={busy || (confirm[ev.id] || '').trim() !== ev.title}
              onClick={() => purge(ev)}
              className="rounded-lg bg-red-500 px-4 py-2 text-sm font-semibold text-white disabled:opacity-40"
            >
              {t.delete}
            </button>
          </div>
        </section>
      ))}
    </div>
  )
}
