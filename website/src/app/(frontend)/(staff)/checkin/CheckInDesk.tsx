'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { fill } from '@/lib/form-texts-defaults'
import type { StaffTexts } from '@/lib/staff-texts-defaults'

type Member = { name: string; college: string; answers?: string }
type Team = {
  id: number
  code: string
  team: string
  event: string
  college: string
  members: Member[]
  status: string
  paymentStatus: string
  idVerification: string
  checkedIn: boolean
  checkedInAt: string | null
  checkedInBy: string | null
  receiptMissing?: boolean
}
type Summary = { event: string; registered: number; confirmed: number; arrived: number }

const time = (iso: string | null) =>
  iso ? new Date(iso).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Kolkata' }) : ''

/** Warnings the desk should see before letting a team in (the desk still decides). */
function warnings(t: Team, L: StaffTexts['checkin']): string[] {
  const w: string[] = []
  if (t.status !== 'CONFIRMED') w.push(fill(L.warnRegistration, { status: t.status.toLowerCase() }))
  if (t.paymentStatus !== 'PAID_VERIFIED') w.push(L.warnPayment)
  if (t.idVerification !== 'APPROVED') w.push(fill(L.warnId, { status: t.idVerification.toLowerCase() }))
  return w
}

export default function CheckInDesk({ limited, t: L }: { limited: boolean; t: StaffTexts['checkin'] }) {
  const [q, setQ] = useState('')
  const [results, setResults] = useState<Team[]>([])
  const [summary, setSummary] = useState<Summary[]>([])
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null)
  const input = useRef<HTMLInputElement>(null)

  const loadSummary = useCallback(async () => {
    const r = await fetch('/api/admin/check-in?summary=1', { cache: 'no-store' })
    if (r.ok) setSummary((await r.json()).events)
  }, [])

  useEffect(() => {
    loadSummary()
    const t = setInterval(loadSummary, 30000)
    return () => clearInterval(t)
  }, [loadSummary])

  const search = async (e?: React.FormEvent) => {
    e?.preventDefault()
    setMessage(null)
    if (q.trim().length < 2) return
    setBusy(true)
    const r = await fetch(`/api/admin/check-in?q=${encodeURIComponent(q.trim())}`, { cache: 'no-store' })
    setBusy(false)
    if (!r.ok) return setMessage({ ok: false, text: L.searchFailed })
    const found: Team[] = (await r.json()).results
    setResults(found)
    if (!found.length) setMessage({ ok: false, text: limited ? L.noTeamLimited : L.noTeam })
  }

  const mark = async (t: Team, arrived: boolean) => {
    setBusy(true)
    const r = await fetch('/api/admin/check-in', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: t.id, arrived }),
    })
    setBusy(false)
    if (!r.ok) return setMessage({ ok: false, text: (await r.json().catch(() => ({})))?.error || L.saveFailed })
    const { team } = await r.json()
    setResults((list) => list.map((x) => (x.id === team.id ? team : x)))
    setMessage({ ok: true, text: arrived ? fill(L.checkedIn, { team: team.team }) : fill(L.undone, { team: team.team }) })
    loadSummary()
    if (arrived) {
      setQ('')
      input.current?.focus()
    }
  }

  return (
    <div className="space-y-6">
      <form onSubmit={search} className="flex gap-2">
        <input
          ref={input}
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder={L.searchPlaceholder}
          autoFocus
          autoCapitalize="characters"
          className="flex-1 rounded-lg bg-aurix-surface border border-aurix-border px-4 py-3 text-base text-white placeholder:text-slate-500 focus:outline-none focus:border-aurix-orange"
        />
        <button disabled={busy} className="rounded-lg bg-aurix-orange px-5 py-3 font-semibold text-black disabled:opacity-60">
          {L.find}
        </button>
      </form>

      {message && <p className={`text-sm ${message.ok ? 'text-emerald-400' : 'text-amber-400'}`}>{message.text}</p>}

      <div className="space-y-4">
        {results.map((t) => {
          const warn = warnings(t, L)
          return (
            <section key={t.id} className={`rounded-xl border p-4 space-y-3 ${t.checkedIn ? 'border-emerald-600 bg-emerald-950/30' : 'border-aurix-border bg-aurix-surface'}`}>
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs font-mono text-aurix-orange">{t.code}</p>
                  <h2 className="text-lg font-bold text-white">{t.team}</h2>
                  <p className="text-sm text-slate-400">
                    {t.event} · {t.college}
                  </p>
                </div>
                {t.checkedIn ? (
                  <button disabled={busy} onClick={() => mark(t, false)} className="shrink-0 rounded-lg border border-slate-600 px-3 py-2 text-xs text-slate-300">
                    {L.undo}
                  </button>
                ) : t.receiptMissing ? null : (
                  <button disabled={busy} onClick={() => mark(t, true)} className="shrink-0 rounded-lg bg-emerald-500 px-4 py-3 font-semibold text-black disabled:opacity-60">
                    {L.markArrived}
                  </button>
                )}
              </div>
              {!t.checkedIn && t.receiptMissing && <p className="text-sm font-semibold text-red-300">{L.blockReceipt}</p>}
              {t.checkedIn && (
                <p className="text-sm text-emerald-400">
                  {fill(L.arrivedAt, { time: time(t.checkedInAt) })}
                  {t.checkedInBy ? fill(L.arrivedBy, { name: t.checkedInBy }) : ''}
                </p>
              )}
              {warn.length > 0 && (
                <ul className="flex flex-wrap gap-2">
                  {warn.map((w) => (
                    <li key={w} className="rounded bg-amber-500/15 border border-amber-600/50 px-2 py-0.5 text-xs text-amber-300">
                      {w}
                    </li>
                  ))}
                </ul>
              )}
              <ol className="text-sm text-slate-300 space-y-0.5 list-decimal list-inside">
                {t.members.map((m, i) => (
                  <li key={i}>
                    {m.name} <span className="text-slate-500">· {m.college}</span>
                    {m.answers ? <span className="block text-xs text-aurix-orange/90">{m.answers}</span> : null}
                  </li>
                ))}
              </ol>
            </section>
          )
        })}
      </div>

      {summary.length > 0 && (
        <section className="space-y-2">
          <h2 className="text-sm font-mono uppercase tracking-wider text-slate-400">{L.arrivalsTitle}{limited ? L.arrivalsLimited : ''}</h2>
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-slate-500 text-xs">
                <th className="py-1 font-normal">{L.colEvent}</th>
                <th className="py-1 font-normal text-right">{L.colArrived}</th>
                <th className="py-1 font-normal text-right">{L.colConfirmed}</th>
                <th className="py-1 font-normal text-right">{L.colRegistered}</th>
              </tr>
            </thead>
            <tbody>
              {summary.map((s) => (
                <tr key={s.event} className="border-t border-aurix-border">
                  <td className="py-2 text-white">{s.event}</td>
                  <td className="py-2 text-right font-semibold text-emerald-400">{s.arrived}</td>
                  <td className="py-2 text-right">{s.confirmed}</td>
                  <td className="py-2 text-right text-slate-400">{s.registered}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      )}
    </div>
  )
}
