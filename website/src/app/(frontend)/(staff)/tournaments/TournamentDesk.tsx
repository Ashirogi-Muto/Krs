'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { fill } from '@/lib/form-texts-defaults'
import { displayNames, nextPow2, standings, TIEBREAKERS, type Config, type Match, type Race, type Slot, type TeamId, type Tiebreaker } from '@/lib/tournament'
import type { TournamentDoc } from '@/lib/tournament-server'
import type { TournamentTexts } from '@/lib/tournament-texts-defaults'
import TournamentView, { groupName } from '@/components/aurix/TournamentView'

type D = TournamentTexts['desk']
type V = TournamentTexts['view']
type ListItem = { id: number; name: string; event: string; format: Config['format']; status: string; published: boolean }
type Candidate = { id: number; name: string; code: string; status: string; checkedIn: boolean; college: string }
type Detail = { tournament: TournamentDoc; canManage: boolean; teams: Candidate[] }
type Act = { (body: Record<string, unknown>): Promise<boolean> }

const input = 'w-full px-2 py-1.5 rounded bg-aurix-surface border border-aurix-border text-white text-sm outline-none focus:border-aurix-orange disabled:opacity-60'
const btn = 'px-3 py-2 rounded text-xs font-mono border disabled:opacity-50'
const primary = `${btn} border-aurix-orange bg-aurix-orange text-black font-semibold`
const card = 'aurix-card rounded-xl border border-aurix-border p-4 space-y-3'

export const formatLabel = (f: Config['format'], t: D) => ({ league_knockout: t.fmtLeague, knockout: t.fmtKnockout, race_bracket: t.fmtRace, time_trial: t.fmtTrial })[f]
const formatHelp = (f: Config['format'], t: D) => ({ league_knockout: t.fmtLeagueHelp, knockout: t.fmtKnockoutHelp, race_bracket: t.fmtRaceHelp, time_trial: t.fmtTrialHelp })[f]
const statusLabel = (s: string, t: D) => (s === 'LIVE' ? t.statusLive : s === 'FINISHED' ? t.statusFinished : t.statusSetup)

/** Organisers' tournament portal: list → one tournament (settings, teams, draw, results, publish). */
export default function TournamentDesk({ t, v }: { t: D; v: V }) {
  const [list, setList] = useState<{ tournaments: ListItem[]; events: { id: number; title: string }[] } | null>(null)
  const [detail, setDetail] = useState<Detail | null>(null)
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null)
  const [busy, setBusy] = useState(false)

  const loadList = useCallback(async () => {
    const r = await fetch('/api/admin/tournaments', { cache: 'no-store' }).catch(() => null)
    if (!r?.ok) return setMsg({ ok: false, text: t.errLoad })
    setList(await r.json())
  }, [t.errLoad])
  const open = useCallback(
    async (id: number) => {
      const r = await fetch(`/api/admin/tournaments?id=${id}`, { cache: 'no-store' }).catch(() => null)
      if (!r?.ok) return setMsg({ ok: false, text: t.errLoad })
      setDetail(await r.json())
    },
    [t.errLoad],
  )
  useEffect(() => {
    loadList()
  }, [loadList])

  const act: Act = async (body) => {
    setBusy(true)
    setMsg(null)
    const withRev = detail && body.action !== 'create' ? { id: detail.tournament.id, rev: detail.tournament.rev, ...body } : body
    const r = await fetch('/api/admin/tournaments', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(withRev) }).catch(() => null)
    setBusy(false)
    const d = r ? await r.json().catch(() => ({})) : {}
    if (!r?.ok) {
      setMsg({ ok: false, text: d?.error || t.errLoad })
      if (r?.status === 409 && detail) open(detail.tournament.id)
      return false
    }
    setMsg({ ok: true, text: t.saved })
    if (body.action === 'create') {
      await loadList()
      await open(d.tournament.id)
    } else setDetail((x) => (x ? { ...x, tournament: d.tournament } : x))
    return true
  }

  if (!list) return <p className="text-sm text-slate-400">{msg?.text || t.loading}</p>

  if (!detail) {
    return (
      <div className="space-y-6">
        {msg ? <p className={`text-sm ${msg.ok ? 'text-emerald-400' : 'text-red-400'}`}>{msg.text}</p> : null}
        {list.tournaments.length ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {list.tournaments.map((x) => (
              <button key={x.id} type="button" onClick={() => open(x.id)} className={`${card} text-left hover:border-aurix-orange/60`}>
                <span className="block font-display font-bold text-white">{x.name}</span>
                <span className="block text-xs text-slate-400">{x.event}</span>
                <span className="block text-xs font-mono text-slate-500">
                  {formatLabel(x.format, t)} · {statusLabel(x.status, t)} · {x.published ? t.published : t.notPublished}
                </span>
              </button>
            ))}
          </div>
        ) : (
          <p className="text-sm text-slate-400">{t.none}</p>
        )}
        {list.events.length ? <CreateForm t={t} events={list.events} busy={busy} act={act} /> : null}
      </div>
    )
  }

  const tour = detail.tournament
  const drawn = Boolean(tour.state.draw)
  return (
    <div className="space-y-6">
      <button
        type="button"
        onClick={() => {
          setDetail(null)
          setMsg(null)
          loadList()
        }}
        className="text-xs font-mono text-slate-400 hover:text-white"
      >
        ← {t.back}
      </button>
      <Header t={t} tour={tour} canManage={detail.canManage} busy={busy} act={act} />
      {msg ? <p className={`text-sm ${msg.ok ? 'text-emerald-400' : 'text-red-400'}`}>{msg.text}</p> : null}
      {!detail.canManage ? <p className="text-xs text-slate-400">{t.scoreOnly}</p> : null}
      {detail.canManage && !drawn ? (
        <>
          <Settings key={`s${tour.rev}`} t={t} cfg={tour.config} busy={busy} act={act} />
          <Teams key={`t${tour.rev}`} t={t} candidates={detail.teams} chosen={tour.state.entrants.map((e) => e.id)} busy={busy} act={act} />
          {tour.state.entrants.length >= 2 ? <Draw key={`d${tour.rev}`} t={t} tour={tour} busy={busy} act={act} /> : null}
        </>
      ) : null}
      {drawn ? <Play key={`p${tour.rev}`} t={t} v={v} tour={tour} canManage={detail.canManage} busy={busy} act={act} /> : null}
    </div>
  )
}

