'use client'

import React, { useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { guessColumns, parseAmount, type PaymentRow } from '../../lib/payments/match'
import { fill } from '../../lib/form-texts-defaults'
import type { StaffTexts } from '../../lib/staff-texts-defaults'

type Field = keyof PaymentRow
type Kind = 'MATCH' | 'ALREADY_RECORDED' | 'CHECK' | 'NO_MATCH' | 'NOT_PAID' | 'DUPLICATE'
type Result = {
  row: PaymentRow
  kind: Kind
  reasons: string[]
  seenBefore: boolean
  reg: { id: number; code: string; team: string; event: string; amountDue: number | null; paymentStatus: string } | null
}
type Upload = { report: { id: number; createdAt: string }; previous: { id: number; createdAt: string } | null; table: string[][] }

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
const kindLabels = (t: T): Record<Kind, string> => ({
  MATCH: t.kindMatch,
  CHECK: t.kindCheck,
  ALREADY_RECORDED: t.kindRecorded,
  DUPLICATE: t.kindDuplicate,
  NOT_PAID: t.kindNotPaid,
  NO_MATCH: t.kindNoMatch,
})
const KIND_COLOR: Record<Kind, string> = {
  MATCH: 'var(--theme-success-500)',
  CHECK: 'var(--theme-warning-500)',
  ALREADY_RECORDED: 'var(--theme-elevation-500)',
  DUPLICATE: 'var(--theme-error-500)',
  NOT_PAID: 'var(--theme-elevation-500)',
  NO_MATCH: 'var(--theme-error-500)',
}
const ORDER: Kind[] = ['MATCH', 'CHECK', 'DUPLICATE', 'NO_MATCH', 'NOT_PAID', 'ALREADY_RECORDED']
const fmt = (iso: string) => new Date(iso).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })

const box: React.CSSProperties = { border: '1px solid var(--theme-elevation-150)', borderRadius: 6, padding: 16, marginBottom: 16 }
const muted: React.CSSProperties = { color: 'var(--theme-elevation-500)', fontSize: 13 }
const cell: React.CSSProperties = { padding: '8px 10px', borderTop: '1px solid var(--theme-elevation-100)', verticalAlign: 'top', fontSize: 13 }

