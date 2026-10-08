'use client'

import React, { useMemo, useState } from 'react'
import { guessColumns, parseAmount, parseCsv, type PaymentRow } from '@/lib/payments/match'
import { fill } from '@/lib/form-texts-defaults'
import type { StaffTexts } from '@/lib/staff-texts-defaults'

type Field = keyof PaymentRow
type Result = {
  row: PaymentRow
  kind: 'MATCH' | 'ALREADY_RECORDED' | 'CHECK' | 'NO_MATCH' | 'NOT_PAID' | 'DUPLICATE'
  reasons: string[]
  reg: { id: number; code: string; team: string; event: string; amountDue: number | null; paymentStatus: string } | null
}

type T = StaffTexts['payments']
const fieldList = (t: T): [Field, string, boolean][] => [
  ['paymentId', t.fieldPaymentId, true],
  ['email', t.fieldEmail, true],
  ['phone', t.fieldPhone, true],
  ['amount', t.fieldAmount, true],
  ['event', t.fieldEvent, true],
  ['status', t.fieldStatus, false],
  ['paidAt', t.fieldPaidAt, false],
]
const kindLabels = (t: T): Record<Result['kind'], string> => ({
  MATCH: t.kindMatch,
  CHECK: t.kindCheck,
  ALREADY_RECORDED: t.kindRecorded,
  DUPLICATE: t.kindDuplicate,
  NOT_PAID: t.kindNotPaid,
  NO_MATCH: t.kindNoMatch,
})
const KIND_STYLE: Record<Result['kind'], string> = {
  MATCH: 'text-emerald-400',
  CHECK: 'text-amber-300',
  ALREADY_RECORDED: 'text-slate-400',
  DUPLICATE: 'text-red-400',
  NOT_PAID: 'text-slate-400',
  NO_MATCH: 'text-red-400',
}
const ORDER: Result['kind'][] = ['MATCH', 'CHECK', 'DUPLICATE', 'NO_MATCH', 'NOT_PAID', 'ALREADY_RECORDED']