function CreateForm({ t, events, busy, act }: { t: D; events: { id: number; title: string }[]; busy: boolean; act: Act }) {
  const [event, setEvent] = useState(events[0]?.id || 0)
  const [name, setName] = useState('')
  const [format, setFormat] = useState<Config['format']>('knockout')
  return (
    <form
      className={card}
      onSubmit={(e) => {
        e.preventDefault()
        act({ action: 'create', event, name, format })
      }}
    >
      <h2 className="font-semibold text-white">{t.newTitle}</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <label className="block space-y-1">
          <span className="text-xs font-mono text-slate-400">{t.competition}</span>
          <select value={event} onChange={(e) => setEvent(Number(e.target.value))} className={input}>
            {events.map((x) => (
              <option key={x.id} value={x.id}>{x.title}</option>
            ))}
          </select>
        </label>
        <label className="block space-y-1">
          <span className="text-xs font-mono text-slate-400">{t.name}</span>
          <input required maxLength={80} value={name} onChange={(e) => setName(e.target.value)} placeholder={t.namePlaceholder} className={input} />
        </label>
        <label className="block space-y-1">
          <span className="text-xs font-mono text-slate-400">{t.format}</span>
          <select value={format} onChange={(e) => setFormat(e.target.value as Config['format'])} className={input}>
            {(['league_knockout', 'knockout', 'race_bracket', 'time_trial'] as const).map((f) => (
              <option key={f} value={f}>{formatLabel(f, t)}</option>
            ))}
          </select>
        </label>
      </div>
      <p className="text-xs text-slate-400">{formatHelp(format, t)}</p>
      <button type="submit" disabled={busy} className={primary}>{t.create}</button>
    </form>
  )
}

function Header({ t, tour, canManage, busy, act }: { t: D; tour: TournamentDoc; canManage: boolean; busy: boolean; act: Act }) {
  const drawn = Boolean(tour.state.draw)
  return (
    <div className="flex flex-col md:flex-row md:items-end justify-between gap-3">
      <div>
        <h2 className="text-2xl font-display font-bold text-white">{tour.name}</h2>
        <p className="text-xs font-mono text-slate-400">
          {tour.eventTitle} · {formatLabel(tour.format, t)} · {statusLabel(tour.status, t)} · {tour.published ? t.published : t.notPublished}
        </p>
      </div>
      {canManage ? (
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            disabled={busy}
            onClick={() => {
              const name = window.prompt(t.rename, tour.name)
              if (name && name.trim()) act({ action: 'rename', name: name.trim() })
            }}
            className={`${btn} border-aurix-border text-slate-300`}
          >
            {t.rename}
          </button>
          <button type="button" disabled={busy} onClick={() => act({ action: 'publish', published: !tour.published })} className={`${btn} ${tour.published ? 'border-aurix-border text-slate-300' : 'border-emerald-700 text-emerald-300'}`}>
            {tour.published ? t.unpublish : t.publish}
          </button>
          {drawn ? (
            <button type="button" disabled={busy} onClick={() => act({ action: 'finish', finished: tour.status !== 'FINISHED' })} className={`${btn} border-aurix-border text-slate-300`}>
              {tour.status === 'FINISHED' ? t.unfinish : t.finish}
            </button>
          ) : null}
          {drawn ? (
            <button
              type="button"
              disabled={busy}
              onClick={() => {
                const typed = window.prompt(fill(t.resetPrompt, { name: tour.name }))
                if (typed !== null) act({ action: 'reset', confirm: typed })
              }}
              className={`${btn} border-red-800 text-red-300`}
            >
              {t.reset}
            </button>
          ) : null}
        </div>
      ) : null}
    </div>
  )
}

