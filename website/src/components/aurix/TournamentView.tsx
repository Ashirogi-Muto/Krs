import React from 'react'
import { fill } from '@/lib/form-texts-defaults'
import { combineRuns, podium, standings, trialRanking, type Config, type Match, type Slot, type State } from '@/lib/tournament'
import type { TournamentTexts } from '@/lib/tournament-texts-defaults'

/**
 * Bracket, league tables and time-trial leaderboard (owner, 20 Oct 2026). Read-only and hook-free: the competition
 * page renders it on the server (team names only); /tournaments renders it in the browser with `onMatch` to open a
 * result. Every word comes from CMS → Website → Tournament texts.
 */
export type ViewData = { format: Config['format']; status: string; config: Config; names: Record<string, string>; state: State }

const GROUP_LETTERS = 'ABCDEFGHIJKLMNOP'
export const groupName = (i: number) => GROUP_LETTERS[i] || String(i + 1)

export function roundLabel(round: number, rounds: number, v: TournamentTexts['view']) {
  if (round === rounds) return v.final
  if (round === rounds - 1) return v.semi
  if (round === rounds - 2) return v.quarter
  return fill(v.roundOf, { n: String(2 ** (rounds - round + 1)) })
}

const fmtTime = (t: number | null, d: number) => (t === null ? null : t.toFixed(d))

