'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { fill } from '@/lib/form-texts-defaults'
import { evaluateFormula, roundFormula } from '@/lib/formula'
import type { JudgingTexts } from '@/lib/judging-texts-defaults'

type RoundItem = { id: number; title: string; event: string; status: 'OPEN' | 'CLOSED'; teams: number; done: number }
type Criterion = { key: string; label: string; min: number; max: number; step: number; guidance?: string }
type Mine = { marks: Record<string, number>; remarks: string; total: number; savedAt: string }
type Team = {
  id: number
  code: string
  team: string | null
  college: string | null
  members: string[] | null
  project: { title: string | null; track: string | null; repo: string | null; demo: string | null } | null
  file: { id: number; name: string | null } | null
  mine: Mine | null
  others: { n: number; total: number }[] | null
}
type RoundDetail = {
  id: number
  title: string
  status: 'OPEN' | 'CLOSED'
  criteria: Criterion[]
  formula: string
  decimals: number
  range: { low: number; high: number }
  view: { editAfterSubmit: boolean; remarksRequired: boolean; otherScores: boolean }
}

const when = (iso: string) => new Date(iso).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Kolkata' })
const safeLink = (u: string | null) => (u && /^https?:\/\//i.test(u) ? u : null)

/** Judge portal: my rounds → teams → scoring sheet. The server checks and works out every score; the preview here is a guide. */
export default function JudgeDesk({ t }: { t: JudgingTexts['judge'] }) {
  const [rounds, setRounds] = useState<RoundItem[] | null>(null)
  const [round, setRound] = useState<RoundDetail | null>(null)
  const [teams, setTeams] = useState<Team[]>([])
  const [open, setOpen] = useState<Team | null>(null)
  const [filter, setFilter] = useState<'all' | 'todo' | 'done'>('all')
  const [q, setQ] = useState('')
  const [error, setError] = useState('')

  const loadRounds = useCallback(async () => {
    const r = await fetch('/api/judge', { cache: 'no-store' }).catch(() => null)
    if (!r?.ok) return setError(t.errLoad)
    const list: RoundItem[] = (await r.json()).rounds
    setRounds(list)
    if (list.length === 1) openRound(list[0].id)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [t.errLoad])

  const openRound = async (id: number) => {
    setError('')
    const r = await fetch(`/api/judge?round=${id}`, { cache: 'no-store' }).catch(() => null)
    if (!r?.ok) return setError(t.errLoad)
    const d = await r.json()
    setRound(d.round)
    setTeams(d.teams)
    setOpen(null)
  }

  useEffect(() => {
    loadRounds()
  }, [loadRounds])

  const name = (x: Team) => x.team || fill(t.unnamed, { code: x.code })
  const shown = teams.filter((x) => {
    if (filter === 'todo' && x.mine) return false
    if (filter === 'done' && !x.mine) return false
    const s = q.trim().toLowerCase()
    return !s || x.code.toLowerCase().includes(s) || (x.team || '').toLowerCase().includes(s)
  })
  const done = teams.filter((x) => x.mine).length

  if (error && !rounds) return <p className="text-sm text-red-400">{error}</p>
  if (!rounds) return <p className="text-sm text-slate-400">{t.loading}</p>
  if (!rounds.length) return <p className="text-sm text-slate-400">{t.noRounds}</p>

  return (
    <div className="space-y-6">
      {rounds.length > 1 || !round ? (
        <section className="space-y-2">
          <h2 className="text-xs font-mono uppercase tracking-wider text-slate-400">{t.roundsTitle}</h2>
          <div className="flex flex-wrap gap-2">
            {rounds.map((r) => (
              <button
                key={r.id}
                type="button"
                onClick={() => openRound(r.id)}
                className={`px-4 py-2 rounded-lg border text-left text-sm ${round?.id === r.id ? 'border-aurix-orange bg-aurix-orange/10 text-white' : 'border-aurix-border bg-aurix-surface text-slate-300 hover:text-white'}`}
              >
                <span className="block font-semibold">{r.title}</span>
                <span className="block text-xs font-mono text-slate-400">
                  {r.status === 'OPEN' ? t.statusOpen : t.statusClosed} · {fill(t.progress, { done: String(r.done), total: String(r.teams) })}
                </span>
              </button>
            ))}
          </div>
        </section>
      ) : null}
      {error ? <p className="text-sm text-red-400">{error}</p> : null}

      {round && !open ? (
        <section className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
            <div>
              <h2 className="text-xl font-display font-bold text-white">{round.title}</h2>
              <p className="text-xs font-mono text-slate-400">
                {round.status === 'OPEN' ? t.statusOpen : t.statusClosed} · {fill(t.progress, { done: String(done), total: String(teams.length) })} ·{' '}
                {fill(t.possible, { low: String(round.range.low), high: String(round.range.high) })}
              </p>
            </div>
            <div className="flex flex-wrap gap-2 items-center">
              {(['all', 'todo', 'done'] as const).map((f) => (
                <button key={f} type="button" onClick={() => setFilter(f)} className={`px-3 py-1.5 rounded text-xs font-mono border ${filter === f ? 'border-aurix-orange text-white' : 'border-aurix-border text-slate-400'}`}>
                  {f === 'all' ? t.filterAll : f === 'todo' ? t.filterTodo : t.filterDone}
                </button>
              ))}
              <input value={q} onChange={(e) => setQ(e.target.value)} placeholder={t.search} aria-label={t.search} className="px-3 py-1.5 rounded bg-aurix-surface border border-aurix-border text-xs text-white outline-none focus:border-aurix-orange" />
            </div>
          </div>
          {!teams.length ? <p className="text-sm text-slate-400">{t.noTeams}</p> : null}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {shown.map((x) => (
              <button key={x.id} type="button" onClick={() => setOpen(x)} className="text-left aurix-card rounded-xl p-4 border border-aurix-border hover:border-aurix-orange/60 space-y-1">
                <div className="flex items-start justify-between gap-2">
                  <span className="font-semibold text-white break-words">{name(x)}</span>
                  <span className={`shrink-0 px-2 py-0.5 rounded text-[10px] font-mono uppercase ${x.mine ? 'bg-emerald-950/60 text-emerald-400 border border-emerald-800' : 'bg-yellow-950/60 text-yellow-400 border border-yellow-800'}`}>
                    {x.mine ? t.badgeDone : t.badgeTodo}
                  </span>
                </div>
                <span className="block text-xs font-mono text-slate-500">{x.code}</span>
                {x.project?.title ? <span className="block text-xs text-slate-300">{x.project.title}</span> : null}
                {x.mine ? <span className="block text-xs font-mono text-aurix-orange">{t.scoreLabel}: {x.mine.total}</span> : null}
              </button>
            ))}
          </div>
        </section>
      ) : null}

      {round && open ? (
        <ScoreSheet
          key={open.id}
          t={t}
          round={round}
          team={open}
          name={name(open)}
          onBack={() => setOpen(null)}
          onSaved={(mine) => {
            const next = teams.map((x) => (x.id === open.id ? { ...x, mine } : x))
            setTeams(next)
            setOpen({ ...open, mine })
            setRounds((rs) => rs && rs.map((r) => (r.id === round.id ? { ...r, done: next.filter((x) => x.mine).length } : r)))
          }}
          onNext={() => {
            const nextTeam = teams.find((x) => !x.mine && x.id !== open.id)
            setOpen(nextTeam || null)
          }}
        />
      ) : null}
    </div>
  )
}

function ScoreSheet({ t, round, team, name, onBack, onSaved, onNext }: { t: JudgingTexts['judge']; round: RoundDetail; team: Team; name: string; onBack: () => void; onSaved: (m: Mine) => void; onNext: () => void }) {
  const [marks, setMarks] = useState<Record<string, string>>(() => Object.fromEntries(round.criteria.map((c) => [c.key, team.mine ? String(team.mine.marks[c.key] ?? '') : ''])))
  const [remarks, setRemarks] = useState(team.mine?.remarks || '')
  const [busy, setBusy] = useState(false)
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null)
  const locked = round.status !== 'OPEN' || (Boolean(team.mine) && !round.view.editAfterSubmit)
  const formula = useMemo(() => {
    try {
      return roundFormula(round.criteria, round.formula)
    } catch {
      return null
    }
  }, [round])
  const preview = useMemo(() => {
    if (!formula || round.criteria.some((c) => marks[c.key] === '' || !Number.isFinite(Number(marks[c.key])))) return null
    const v = evaluateFormula(formula, Object.fromEntries(round.criteria.map((c) => [c.key, Number(marks[c.key])])))
    const f = Math.pow(10, round.decimals)
    return Math.round(v * f) / f
  }, [formula, marks, round])

  const save = async (e: React.FormEvent) => {
    e.preventDefault()
    setBusy(true)
    setMsg(null)
    const r = await fetch('/api/judge', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ round: round.id, registration: team.id, marks, remarks }),
    }).catch(() => null)
    setBusy(false)
    const d = r ? await r.json().catch(() => ({})) : {}
    if (!r?.ok) return setMsg({ ok: false, text: d?.error || t.errLoad })
    setMsg({ ok: true, text: t.saved })
    onSaved(d.mine)
  }

  return (
    <section className="space-y-5">
      <button type="button" onClick={onBack} className="text-xs font-mono text-slate-400 hover:text-white">
        ← {t.back}
      </button>
      <div className="aurix-card rounded-2xl p-5 sm:p-6 border border-aurix-border space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2">
          <div>
            <span className="text-xs font-mono text-aurix-orange">{team.code}</span>
            <h2 className="font-display font-bold text-white text-xl break-words">{name}</h2>
          </div>
          {team.mine ? <span className="text-xs font-mono text-slate-400">{fill(t.savedAt, { time: when(team.mine.savedAt) })}</span> : null}
        </div>
        <dl className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
          {team.college ? <Item label={t.college} value={team.college} /> : null}
          {team.members?.length ? <Item label={t.members} value={team.members.join(', ')} /> : null}
          {team.project?.title ? <Item label={t.project} value={team.project.title} /> : null}
          {team.project?.track ? <Item label={t.track} value={team.project.track} /> : null}
        </dl>
        <div className="flex flex-wrap gap-3 text-xs font-mono">
          {safeLink(team.project?.repo ?? null) ? <a className="text-aurix-orange hover:underline" href={safeLink(team.project!.repo)!} target="_blank" rel="noopener noreferrer nofollow">{t.repo} ↗</a> : null}
          {safeLink(team.project?.demo ?? null) ? <a className="text-aurix-orange hover:underline" href={safeLink(team.project!.demo)!} target="_blank" rel="noopener noreferrer nofollow">{t.demo} ↗</a> : null}
          {team.file ? (
            <a className="px-3 py-1.5 rounded bg-aurix-surface border border-aurix-border text-white hover:border-aurix-orange" href={`/api/admin/submissions/${team.file.id}/file`}>
              {t.file}
            </a>
          ) : team.project ? (
            <span className="text-slate-500">{t.noFile}</span>
          ) : null}
        </div>
      </div>

      <form onSubmit={save} className="aurix-card rounded-2xl p-5 sm:p-6 border border-aurix-border space-y-4">
        <h3 className="text-xs font-mono text-slate-400 uppercase tracking-wider">{t.marksTitle}</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {round.criteria.map((c) => (
            <label key={c.key} className="block space-y-1">
              <span className="flex justify-between gap-2 text-sm text-white">
                <span>{c.label}</span>
                <span className="text-xs font-mono text-slate-500 shrink-0">{fill(t.range, { min: String(c.min), max: String(c.max) })}</span>
              </span>
              <input
                type="number"
                inputMode="decimal"
                required
                disabled={locked}
                min={c.min}
                max={c.max}
                step={c.step > 0 ? c.step : 'any'}
                value={marks[c.key]}
                onChange={(e) => setMarks((m) => ({ ...m, [c.key]: e.target.value }))}
                className="w-full px-3 py-2 rounded bg-aurix-surface border border-aurix-border text-white text-sm outline-none focus:border-aurix-orange disabled:opacity-60"
              />
              {c.guidance ? <span className="block text-xs text-slate-400">{c.guidance}</span> : null}
            </label>
          ))}
        </div>
        <label className="block space-y-1">
          <span className="text-xs font-mono text-slate-400">{round.view.remarksRequired ? t.remarksRequired : t.remarks}</span>
          <textarea
            rows={3}
            maxLength={2000}
            required={round.view.remarksRequired}
            disabled={locked}
            value={remarks}
            onChange={(e) => setRemarks(e.target.value)}
            className="w-full px-3 py-2 rounded bg-aurix-surface border border-aurix-border text-white text-sm outline-none focus:border-aurix-orange disabled:opacity-60"
          />
        </label>
        <div className="flex flex-wrap items-center gap-4">
          <span className="text-lg font-display font-bold text-white">
            {t.scoreLabel}: <span className="text-aurix-orange">{preview ?? '—'}</span>
          </span>
          {!locked ? (
            <button type="submit" disabled={busy} className="px-6 py-2.5 rounded bg-aurix-orange text-black font-semibold text-xs font-mono uppercase hover:bg-orange-400 disabled:opacity-60">
              {busy ? t.saving : team.mine ? t.update : t.save}
            </button>
          ) : (
            <span className="text-xs font-mono text-slate-400">{round.status !== 'OPEN' ? t.closed : t.final}</span>
          )}
          {team.mine ? (
            <button type="button" onClick={onNext} className="text-xs font-mono text-slate-300 hover:text-white">
              {t.next} →
            </button>
          ) : null}
        </div>
        {msg ? <p className={`text-sm ${msg.ok ? 'text-emerald-400' : 'text-red-400'}`}>{msg.text}</p> : null}
      </form>

      {team.others && team.others.length ? (
        <div className="text-xs font-mono text-slate-400 space-y-1">
          <h3 className="uppercase tracking-wider">{t.others}</h3>
          {team.others.map((o) => (
            <p key={o.n}>
              {fill(t.judgeN, { n: String(o.n) })}: {o.total}
            </p>
          ))}
        </div>
      ) : null}
    </section>
  )
}

function Item({ label, value }: { label: string; value: string }) {
  return (
    <div className="p-3 rounded bg-aurix-dark border border-aurix-border">
      <dt className="text-xs font-mono text-slate-500 uppercase">{label}</dt>
      <dd className="text-white break-words">{value}</dd>
    </div>
  )
}