function Num({ label, value, onChange, min, max, step = 1 }: { label: string; value: number | null; onChange: (n: number | null) => void; min?: number; max?: number; step?: number | 'any' }) {
  return (
    <label className="block space-y-1">
      <span className="block text-xs font-mono text-slate-400">{label}</span>
      <input type="number" min={min} max={max} step={step} value={value ?? ''} onChange={(e) => onChange(e.target.value === '' ? null : Number(e.target.value))} className={input} />
    </label>
  )
}

function Settings({ t, cfg: initial, busy, act }: { t: D; cfg: Config; busy: boolean; act: Act }) {
  const [c, setC] = useState<Config>(initial)
  const set = (patch: Partial<Config>) => setC((x) => ({ ...x, ...patch }))
  const tbLabel = (k: Tiebreaker) => ({ points: t.tbPoints, goalDiff: t.tbGoalDiff, headToHead: t.tbHeadToHead, goalsFor: t.tbGoalsFor, wins: t.tbWins })[k]
  const race = c.format === 'race_bracket' || c.format === 'time_trial'
  return (
    <section className={card}>
      <h3 className="font-semibold text-white">{t.settingsTitle}</h3>
      {c.format === 'league_knockout' ? (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          <Num label={t.groups} value={c.groups} min={1} max={16} onChange={(n) => set({ groups: n ?? 1 })} />
          <Num label={t.advancePerGroup} value={c.advancePerGroup} min={1} max={16} onChange={(n) => set({ advancePerGroup: n ?? 1 })} />
          <Num label={t.pointsWin} value={c.points.win} onChange={(n) => set({ points: { ...c.points, win: n ?? 0 } })} />
          <Num label={t.pointsDraw} value={c.points.draw} onChange={(n) => set({ points: { ...c.points, draw: n ?? 0 } })} />
          <Num label={t.pointsLoss} value={c.points.loss} onChange={(n) => set({ points: { ...c.points, loss: n ?? 0 } })} />
          <div className="col-span-2 md:col-span-5 space-y-1">
            <span className="block text-xs font-mono text-slate-400">{t.tiebreakers}</span>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
              {[0, 1, 2, 3, 4].map((i) => (
                <select
                  key={i}
                  aria-label={`${t.tiebreakers} ${i + 1}`}
                  value={c.tiebreakers[i] || ''}
                  onChange={(e) => {
                    const next = [...c.tiebreakers]
                    next[i] = e.target.value as Tiebreaker
                    set({ tiebreakers: next.filter(Boolean).filter((x, j, a) => a.indexOf(x) === j) })
                  }}
                  className={input}
                >
                  <option value="">{t.tbNone}</option>
                  {TIEBREAKERS.map((k) => (
                    <option key={k} value={k}>{tbLabel(k)}</option>
                  ))}
                </select>
              ))}
            </div>
          </div>
          <label className="col-span-2 block space-y-1">
            <span className="block text-xs font-mono text-slate-400">{t.seeding}</span>
            <select value={c.knockoutSeeding} onChange={(e) => set({ knockoutSeeding: e.target.value as Config['knockoutSeeding'] })} className={input}>
              <option value="crossover">{t.seedCrossover}</option>
              <option value="draw">{t.seedDraw}</option>
            </select>
          </label>
        </div>
      ) : null}
      {race ? (
        <div className="space-y-2">
          <span className="block text-xs font-mono text-slate-400">{t.penalties}</span>
          {c.penalties.map((p, i) => (
            <div key={i} className="grid grid-cols-[1fr_8rem_auto] gap-2 items-end">
              <label className="block space-y-1">
                <span className="block text-[11px] text-slate-500">{t.penaltyName}</span>
                <input value={p.label} maxLength={40} onChange={(e) => set({ penalties: c.penalties.map((x, j) => (j === i ? { ...x, label: e.target.value } : x)) })} className={input} />
              </label>
              <Num label={t.penaltySeconds} value={p.seconds} step="any" onChange={(n) => set({ penalties: c.penalties.map((x, j) => (j === i ? { ...x, seconds: n ?? 0 } : x)) })} />
              <button type="button" onClick={() => set({ penalties: c.penalties.filter((_, j) => j !== i) })} className={`${btn} border-aurix-border text-slate-400`}>{t.remove}</button>
            </div>
          ))}
          <button
            type="button"
            onClick={() => {
              let n = c.penalties.length + 1
              while (c.penalties.some((p) => p.key === `p${n}`)) n++
              set({ penalties: [...c.penalties, { key: `p${n}`, label: `${t.penaltyName} ${n}`, seconds: 5 }] })
            }}
            className={`${btn} border-aurix-border text-slate-300`}
          >
            {t.addPenalty}
          </button>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <Num label={t.falseStarts} value={c.falseStartsAllowed} min={0} max={10} onChange={(n) => set({ falseStartsAllowed: n ?? 0 })} />
            <Num label={t.decimals} value={c.timeDecimals} min={0} max={3} onChange={(n) => set({ timeDecimals: n ?? 2 })} />
            {c.format === 'race_bracket' ? <Num label={t.runsPerHeat} value={c.runsPerHeat} min={1} max={5} onChange={(n) => set({ runsPerHeat: n ?? 1 })} /> : null}
            {c.format === 'race_bracket' ? (
              <label className="block space-y-1">
                <span className="block text-xs font-mono text-slate-400">{t.combine}</span>
                <select value={c.heatCombine} onChange={(e) => set({ heatCombine: e.target.value as 'best' | 'sum' })} className={input}>
                  <option value="best">{t.combineBest}</option>
                  <option value="sum">{t.combineSum}</option>
                </select>
              </label>
            ) : null}
          </div>
        </div>
      ) : null}
      {c.format === 'time_trial' ? (
        <div className="space-y-2">
          <span className="block text-xs font-mono text-slate-400">{t.trialRounds}</span>
          {c.trialRounds.map((r, i) => (
            <div key={i} className="grid grid-cols-2 md:grid-cols-[1fr_6rem_10rem_10rem_auto] gap-2 items-end">
              <label className="block space-y-1">
                <span className="block text-[11px] text-slate-500">{t.roundName}</span>
                <input value={r.name} maxLength={60} onChange={(e) => set({ trialRounds: c.trialRounds.map((x, j) => (j === i ? { ...x, name: e.target.value } : x)) })} className={input} />
              </label>
              <Num label={t.attempts} value={r.attempts} min={1} max={5} onChange={(n) => set({ trialRounds: c.trialRounds.map((x, j) => (j === i ? { ...x, attempts: n ?? 1 } : x)) })} />
              <label className="block space-y-1">
                <span className="block text-[11px] text-slate-500">{t.combine}</span>
                <select value={r.combine} onChange={(e) => set({ trialRounds: c.trialRounds.map((x, j) => (j === i ? { ...x, combine: e.target.value as 'best' | 'sum' } : x)) })} className={input}>
                  <option value="best">{t.combineBest}</option>
                  <option value="sum">{t.combineSum}</option>
                </select>
              </label>
              <Num label={t.advance} value={r.advance} min={1} onChange={(n) => set({ trialRounds: c.trialRounds.map((x, j) => (j === i ? { ...x, advance: n } : x)) })} />
              <button type="button" disabled={c.trialRounds.length < 2} onClick={() => set({ trialRounds: c.trialRounds.filter((_, j) => j !== i) })} className={`${btn} border-aurix-border text-slate-400`}>{t.remove}</button>
            </div>
          ))}
          <button type="button" onClick={() => set({ trialRounds: [...c.trialRounds, { name: `${t.roundName} ${c.trialRounds.length + 1}`, attempts: 1, combine: 'best', advance: null }] })} className={`${btn} border-aurix-border text-slate-300`}>
            {t.addRound}
          </button>
        </div>
      ) : null}
      {c.format !== 'time_trial' ? (
        <label className="flex items-center gap-2 text-sm text-slate-300">
          <input type="checkbox" checked={c.thirdPlace} onChange={(e) => set({ thirdPlace: e.target.checked })} />
          {t.thirdPlace}
        </label>
      ) : null}
      <button type="button" disabled={busy} onClick={() => act({ action: 'config', config: c })} className={primary}>{t.saveSettings}</button>
    </section>
  )
}

