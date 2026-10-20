'use client'

import { Fragment, useCallback, useEffect, useState } from 'react'
import { fill } from '@/lib/form-texts-defaults'
import { selectTeams, type SelectRules, type TeamResult } from '@/lib/judging'
import type { JudgingTexts } from '@/lib/judging-texts-defaults'

type RoundItem = { id: number; title: string; event: string; status: 'DRAFT' | 'OPEN' | 'CLOSED' }
type Score = { judge: number; name: string; marks: Record<string, number>; total: number; remarks: string; savedAt: string }
type Row = {
  id: number
  code: string
  team: string
  college: string
  project: string
  rank: number | null
  average: number | null
  judges: number
  spread: number | null
  criteria: Record<string, number>
  decision: 'QUALIFIED' | 'NOT_QUALIFIED' | null
  missing: string[]
  scores: Score[]
}
type Detail = {
  round: { id: number; title: string; status: RoundItem['status']; criteria: { key: string; label: string; min: number; max: number }[]; formula: string; decimals: number; range: { low: number; high: number }; judges: { id: number; name: string }[] }
  teams: Row[]
}
type Decision = 'QUALIFIED' | 'NOT_QUALIFIED' | null

const numOrNull = (s: string) => (s.trim() === '' || !Number.isFinite(Number(s)) ? null : Number(s))