/** Upload → check columns → preview → record (CMS → Registrations → Payment matching). */
export function PaymentMatcher({ t }: { t: T }) {
  const router = useRouter()
  const FIELDS = fieldList(t)
  const KIND_LABEL = kindLabels(t)
  const [fileName, setFileName] = useState('')
  const [upload, setUpload] = useState<Upload | null>(null)
  const [map, setMap] = useState<Partial<Record<Field, string>>>({})
  const [paise, setPaise] = useState(false)
  const [results, setResults] = useState<Result[] | null>(null)
  const [picked, setPicked] = useState<Set<number>>(new Set())
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null)

  const table = upload?.table || []
  const headersRow = table[0] || []
  const dataRows = useMemo(() => table.slice(1), [table])

  const onFile = async (f: File | undefined) => {
    setResults(null)
    setMessage(null)
    setUpload(null)
    if (!f) return
    if (!/\.(xlsx|csv)$/i.test(f.name)) return setMessage({ ok: false, text: t.notCsv })
    setBusy(true)
    setMessage({ ok: true, text: t.uploading })
    const form = new FormData()
    form.append('file', f)
    const r = await fetch('/api/admin/payment-matching', { method: 'POST', body: form }).catch(() => null)
    setBusy(false)
    if (!r || !r.ok) return setMessage({ ok: false, text: (await r?.json().catch(() => ({})))?.error || t.uploadFailed })
    const u: Upload = await r.json()
    setFileName(f.name)
    setUpload(u)
    setMap(guessColumns(u.table[0] || []))
    setMessage({ ok: true, text: fill(t.savedAs, { date: fmt(u.report.createdAt) }) + (u.previous ? fill(t.comparedWith, { date: fmt(u.previous.createdAt) }) : t.noPrevious) })
    router.refresh() // the stored-reports list under the tool
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

  const ready = !!upload && FIELDS.every(([f, , required]) => !required || map[f])

  const preview = async () => {
    setBusy(true)
    const r = await fetch('/api/admin/payment-matching', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ rows, reportId: upload?.report.id }),
    }).catch(() => null)
    setBusy(false)
    if (!r || !r.ok) return setMessage({ ok: false, text: (await r?.json().catch(() => ({})))?.error || t.previewFailed })
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
    }).catch(() => null)
    setBusy(false)
    if (!r || !r.ok) return setMessage({ ok: false, text: t.saveFailed })
    const { updated, skipped } = await r.json()
    await preview()
    setMessage({ ok: true, text: fill(t.saved, { count: updated.length }) + (skipped.length ? fill(t.skipped, { list: skipped.join(', ') }) : '') })
  }

  const counts = results ? ORDER.map((k) => [k, results.filter((r) => r.kind === k).length] as const).filter(([, n]) => n) : []
  // By result, then new payments before ones already in the earlier report
  const sorted = results
    ? results.map((r, i) => ({ r, i })).sort((a, b) => ORDER.indexOf(a.r.kind) - ORDER.indexOf(b.r.kind) || Number(a.r.seenBefore) - Number(b.r.seenBefore))
    : []
  const selectable = (r: Result) => (r.kind === 'MATCH' || r.kind === 'CHECK') && !!r.reg && !!r.row.paymentId && r.reg.paymentStatus !== 'PAID_VERIFIED'

  return (
    <div>
      <section style={box}>
        <p style={{ marginTop: 0 }}>
          {t.step1.split('{csv}').map((part, i) => (i === 0 ? part : <React.Fragment key={i}><strong>{t.csvWord}</strong>{part}</React.Fragment>))}
        </p>
        <input type="file" accept=".xlsx,.csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,text/csv" disabled={busy} onChange={(e) => onFile(e.target.files?.[0])} />
        {upload && <p style={muted}>{fill(t.rows, { file: fileName, count: dataRows.length })}</p>}
      </section>

      {headersRow.length > 0 && (
        <section style={box}>
          <p style={{ marginTop: 0 }}>{t.step2}</p>
          <div style={{ display: 'grid', gap: 12, gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))' }}>
            {FIELDS.map(([f, label, required]) => (
              <label key={f} style={{ display: 'block', fontSize: 13 }}>
                <span style={muted}>
                  {label}
                  {required ? ' *' : ''}
                </span>
                <select value={map[f] || ''} onChange={(e) => setMap({ ...map, [f]: e.target.value || undefined })} style={{ display: 'block', width: '100%', marginTop: 4, padding: '6px 8px' }}>
                  <option value="">—</option>
                  {headersRow.map((h, i) => (
                    <option key={`${h}-${i}`} value={h}>
                      {h}
                    </option>
                  ))}
                </select>
              </label>
            ))}
          </div>
          <label style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 12, fontSize: 13 }}>
            <input type="checkbox" checked={paise} onChange={(e) => setPaise(e.target.checked)} />
            {t.paise}
          </label>
          {rows[0] && (
            <p style={muted}>
              {t.firstRow} {rows[0].paymentId || '?'} · {rows[0].email || '?'} · {rows[0].phone || '?'} · ₹{rows[0].amount ?? '?'} · {rows[0].event || '?'} · {rows[0].status || t.noStatus}
            </p>
          )}
          <button type="button" className="btn btn--style-primary btn--size-small" disabled={!ready || busy} onClick={preview} style={{ margin: 0 }}>
            {t.preview}
          </button>
        </section>
      )}

      {message && <p style={{ color: message.ok ? 'var(--theme-success-500)' : 'var(--theme-error-500)' }} role="status">{message.text}</p>}

      {results && (
        <section>
          <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 16, fontSize: 14 }}>
            {counts.map(([k, n]) => (
              <span key={k} style={{ color: KIND_COLOR[k] }}>
                {KIND_LABEL[k]}: {n}
              </span>
            ))}
            <button type="button" className="btn btn--style-primary btn--size-small" disabled={busy || picked.size === 0} onClick={apply} style={{ margin: '0 0 0 auto' }}>
              {fill(t.apply, { count: picked.size })}
            </button>
          </div>
          <p style={muted}>{t.hint}</p>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ borderCollapse: 'collapse', width: '100%' }}>
              <thead>
                <tr>
                  {['', t.colResult, t.colSeen, t.colPayment, t.colPayer, t.colRegistration, t.colWhy].map((h, i) => (
                    <th key={i} style={{ ...cell, textAlign: 'left', fontWeight: 400, color: 'var(--theme-elevation-500)', fontSize: 12 }}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {sorted.map(({ r, i }) => (
                  <tr key={i}>
                    <td style={cell}>
                      {selectable(r) && (
                        <input
                          type="checkbox"
                          aria-label={r.row.paymentId}
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
                    <td style={{ ...cell, whiteSpace: 'nowrap', color: KIND_COLOR[r.kind] }}>{KIND_LABEL[r.kind]}</td>
                    <td style={{ ...cell, whiteSpace: 'nowrap', color: r.seenBefore ? 'var(--theme-elevation-500)' : undefined }}>{r.seenBefore ? t.seenEarlier : t.seenNew}</td>
                    <td style={{ ...cell, whiteSpace: 'nowrap' }}>
                      <div style={{ fontFamily: 'monospace' }}>{r.row.paymentId || '—'}</div>
                      <div style={muted}>
                        ₹{r.row.amount ?? '?'} · {r.row.event}
                      </div>
                    </td>
                    <td style={cell}>
                      <div>{r.row.email}</div>
                      <div style={muted}>{r.row.phone}</div>
                    </td>
                    <td style={cell}>
                      {r.reg ? (
                        <>
                          <a href={`/admin/collections/event-registrations/${r.reg.id}`} style={{ fontFamily: 'monospace' }}>
                            {r.reg.code}
                          </a>
                          <div>
                            {r.reg.team} · {r.reg.event}
                          </div>
                        </>
                      ) : (
                        '—'
                      )}
                    </td>
                    <td style={{ ...cell, color: 'var(--theme-elevation-600)' }}>{r.reasons.join('; ')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}
    </div>
  )
}