function Teams({ t, candidates, chosen, busy, act }: { t: D; candidates: Candidate[]; chosen: number[]; busy: boolean; act: Act }) {
  // Nothing saved yet: confirmed teams start ticked (owner: "Confirmed, organiser can untick")
  const [sel, setSel] = useState<Set<number>>(() => new Set(chosen.length ? chosen : candidates.filter((c) => c.status === 'CONFIRMED').map((c) => c.id)))
  const toggle = (id: number) => setSel((s) => {
    const n = new Set(s)
    if (n.has(id)) n.delete(id)
    else n.add(id)
    return n
  })
  return (
    <section className={card}>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 className="font-semibold text-white">
          {t.teamsTitle} <span className="text-xs font-mono text-slate-400">{fill(t.teamCount, { n: String(sel.size) })}</span>
        </h3>
        <div className="flex flex-wrap gap-2">
          <button type="button" onClick={() => setSel(new Set(candidates.filter((c) => c.status === 'CONFIRMED').map((c) => c.id)))} className={`${btn} border-aurix-border text-slate-300`}>{t.tickConfirmed}</button>
          <button type="button" onClick={() => setSel(new Set(candidates.filter((c) => c.checkedIn).map((c) => c.id)))} className={`${btn} border-aurix-border text-slate-300`}>{t.tickArrived}</button>
          <button type="button" onClick={() => setSel(new Set(candidates.map((c) => c.id)))} className={`${btn} border-aurix-border text-slate-300`}>{t.tickAll}</button>
          <button type="button" onClick={() => setSel(new Set())} className={`${btn} border-aurix-border text-slate-300`}>{t.tickNone}</button>
        </div>
      </div>
      <p className="text-xs text-slate-400">{t.teamsHelp}</p>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
        {candidates.map((c) => (
          <label key={c.id} className={`flex items-start gap-2 p-2 rounded border text-sm ${sel.has(c.id) ? 'border-aurix-orange/60 bg-aurix-orange/5' : 'border-aurix-border'}`}>
            <input type="checkbox" checked={sel.has(c.id)} onChange={() => toggle(c.id)} className="mt-1" />
            <span>
              <span className="block text-white">{c.name}</span>
              <span className="block text-xs font-mono text-slate-500">
                {c.code}
                {c.checkedIn ? ` · ${t.arrived}` : ''}
                {c.status !== 'CONFIRMED' ? ` · ${t.pending}` : ''}
              </span>
            </span>
          </label>
        ))}
      </div>
      <button type="button" disabled={busy} onClick={() => act({ action: 'teams', teams: [...sel] })} className={primary}>{t.saveTeams}</button>
    </section>
  )
}