export default function PaymentMatcher({ t }: { t: T }) {
  const FIELDS = fieldList(t)
  const KIND_LABEL = kindLabels(t)
  const [fileName, setFileName] = useState('')
  const [table, setTable] = useState<string[][]>([])
  const [map, setMap] = useState<Partial<Record<Field, string>>>({})
  const [paise, setPaise] = useState(false)
  const [results, setResults] = useState<Result[] | null>(null)
  const [picked, setPicked] = useState<Set<number>>(new Set())
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null)

  const headersRow = table[0] || []
  const dataRows = table.slice(1)

  const onFile = async (f: File | undefined) => {
    setResults(null)
    setMessage(null)
    if (!f) return
    if (!/\.csv$/i.test(f.name)) {
      setMessage({ ok: false, text: t.notCsv })
      return
    }
    const rows = parseCsv(await f.text())
    setFileName(f.name)
    setTable(rows)
    setMap(guessColumns(rows[0] || []))
  }

  const rows: PaymentRow[] = useMemo(() => {
    const col = (f: Field) => (map[f] ? headersRow.indexOf(map[f]!) : -1)
    const get = (r: string[], f: Field) => (col(f) >= 0 ? (r[col(f)] ?? '').trim() : '')
    return dataRows.map((r) => ({
      paymentId: get(r, 'paymentId'),
      email: get(r, 'email'),
      phone: get(r, 'phone'),
      amount: parseAmount(get(r, 'amount'), paise),
      event: get(r, 'event'),
      status: get(r, 'status'),
      paidAt: get(r, 'paidAt') || undefined,
    }))
  }, [dataRows, headersRow, map, paise])

  const ready = FIELDS.every(([f, , required]) => !required || map[f])

  const preview = async () => {
    setBusy(true)
    setMessage(null)
    const r = await fetch('/api/admin/payment-matching', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ rows }),
    })
    setBusy(false)
    if (!r.ok) return setMessage({ ok: false, text: (await r.json().catch(() => ({})))?.error || t.previewFailed })
    const res: Result[] = (await r.json()).results
    setResults(res)
    setPicked(new Set(res.map((x, i) => (x.kind === 'MATCH' ? i : -1)).filter((i) => i >= 0)))
  }

  const apply = async () => {
    if (!results) return
    const items = [...picked].map((i) => results[i]).filter((x) => x.reg)
    if (!items.length) return
    if (!window.confirm(fill(t.confirmApply, { count: items.length }))) return
    setBusy(true)
    const r = await fetch('/api/admin/payment-matching', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ apply: items.map((x) => ({ id: x.reg!.id, paymentId: x.row.paymentId, paidAt: x.row.paidAt })) }),
    })
    setBusy(false)
    if (!r.ok) return setMessage({ ok: false, text: t.saveFailed })
    const { updated, skipped } = await r.json()
    setMessage({ ok: true, text: fill(t.saved, { count: updated.length }) + (skipped.length ? fill(t.skipped, { list: skipped.join(', ') }) : '') })
    await preview()
  }

  const counts = results ? ORDER.map((k) => [k, results.filter((r) => r.kind === k).length] as const).filter(([, n]) => n) : []
  const sorted = results ? results.map((r, i) => ({ r, i })).sort((a, b) => ORDER.indexOf(a.r.kind) - ORDER.indexOf(b.r.kind)) : []

  return (
    <div className="space-y-6">
      <section className="rounded-xl border border-aurix-border bg-aurix-surface p-4 space-y-3">
        <p className="text-sm text-slate-300">
          {t.step1.split('{csv}').map((part, i) => (i === 0 ? part : <React.Fragment key={i}><strong>{t.csvWord}</strong>{part}</React.Fragment>))}
        </p>
        <input type="file" accept=".csv,text/csv" onChange={(e) => onFile(e.target.files?.[0])} className="text-sm" />
        {fileName && (
          <p className="text-xs text-slate-500">
            {fill(t.rows, { file: fileName, count: dataRows.length })}
          </p>
        )}
      </section>

      {headersRow.length > 0 && (
        <section className="rounded-xl border border-aurix-border bg-aurix-surface p-4 space-y-3">
          <p className="text-sm text-slate-300">{t.step2}</p>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {FIELDS.map(([f, label, required]) => (
              <label key={f} className="text-xs space-y-1 block">
                <span className="text-slate-400">
                  {label}
                  {required ? ' *' : ''}
                </span>
                <select
                  value={map[f] || ''}
                  onChange={(e) => setMap({ ...map, [f]: e.target.value || undefined })}
                  className="w-full rounded bg-aurix-dark border border-aurix-border px-2 py-1.5 text-sm text-white"
                >
                  <option value="">—</option>
                  {headersRow.map((h) => (
                    <option key={h} value={h}>
                      {h}
                    </option>
                  ))}
                </select>
              </label>
            ))}
          </div>
          <label className="flex items-center gap-2 text-xs text-slate-400">
            <input type="checkbox" checked={paise} onChange={(e) => setPaise(e.target.checked)} />
            {t.paise}
          </label>
          {rows[0] && (
            <p className="text-xs text-slate-500">
              {t.firstRow} {rows[0].paymentId || '?'} · {rows[0].email || '?'} · {rows[0].phone || '?'} · ₹{rows[0].amount ?? '?'} · {rows[0].event || '?'} ·{' '}
              {rows[0].status || t.noStatus}
            </p>
          )}
          <button disabled={!ready || busy} onClick={preview} className="rounded-lg bg-aurix-orange px-4 py-2 font-semibold text-black disabled:opacity-50">
            {t.preview}
          </button>
        </section>
      )}

      {message && <p className={`text-sm ${message.ok ? 'text-emerald-400' : 'text-amber-400'}`}>{message.text}</p>}

      {results && (
        <section className="space-y-3">
          <div className="flex flex-wrap items-center gap-4 text-sm">
            {counts.map(([k, n]) => (
              <span key={k} className={KIND_STYLE[k]}>
                {KIND_LABEL[k]}: {n}
              </span>
            ))}
            <button disabled={busy || picked.size === 0} onClick={apply} className="ml-auto rounded-lg bg-emerald-500 px-4 py-2 font-semibold text-black disabled:opacity-50">
              {fill(t.apply, { count: picked.size })}
            </button>
          </div>
          <p className="text-xs text-slate-500">{t.hint}</p>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs text-slate-500">
                  <th className="p-2"></th>
                  <th className="p-2 font-normal">{t.colResult}</th>
                  <th className="p-2 font-normal">{t.colPayment}</th>
                  <th className="p-2 font-normal">{t.colPayer}</th>
                  <th className="p-2 font-normal">{t.colRegistration}</th>
                  <th className="p-2 font-normal">{t.colWhy}</th>
                </tr>
              </thead>
              <tbody>
                {sorted.map(({ r, i }) => {
                  const selectable = (r.kind === 'MATCH' || r.kind === 'CHECK') && !!r.reg && !!r.row.paymentId
                  return (
                    <tr key={i} className="border-t border-aurix-border align-top">
                      <td className="p-2">
                        {selectable && (
                          <input
                            type="checkbox"
                            checked={picked.has(i)}
                            onChange={(e) => {
                              const next = new Set(picked)
                              if (e.target.checked) next.add(i)
                              else next.delete(i)
                              setPicked(next)
                            }}
                          />
                        )}
                      </td>
                      <td className={`p-2 whitespace-nowrap ${KIND_STYLE[r.kind]}`}>{KIND_LABEL[r.kind]}</td>
                      <td className="p-2 whitespace-nowrap">
                        <div className="font-mono text-xs">{r.row.paymentId || '—'}</div>
                        <div className="text-xs text-slate-400">
                          ₹{r.row.amount ?? '?'} · {r.row.event}
                        </div>
                      </td>
                      <td className="p-2 text-xs">
                        <div>{r.row.email}</div>
                        <div className="text-slate-400">{r.row.phone}</div>
                      </td>
                      <td className="p-2 text-xs">
                        {r.reg ? (
                          <>
                            <div className="font-mono text-aurix-orange">{r.reg.code}</div>
                            <div>
                              {r.reg.team} · {r.reg.event}
                            </div>
                          </>
                        ) : (
                          '—'
                        )}
                      </td>
                      <td className="p-2 text-xs text-slate-400">{r.reasons.join('; ')}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </section>
      )}
    </div>
  )
}