export default function TournamentView({ data, v, onMatch }: { data: ViewData; v: TournamentTexts['view']; onMatch?: (m: Match) => void }) {
  const { state: s, config: cfg, names } = data
  const name = (x: Slot) => (x === 'BYE' ? v.bye : x === null ? v.tbd : names[String(x)] || v.tbd)
  if (!s.draw) return <p className="text-sm text-slate-400">{v.notDrawn}</p>
  const p = podium(s)
  return (
    <div className="space-y-8">
      {data.status === 'FINISHED' && p.first !== null ? (
        <div className="flex flex-wrap gap-3">
          {([[v.champion, p.first, 'border-aurix-orange text-aurix-orange'], [v.runnerUp, p.second, 'border-slate-500 text-slate-200'], [v.thirdPlace, p.third, 'border-amber-800 text-amber-500']] as const).map(([label, team, cls]) =>
            team !== null ? (
              <div key={label} className={`px-4 py-2 rounded-lg border bg-aurix-surface ${cls}`}>
                <span className="block text-[10px] font-mono uppercase tracking-wider">{label}</span>
                <span className="block font-display font-bold text-white">{name(team)}</span>
              </div>
            ) : null,
          )}
        </div>
      ) : null}

      {s.groups.length ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {s.groups.map((g, gi) => {
            const ms = s.groupMatches.filter((m) => m.group === gi)
            const table = standings(g, ms, cfg)
            return (
              <div key={gi} className="rounded-xl border border-aurix-border bg-aurix-surface/60 p-4 space-y-3">
                <h4 className="font-display font-bold text-white">{fill(v.group, { name: groupName(gi) })}</h4>
                <div className="overflow-x-auto">
                  <table className="w-full text-xs font-mono">
                    <thead className="text-slate-500">
                      <tr>
                        <th className="text-left py-1 pr-2">{v.colTeam}</th>
                        {[v.colP, v.colW, v.colD, v.colL, v.colGF, v.colGA, v.colGD, v.colPts].map((h) => (
                          <th key={h} className="text-right py-1 px-1">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {table.map((r, i) => (
                        <tr key={r.team} className={`border-t border-aurix-border/60 ${i < cfg.advancePerGroup ? 'text-white' : 'text-slate-400'}`}>
                          <td className="py-1 pr-2 font-sans">{name(r.team)}</td>
                          {[r.played, r.won, r.drawn, r.lost, r.gf, r.ga, r.gd, r.points].map((x, k) => (
                            <td key={k} className={`text-right py-1 px-1 ${k === 7 ? 'font-bold text-aurix-orange' : ''}`}>{x}</td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div className="space-y-1">
                  <span className="block text-[10px] font-mono uppercase tracking-wider text-slate-500">{v.matches}</span>
                  {ms.map((m) => (
                    <MatchLine key={m.id} m={m} name={name} v={v} cfg={cfg} onMatch={onMatch} />
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      ) : null}

      {s.bracket.length ? <Bracket s={s} cfg={cfg} name={name} v={v} onMatch={onMatch} /> : null}

      {s.trial.length ? (
        <div className="space-y-6">
          {[...s.trial].reverse().map((r) => {
            const def = cfg.trialRounds[r.round]
            const rank = trialRanking(r.entries, def, cfg)
            return (
              <div key={r.round} className="rounded-xl border border-aurix-border bg-aurix-surface/60 p-4 space-y-2">
                <h4 className="font-display font-bold text-white">{def?.name}</h4>
                <table className="w-full text-sm">
                  <thead className="text-xs font-mono text-slate-500">
                    <tr>
                      <th className="text-left py-1 w-10">{v.colPos}</th>
                      <th className="text-left py-1">{v.colTeam}</th>
                      <th className="text-right py-1">{v.colTime}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rank.map((x, i) => (
                      <tr key={x.team} className="border-t border-aurix-border/60">
                        <td className="py-1 font-mono text-slate-400">{x.time !== null ? i + 1 : ''}</td>
                        <td className="py-1 text-white">{name(x.team)}</td>
                        <td className="py-1 text-right font-mono">
                          {x.time !== null ? fill(v.seconds, { t: fmtTime(x.time, cfg.timeDecimals)! }) : x.runs ? (x.dsq ? v.dsq : v.out) : v.notRun}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )
          })}
          {cfg.penalties.length ? <p className="text-xs text-slate-500">{fill(v.penaltyLegend, { list: cfg.penalties.map((x) => `${x.label} +${x.seconds} s`).join(' · ') })}</p> : null}
        </div>
      ) : null}
    </div>
  )
}

function sideScore(m: Match, side: 'a' | 'b', cfg: Config, v: TournamentTexts['view']): string {
  const r = m.result
  if (!r) return ''
  if (cfg.format === 'race_bracket' || cfg.format === 'time_trial') {
    const t = combineRuns((side === 'a' ? r.runsA : r.runsB) || [], cfg, cfg.heatCombine)
    return t === null ? v.out : fill(v.seconds, { t: fmtTime(t, cfg.timeDecimals)! })
  }
  return String(side === 'a' ? r.a : r.b)
}

function MatchLine({ m, name, v, cfg, onMatch }: { m: Match; name: (x: Slot) => string; v: TournamentTexts['view']; cfg: Config; onMatch?: (m: Match) => void }) {
  const inner = (
    <>
      <span className={m.result && m.winner === m.a ? 'text-white font-semibold' : 'text-slate-300'}>{name(m.a)}</span>
      <span className="font-mono text-aurix-orange px-2">{m.result ? `${sideScore(m, 'a', cfg, v)} – ${sideScore(m, 'b', cfg, v)}` : v.vs}</span>
      <span className={m.result && m.winner === m.b ? 'text-white font-semibold' : 'text-slate-300'}>{name(m.b)}</span>
    </>
  )
  return onMatch ? (
    <button type="button" onClick={() => onMatch(m)} className="block w-full text-left text-xs hover:bg-aurix-dark/60 rounded px-1 py-0.5">
      {inner}
    </button>
  ) : (
    <p className="text-xs px-1 py-0.5">{inner}</p>
  )
}

function Bracket({ s, cfg, name, v, onMatch }: { s: State; cfg: Config; name: (x: Slot) => string; v: TournamentTexts['view']; onMatch?: (m: Match) => void }) {
  const main = s.bracket.filter((m) => m.stage === 'bracket')
  const rounds = Math.max(...main.map((m) => m.round))
  const third = s.bracket.find((m) => m.stage === 'third')
  const card = (m: Match) => {
    const row = (side: 'a' | 'b') => {
      const team = side === 'a' ? m.a : m.b
      const won = m.winner !== null && m.winner === team
      return (
        <div className={`flex items-center justify-between gap-2 px-2 py-1 ${won ? 'text-white font-semibold' : team === 'BYE' || team === null ? 'text-slate-500' : 'text-slate-300'}`}>
          <span className="truncate">{name(team)}</span>
          <span className="font-mono text-xs text-aurix-orange shrink-0">
            {sideScore(m, side, cfg, v)}
            {m.result?.penA !== undefined && m.result?.penA !== null ? ` (${side === 'a' ? m.result.penA : m.result.penB})` : ''}
          </span>
        </div>
      )
    }
    const body = (
      <div className={`rounded-lg border bg-aurix-surface text-sm divide-y divide-aurix-border/60 ${m.locked ? 'border-aurix-orange/50' : 'border-aurix-border'}`}>
        {row('a')}
        {row('b')}
      </div>
    )
    const playable = typeof m.a === 'number' && typeof m.b === 'number'
    return onMatch && playable ? (
      <button key={m.id} type="button" onClick={() => onMatch(m)} className="block w-full text-left hover:opacity-90">
        {body}
      </button>
    ) : (
      <div key={m.id}>{body}</div>
    )
  }
  return (
    <div className="overflow-x-auto pb-2">
      <div className="flex gap-4 min-w-max">
        {Array.from({ length: rounds }, (_, i) => i + 1).map((r) => (
          <div key={r} className="w-52 flex flex-col">
            <span className="block text-[10px] font-mono uppercase tracking-wider text-slate-500 mb-2">{roundLabel(r, rounds, v)}</span>
            <div className="flex-1 flex flex-col justify-around gap-3">{main.filter((m) => m.round === r).sort((a, b) => a.slot - b.slot).map(card)}</div>
            {r === rounds && third ? (
              <div className="mt-6">
                <span className="block text-[10px] font-mono uppercase tracking-wider text-slate-500 mb-2">{v.third}</span>
                {card(third)}
              </div>
            ) : null}
          </div>
        ))}
      </div>
    </div>
  )
}