function TeamSelect({ t, teams, names, value, onChange, allowBye, label }: { t: D; teams: TeamId[]; names: Map<number, string>; value: Slot; onChange: (s: Slot) => void; allowBye?: boolean; label: string }) {
  return (
    <select aria-label={label} value={value === null ? '' : String(value)} onChange={(e) => onChange(e.target.value === '' ? null : e.target.value === 'BYE' ? 'BYE' : Number(e.target.value))} className={input}>
      <option value="">{t.pickTeam}</option>
      {allowBye ? <option value="BYE">{t.bye}</option> : null}
      {teams.map((id) => (
        <option key={id} value={id}>{names.get(id)}</option>
      ))}
    </select>
  )
}

/** Pairs editor shared by the first draw and the knockout from the groups. */
function PairsEditor({ t, mode, teams, names, locked, setLocked, hand, setHand }: { t: D; mode: string; teams: TeamId[]; names: Map<number, string>; locked: [Slot, Slot][]; setLocked: (x: [Slot, Slot][]) => void; hand: [Slot, Slot][]; setHand: (x: [Slot, Slot][]) => void }) {
  if (mode === 'locked') {
    return (
      <div className="space-y-2">
        {locked.map(([a, b], i) => (
          <div key={i} className="grid grid-cols-[1fr_1fr_auto] gap-2">
            <TeamSelect t={t} teams={teams} names={names} value={a} label={`${t.lockPair} ${i + 1}`} onChange={(x) => setLocked(locked.map((p, j) => (j === i ? [x, p[1]] : p)))} />
            <TeamSelect t={t} teams={teams} names={names} value={b} label={`${t.lockPair} ${i + 1}`} onChange={(x) => setLocked(locked.map((p, j) => (j === i ? [p[0], x] : p)))} />
            <button type="button" onClick={() => setLocked(locked.filter((_, j) => j !== i))} className={`${btn} border-aurix-border text-slate-400`}>{t.remove}</button>
          </div>
        ))}
        <button type="button" onClick={() => setLocked([...locked, [null, null]])} className={`${btn} border-aurix-border text-slate-300`}>{t.lockPair}</button>
      </div>
    )
  }
  if (mode === 'hand') {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
        {hand.map(([a, b], i) => (
          <div key={i} className="grid grid-cols-[4.5rem_1fr_1fr] gap-2 items-center">
            <span className="text-xs font-mono text-slate-500">{fill(t.pairN, { n: String(i + 1) })}</span>
            <TeamSelect t={t} teams={teams} names={names} value={a} allowBye label={fill(t.pairN, { n: String(i + 1) })} onChange={(x) => setHand(hand.map((p, j) => (j === i ? [x, p[1]] : p)))} />
            <TeamSelect t={t} teams={teams} names={names} value={b} allowBye label={fill(t.pairN, { n: String(i + 1) })} onChange={(x) => setHand(hand.map((p, j) => (j === i ? [p[0], x] : p)))} />
          </div>
        ))}
      </div>
    )
  }
  return null
}

const sequentialPairs = (teams: TeamId[]): [Slot, Slot][] => {
  const size = nextPow2(teams.length)
  const slots: Slot[] = [...teams, ...Array(size - teams.length).fill('BYE')]
  // byes against the last teams, never bye v bye
  const out: [Slot, Slot][] = []
  const byes = size - teams.length
  const real = teams.length - byes
  for (let i = 0; i < real; i += 2) out.push([slots[i], slots[i + 1]])
  for (let i = real; i < teams.length; i++) out.push([slots[i], 'BYE'])
  return out
}