/** Rank teams by the judges' average, pick them with the tools (or by hand) and set Qualified / Not qualified. */
export default function ResultsDesk({ t }: { t: JudgingTexts['desk'] }) {
  const [rounds, setRounds] = useState<RoundItem[] | null>(null)
  const [roundId, setRoundId] = useState<number | null>(null)
  const [data, setData] = useState<Detail | null>(null)
  const [sel, setSel] = useState<Set<number>>(new Set())
  const [openRow, setOpenRow] = useState<number | null>(null)
  const [rules, setRules] = useState<Record<string, string>>({})
  const [ties, setTies] = useState(false)
  const [tieIds, setTieIds] = useState<number[]>([])
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null)
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    fetch('/api/admin/judging', { cache: 'no-store' })
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((d) => {
        setRounds(d.rounds)
        if (d.rounds.length === 1) setRoundId(d.rounds[0].id)
      })
      .catch(() => setMsg({ ok: false, text: t.errLoad }))
  }, [t.errLoad])

  const load = useCallback(async () => {
    if (!roundId) return
    const r = await fetch(`/api/admin/judging?round=${roundId}`, { cache: 'no-store' }).catch(() => null)
    if (!r?.ok) return setMsg({ ok: false, text: t.errLoad })
    setData(await r.json())
  }, [roundId, t.errLoad])

  useEffect(() => {
    setData(null)
    setSel(new Set())
    setTieIds([])
    load()
    const timer = setInterval(load, 30000)
    return () => clearInterval(timer)
  }, [load])

  const results = (): TeamResult[] =>
    (data?.teams || [])
      .filter((x) => x.average !== null)
      .map((x) => ({ registration: x.id, judges: x.judges, average: x.average!, spread: x.spread ?? 0, criteria: x.criteria, totals: [] }))

  const applyRules = () => {
    if (!data) return
    const r: SelectRules = {
      topN: numOrNull(rules.topN || ''),
      includeTies: ties,
      minAverage: numOrNull(rules.minAvg || ''),
      maxAverage: numOrNull(rules.maxAvg || ''),
      minJudges: numOrNull(rules.minJudges || ''),
      maxSpread: numOrNull(rules.maxSpread || ''),
      criterionMin: Object.fromEntries(data.round.criteria.map((c) => [c.key, numOrNull(rules[`c_${c.key}`] || '')])),
    }
    const out = selectTeams(results(), r, data.round.decimals)
    setSel(new Set(out.ids))
    setTieIds(out.cutTie)
  }

  const decide = async (ids: number[], decision: Decision) => {
    if (!data || !ids.length) return
    const label = decision === 'QUALIFIED' ? t.decisionQ : decision === 'NOT_QUALIFIED' ? t.decisionNQ : t.decisionNone
    if (!window.confirm(fill(t.confirm, { decision: label, n: String(ids.length) }))) return
    setBusy(true)
    setMsg(null)
    let saved = 0
    for (let i = 0; i < ids.length; i += 500) {
      const r = await fetch('/api/admin/judging', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ round: data.round.id, registrations: ids.slice(i, i + 500), decision }),
      }).catch(() => null)
      const d = r ? await r.json().catch(() => ({})) : {}
      if (!r?.ok) {
        setBusy(false)
        setMsg({ ok: false, text: d?.error || t.errLoad })
        return load()
      }
      saved += d.count
    }
    setBusy(false)
    setMsg({ ok: true, text: fill(t.savedDecisions, { n: String(saved) }) })
    load()
  }

  const toggle = (id: number) => setSel((s) => {
    const n = new Set(s)
    if (n.has(id)) n.delete(id)
    else n.add(id)
    return n
  })

  if (!rounds) return <p className="text-sm text-slate-400">{msg?.text || t.loading}</p>
  if (!rounds.length) return <p className="text-sm text-slate-400">{t.noRounds}</p>
  const status = (s: RoundItem['status']) => (s === 'OPEN' ? t.statusOpen : s === 'CLOSED' ? t.statusClosed : t.statusDraft)
  const teams = data?.teams || []
  const fullyScored = teams.filter((x) => data && x.judges >= data.round.judges.length && x.judges > 0).length
  const input = 'w-full px-2 py-1.5 rounded bg-aurix-surface border border-aurix-border text-white text-xs outline-none focus:border-aurix-orange'
  const button = 'px-3 py-2 rounded text-xs font-mono border disabled:opacity-50'

  return (
    <div className="space-y-5">
      <label className="block max-w-md space-y-1">
        <span className="text-xs font-mono text-slate-400">{t.chooseRound}</span>
        <select value={roundId ?? ''} onChange={(e) => setRoundId(Number(e.target.value) || null)} className={input}>
          <option value="">{t.chooseRound}</option>
          {rounds.map((r) => (
            <option key={r.id} value={r.id}>
              {r.title} ({status(r.status)})
            </option>
          ))}
        </select>
      </label>
      {msg ? <p className={`text-sm ${msg.ok ? 'text-emerald-400' : 'text-red-400'}`}>{msg.text}</p> : null}
      {roundId && !data ? <p className="text-sm text-slate-400">{t.loading}</p> : null}

      {data ? (
        <>
          <div className="text-xs font-mono text-slate-400 space-y-1">
            <p>
              {status(data.round.status)} · {fill(t.summary, { teams: String(teams.length), scored: String(fullyScored), judges: String(data.round.judges.length) })}
            </p>
            <p>{fill(t.formula, { formula: data.round.formula.trim() || t.formulaSum })} · {fill(t.possible, { low: String(data.round.range.low), high: String(data.round.range.high) })}</p>
          </div>

          <section className="aurix-card rounded-xl border border-aurix-border p-4 space-y-3">
            <h2 className="text-sm font-semibold text-white">{t.toolsTitle}</h2>
            <p className="text-xs text-slate-400">{t.toolsHelp}</p>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
              {([['topN', t.topN], ['minAvg', t.minAvg], ['maxAvg', t.maxAvg], ['minJudges', t.minJudges], ['maxSpread', t.maxSpread]] as const).map(([k, label]) => (
                <label key={k} className="block space-y-1">
                  <span className="block text-[11px] font-mono text-slate-400">{label}</span>
                  <input type="number" step="any" value={rules[k] || ''} onChange={(e) => setRules((r) => ({ ...r, [k]: e.target.value }))} className={input} />
                </label>
              ))}
              <label className="flex items-end gap-2 text-[11px] font-mono text-slate-300 pb-2">
                <input type="checkbox" checked={ties} onChange={(e) => setTies(e.target.checked)} />
                {t.includeTies}
              </label>
            </div>
            <div className="space-y-1">
              <span className="block text-[11px] font-mono text-slate-400">{t.critMin}</span>
              <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
                {data.round.criteria.map((c) => (
                  <label key={c.key} className="block space-y-1">
                    <span className="block text-[11px] text-slate-300 truncate" title={c.label}>{c.label}</span>
                    <input type="number" step="any" value={rules[`c_${c.key}`] || ''} onChange={(e) => setRules((r) => ({ ...r, [`c_${c.key}`]: e.target.value }))} className={input} />
                  </label>
                ))}
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              <button type="button" onClick={applyRules} className={`${button} border-aurix-orange text-white`}>{t.apply}</button>
              <button type="button" onClick={() => setSel(new Set(teams.filter((x) => x.average !== null).map((x) => x.id)))} className={`${button} border-aurix-border text-slate-300`}>{t.selectAll}</button>
              <button type="button" onClick={() => { setSel(new Set()); setTieIds([]) }} className={`${button} border-aurix-border text-slate-300`}>{t.clear}</button>
              <span className="self-center text-xs font-mono text-slate-400">{fill(t.selected, { n: String(sel.size) })}</span>
            </div>
            {tieIds.length ? <p className="text-xs text-yellow-400">{fill(t.tie, { teams: teams.filter((x) => tieIds.includes(x.id)).map((x) => x.team).join(', ') })}</p> : null}
            <div className="flex flex-wrap gap-2 pt-1">
              <button type="button" disabled={busy || !sel.size} onClick={() => decide([...sel], 'QUALIFIED')} className={`${button} border-emerald-700 text-emerald-300`}>{t.markQ}</button>
              <button type="button" disabled={busy || !sel.size} onClick={() => decide([...sel], 'NOT_QUALIFIED')} className={`${button} border-red-800 text-red-300`}>{t.markNQ}</button>
              <button type="button" disabled={busy || !sel.size} onClick={() => decide(teams.filter((x) => !sel.has(x.id)).map((x) => x.id), 'NOT_QUALIFIED')} className={`${button} border-red-800 text-red-300`}>{t.markRestNQ}</button>
              <button type="button" disabled={busy || !sel.size} onClick={() => decide([...sel], null)} className={`${button} border-aurix-border text-slate-300`}>{t.markClear}</button>
              <a href={`/api/admin/judging?round=${data.round.id}&csv=1`} className={`${button} border-aurix-border text-slate-300 ml-auto`}>{t.csv}</a>
            </div>
          </section>

          <div className="overflow-x-auto rounded-xl border border-aurix-border">
            <table className="w-full text-xs">
              <thead className="bg-aurix-surface text-slate-400 font-mono">
                <tr>
                  <th className="p-2" />
                  <th className="p-2 text-left">{t.colRank}</th>
                  <th className="p-2 text-left">{t.colTeam}</th>
                  <th className="p-2 text-right">{t.colAvg}</th>
                  <th className="p-2 text-right">{t.colJudges}</th>
                  <th className="p-2 text-right">{t.colSpread}</th>
                  {data.round.criteria.map((c) => (
                    <th key={c.key} className="p-2 text-right whitespace-nowrap" title={c.label}>
                      {c.label.length > 14 ? `${c.label.slice(0, 13)}…` : c.label}
                    </th>
                  ))}
                  <th className="p-2 text-left">{t.colDecision}</th>
                  <th className="p-2" />
                </tr>
              </thead>
              <tbody>
                {teams.map((x) => (
                  <Fragment key={x.id}>
                    <tr className={`border-t border-aurix-border ${sel.has(x.id) ? 'bg-aurix-orange/10' : ''} ${tieIds.includes(x.id) ? 'outline outline-1 outline-yellow-600' : ''}`}>
                      <td className="p-2 text-center">
                        <input type="checkbox" checked={sel.has(x.id)} onChange={() => toggle(x.id)} aria-label={x.team} />
                      </td>
                      <td className="p-2 font-mono">{x.rank ?? '—'}</td>
                      <td className="p-2">
                        <span className="block text-white">{x.team}</span>
                        <span className="block text-slate-500 font-mono">
                          {x.code}
                          {x.college ? ` · ${x.college}` : ''}
                        </span>
                        {x.missing.length ? <span className="block text-yellow-500">{fill(t.missing, { names: x.missing.join(', ') })}</span> : null}
                      </td>
                      <td className="p-2 text-right font-mono text-white">{x.average ?? t.notScored}</td>
                      <td className="p-2 text-right font-mono">{x.judges}/{data.round.judges.length}</td>
                      <td className="p-2 text-right font-mono">{x.spread ?? '—'}</td>
                      {data.round.criteria.map((c) => (
                        <td key={c.key} className="p-2 text-right font-mono">{x.criteria[c.key] ?? '—'}</td>
                      ))}
                      <td className="p-2">
                        {x.decision === 'QUALIFIED' ? <span className="text-emerald-400">{t.decisionQ}</span> : x.decision === 'NOT_QUALIFIED' ? <span className="text-red-400">{t.decisionNQ}</span> : <span className="text-slate-500">{t.decisionNone}</span>}
                      </td>
                      <td className="p-2">
                        {x.scores.length ? (
                          <button type="button" onClick={() => setOpenRow(openRow === x.id ? null : x.id)} className="text-aurix-orange hover:underline font-mono">
                            {t.details}
                          </button>
                        ) : null}
                      </td>
                    </tr>
                    {openRow === x.id ? (
                      <tr className="bg-aurix-dark">
                        <td colSpan={8 + data.round.criteria.length} className="p-3 space-y-2">
                          {x.scores.map((s) => (
                            <div key={s.judge} className="text-xs">
                              <p className="font-mono text-white">
                                {s.name}: {s.total}
                                <span className="text-slate-500"> · {data.round.criteria.map((c) => `${c.label} ${s.marks[c.key] ?? '—'}`).join(' · ')}</span>
                              </p>
                              <p className="text-slate-300 whitespace-pre-wrap">{s.remarks || t.noRemarks}</p>
                            </div>
                          ))}
                        </td>
                      </tr>
                    ) : null}
                  </Fragment>
                ))}
              </tbody>
            </table>
          </div>
        </>
      ) : null}
    </div>
  )
}