function Draw({ t, tour, busy, act }: { t: D; tour: TournamentDoc; busy: boolean; act: Act }) {
  const ids = tour.state.entrants.map((e) => e.id)
  const names = useMemo(() => new Map(Object.entries(displayNames(tour.state.entrants, 'staff')).map(([k, n]) => [Number(k), n])), [tour])
  const [mode, setMode] = useState<'random' | 'locked' | 'hand'>('random')
  const [locked, setLocked] = useState<[Slot, Slot][]>([])
  const [hand, setHand] = useState<[Slot, Slot][]>(() => sequentialPairs(ids))
  const [placed, setPlaced] = useState<Record<string, number>>({})
  const [order, setOrder] = useState<TeamId[]>(ids)
  const f = tour.format
  const modes: ['random' | 'locked' | 'hand', string][] =
    f === 'time_trial' ? [['random', t.drawRandom], ['hand', t.drawOrder]] : [['random', t.drawRandom], ['locked', f === 'league_knockout' ? t.drawLockedGroups : t.drawLocked], ['hand', t.drawHand]]
  const go = () => {
    if (!window.confirm(t.drawConfirm)) return
    const body: Record<string, unknown> = { action: 'draw', mode }
    if (f === 'league_knockout') body.placed = placed
    else if (f === 'time_trial') body.order = order
    else if (mode === 'locked') body.locked = locked.filter(([a, b]) => typeof a === 'number' && typeof b === 'number')
    else if (mode === 'hand') body.hand = hand
    act(body)
  }
  return (
    <section className={card}>
      <h3 className="font-semibold text-white">{t.drawTitle}</h3>
      <div className="flex flex-wrap gap-4">
        {modes.map(([m, label]) => (
          <label key={m} className="flex items-center gap-2 text-sm text-slate-300">
            <input type="radio" name="drawmode" checked={mode === m} onChange={() => setMode(m)} />
            {label}
          </label>
        ))}
      </div>
      {f === 'league_knockout' && mode !== 'random' ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
          {ids.map((id) => (
            <label key={id} className="grid grid-cols-[1fr_7rem] gap-2 items-center text-sm">
              <span className="text-white truncate">{names.get(id)}</span>
              <select
                aria-label={`${t.groupOf} ${names.get(id)}`}
                value={placed[id] ?? ''}
                onChange={(e) => {
                  const next = { ...placed }
                  if (e.target.value === '') delete next[id]
                  else next[id] = Number(e.target.value)
                  setPlaced(next)
                }}
                className={input}
              >
                <option value="">{mode === 'hand' ? t.pickTeam : t.anyGroup}</option>
                {Array.from({ length: tour.config.groups }, (_, g) => (
                  <option key={g} value={g}>{`${t.groupOf} ${groupName(g)}`}</option>
                ))}
              </select>
            </label>
          ))}
        </div>
      ) : null}
      {f === 'time_trial' && mode === 'hand' ? (
        <ol className="space-y-1">
          {order.map((id, i) => (
            <li key={id} className="grid grid-cols-[2rem_1fr_auto_auto] gap-2 items-center text-sm">
              <span className="font-mono text-slate-500">{i + 1}</span>
              <span className="text-white">{names.get(id)}</span>
              <button type="button" aria-label="↑" disabled={i === 0} onClick={() => setOrder(order.map((x, j) => (j === i - 1 ? id : j === i ? order[i - 1] : x)))} className={`${btn} border-aurix-border`}>↑</button>
              <button type="button" aria-label="↓" disabled={i === order.length - 1} onClick={() => setOrder(order.map((x, j) => (j === i + 1 ? id : j === i ? order[i + 1] : x)))} className={`${btn} border-aurix-border`}>↓</button>
            </li>
          ))}
        </ol>
      ) : null}
      {f === 'knockout' || f === 'race_bracket' ? <PairsEditor t={t} mode={mode} teams={ids} names={names} locked={locked} setLocked={setLocked} hand={hand} setHand={setHand} /> : null}
      <button type="button" disabled={busy} onClick={go} className={primary}>{t.drawButton}</button>
    </section>
  )
}

function Play({ t, v, tour, canManage, busy, act }: { t: D; v: V; tour: TournamentDoc; canManage: boolean; busy: boolean; act: Act }) {
  const [match, setMatch] = useState<Match | null>(null)
  const names = useMemo(() => displayNames(tour.state.entrants, 'staff'), [tour])
  const s = tour.state
  const groupsDone = s.groups.length > 0 && s.groupMatches.every((m) => m.result)
  return (
    <div className="space-y-6">
      {match ? <ResultEditor t={t} v={v} tour={tour} m={match} names={names} busy={busy} act={act} close={() => setMatch(null)} /> : null}
      <TournamentView data={{ format: tour.format, status: tour.status, config: tour.config, names, state: s }} v={v} onMatch={(m) => (typeof m.a === 'number' && typeof m.b === 'number' ? setMatch(m) : null)} />
      {canManage && tour.format === 'league_knockout' && !s.bracket.length ? <Knockout t={t} tour={tour} done={groupsDone} busy={busy} act={act} /> : null}
      {tour.format === 'time_trial' ? <Trial t={t} tour={tour} canManage={canManage} busy={busy} act={act} /> : null}
    </div>
  )
}

function Knockout({ t, tour, done, busy, act }: { t: D; tour: TournamentDoc; done: boolean; busy: boolean; act: Act }) {
  const cfg = tour.config
  const names = useMemo(() => new Map(Object.entries(displayNames(tour.state.entrants, 'staff')).map(([k, n]) => [Number(k), n])), [tour])
  const qualified = useMemo(
    () => tour.state.groups.flatMap((g) => standings(g, tour.state.groupMatches.filter((m) => g.includes(m.a as TeamId)), cfg).slice(0, cfg.advancePerGroup).map((r) => r.team)),
    [tour, cfg],
  )
  const [mode, setMode] = useState<'crossover' | 'random' | 'locked' | 'hand'>(cfg.knockoutSeeding === 'crossover' ? 'crossover' : 'random')
  const [locked, setLocked] = useState<[Slot, Slot][]>([])
  const [hand, setHand] = useState<[Slot, Slot][]>(() => sequentialPairs(qualified))
  return (
    <section className={card}>
      <h3 className="font-semibold text-white">{t.knockoutTitle}</h3>
      {!done ? <p className="text-xs text-slate-400">{t.knockoutWait}</p> : null}
      <div className="flex flex-wrap gap-4">
        {([['crossover', t.seedCrossover], ['random', t.drawRandom], ['locked', t.drawLocked], ['hand', t.drawHand]] as const).map(([m, label]) => (
          <label key={m} className="flex items-center gap-2 text-sm text-slate-300">
            <input type="radio" name="komode" checked={mode === m} onChange={() => setMode(m)} />
            {label}
          </label>
        ))}
      </div>
      <PairsEditor t={t} mode={mode} teams={qualified} names={names} locked={locked} setLocked={setLocked} hand={hand} setHand={setHand} />
      <button
        type="button"
        disabled={busy || !done}
        onClick={() => act({ action: 'knockout', mode, ...(mode === 'locked' ? { locked: locked.filter(([a, b]) => typeof a === 'number' && typeof b === 'number') } : {}), ...(mode === 'hand' ? { hand } : {}) })}
        className={primary}
      >
        {t.knockoutButton}
      </button>
    </section>
  )
}

const emptyRun = (): Race => ({ time: null, penalties: {}, falseStarts: 0, dnf: false })

function RunInputs({ t, cfg, run, setRun, label }: { t: D; cfg: Config; run: Race; setRun: (r: Race) => void; label: string }) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-[repeat(auto-fit,minmax(6rem,1fr))] gap-2 items-end">
      <Num label={`${label} · ${t.time}`} value={run.time} min={0} step="any" onChange={(n) => setRun({ ...run, time: n })} />
      {cfg.penalties.map((p) => (
        <Num key={p.key} label={`${p.label} (+${p.seconds})`} value={run.penalties[p.key] ?? 0} min={0} max={99} onChange={(n) => setRun({ ...run, penalties: { ...run.penalties, [p.key]: n ?? 0 } })} />
      ))}
      <Num label={t.falseStartsShort} value={run.falseStarts} min={0} max={10} onChange={(n) => setRun({ ...run, falseStarts: n ?? 0 })} />
      <label className="flex items-center gap-2 text-sm text-slate-300 pb-2">
        <input type="checkbox" checked={run.dnf} onChange={(e) => setRun({ ...run, dnf: e.target.checked })} />
        {t.dnf}
      </label>
    </div>
  )
}

function ResultEditor({ t, v, tour, m, names, busy, act, close }: { t: D; v: V; tour: TournamentDoc; m: Match; names: Record<string, string>; busy: boolean; act: Act; close: () => void }) {
  const cfg = tour.config
  const race = cfg.format === 'race_bracket'
  const r = m.result || {}
  const [a, setA] = useState<number | null>(r.a ?? null)
  const [b, setB] = useState<number | null>(r.b ?? null)
  const [penA, setPenA] = useState<number | null>(r.penA ?? null)
  const [penB, setPenB] = useState<number | null>(r.penB ?? null)
  const fillRuns = (x?: Race[]) => Array.from({ length: cfg.runsPerHeat }, (_, i) => x?.[i] || emptyRun())
  const [runsA, setRunsA] = useState<Race[]>(() => fillRuns(r.runsA))
  const [runsB, setRunsB] = useState<Race[]>(() => fillRuns(r.runsB))
  const level = a !== null && a === b && m.stage !== 'group'
  const nameA = names[String(m.a)] || v.tbd
  const nameB = names[String(m.b)] || v.tbd
  const save = async () => {
    const ok = await act({ action: 'result', match: m.id, result: race ? { runsA, runsB } : { a, b, ...(level ? { penA, penB } : {}) } })
    if (ok) close()
  }
  return (
    <section className={`${card} border-aurix-orange/60`}>
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-white">
          {t.resultTitle}: {nameA} {v.vs} {nameB}
        </h3>
        <button type="button" onClick={close} className="text-xs font-mono text-slate-400 hover:text-white">{t.close}</button>
      </div>
      {race ? (
        <div className="space-y-4">
          {([[nameA, runsA, setRunsA], [nameB, runsB, setRunsB]] as const).map(([n, runs, setRuns]) => (
            <div key={n} className="space-y-2">
              <span className="block text-sm text-white">{n}</span>
              {runs.map((run, i) => (
                <RunInputs key={i} t={t} cfg={cfg} run={run} label={fill(t.runN, { n: String(i + 1) })} setRun={(x) => setRuns(runs.map((y, j) => (j === i ? x : y)))} />
              ))}
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3 max-w-md">
          <Num label={`${nameA} · ${t.goals}`} value={a} min={0} onChange={setA} />
          <Num label={`${nameB} · ${t.goals}`} value={b} min={0} onChange={setB} />
          {level ? (
            <>
              <Num label={`${nameA} · ${t.shootout}`} value={penA} min={0} onChange={setPenA} />
              <Num label={`${nameB} · ${t.shootout}`} value={penB} min={0} onChange={setPenB} />
            </>
          ) : null}
        </div>
      )}
      <div className="flex flex-wrap gap-2">
        <button type="button" disabled={busy} onClick={save} className={primary}>{t.saveResult}</button>
        {m.result ? (
          <button type="button" disabled={busy} onClick={async () => (await act({ action: 'clear', match: m.id })) && close()} className={`${btn} border-aurix-border text-slate-300`}>
            {t.clearResult}
          </button>
        ) : null}
      </div>
    </section>
  )
}

function Trial({ t, tour, canManage, busy, act }: { t: D; tour: TournamentDoc; canManage: boolean; busy: boolean; act: Act }) {
  const cfg = tour.config
  const s = tour.state
  const last = s.trial[s.trial.length - 1]
  const names = useMemo(() => new Map(Object.entries(displayNames(s.entrants, 'staff')).map(([k, n]) => [Number(k), n])), [s])
  const def = last ? cfg.trialRounds[last.round] : null
  const [count, setCount] = useState<number | null>(last && cfg.trialRounds[last.round]?.advance ? cfg.trialRounds[last.round].advance : null)
  const [ties, setTies] = useState(false)
  if (!last || !def) return null
  const hasNext = last.round + 1 < cfg.trialRounds.length
  return (
    <section className={card}>
      <h3 className="font-semibold text-white">{def.name}</h3>
      <div className="space-y-3">
        {last.entries.map((e, i) => (
          <div key={e.team} className="rounded border border-aurix-border p-2 space-y-2">
            <span className="block text-sm text-white">
              <span className="font-mono text-slate-500 mr-2">{i + 1}</span>
              {names.get(e.team)}
            </span>
            {Array.from({ length: def.attempts }, (_, k) => k + 1).map((attempt) => (
              <TrialRunRow key={attempt} t={t} cfg={cfg} attempt={attempt} saved={e.runs.find((r) => r.attempt === attempt) || null} busy={busy} onSave={(run) => act({ action: 'run', round: last.round, team: e.team, attempt, run })} />
            ))}
          </div>
        ))}
      </div>
      {canManage && hasNext ? (
        <div className="border-t border-aurix-border pt-3 space-y-2">
          <h4 className="text-sm font-semibold text-white">{t.advanceTitle}</h4>
          <div className="flex flex-wrap items-end gap-3">
            <div className="w-40">
              <Num label={t.advanceCount} value={count} min={1} onChange={setCount} />
            </div>
            <label className="flex items-center gap-2 text-sm text-slate-300 pb-2">
              <input type="checkbox" checked={ties} onChange={(e) => setTies(e.target.checked)} />
              {t.advanceTies}
            </label>
            <button type="button" disabled={busy || !count} onClick={() => act({ action: 'advance', round: last.round, count, includeTies: ties })} className={primary}>
              {t.advanceButton}
            </button>
          </div>
        </div>
      ) : null}
    </section>
  )
}

function TrialRunRow({ t, cfg, attempt, saved, busy, onSave }: { t: D; cfg: Config; attempt: number; saved: Race | null; busy: boolean; onSave: (r: Race | null) => void }) {
  const [run, setRun] = useState<Race>(saved || emptyRun())
  return (
    <div className="flex flex-col md:flex-row md:items-end gap-2">
      <div className="flex-1">
        <RunInputs t={t} cfg={cfg} run={run} setRun={setRun} label={fill(t.attemptN, { n: String(attempt) })} />
      </div>
      <div className="flex gap-2 pb-0.5">
        <button type="button" disabled={busy} onClick={() => onSave(run)} className={primary}>{t.saveRun}</button>
        {saved ? (
          <button type="button" disabled={busy} onClick={() => onSave(null)} className={`${btn} border-aurix-border text-slate-300`}>{t.clearRun}</button>
        ) : null}
      </div>
    </div>
  )
}
