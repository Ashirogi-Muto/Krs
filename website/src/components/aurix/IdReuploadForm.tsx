'use client'

import React, { useState } from 'react'
import { AlertCircle, CheckCircle2, Loader2, Upload } from 'lucide-react'
import { fill, type FormTexts } from '@/lib/form-texts-defaults'
import { MAX_UPLOAD_BYTES, prepareIdFile } from './id-file'

type Reg = { code: string; team: string; event: string; reason: string; deadline: string; members: { name: string; hasCard: boolean }[] }

/** One rejected team: choose new ID cards for any member and upload them (/api/aurix/id-reupload). */
export function IdReuploadForm({ reg, t }: { reg: Reg; t: FormTexts['idUpdate'] }) {
  const [files, setFiles] = useState<(File | null)[]>(reg.members.map(() => null))
  const [state, setState] = useState<'idle' | 'busy' | 'done'>('idle')
  const [error, setError] = useState('')

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    if (!files.some(Boolean)) return setError(t.errNone)
    setState('busy')
    try {
      const data = new FormData()
      data.append('code', reg.code)
      for (let i = 0; i < files.length; i++) {
        const f = files[i]
        if (!f) continue
        const prepared = await prepareIdFile(f)
        if (prepared.size > MAX_UPLOAD_BYTES) throw new Error(fill(t.errFileSize, { name: reg.members[i].name }))
        data.append(`id_${i}`, prepared, prepared.name)
      }
      const res = await fetch('/api/aurix/id-reupload', { method: 'POST', body: data })
      const body = await res.json().catch(() => ({}))
      if (!res.ok || !body.success) throw new Error(body.message || t.errFailed)
      setState('done')
    } catch (err: any) {
      setError(err.message || t.errFailed)
      setState('idle')
    }
  }

  if (state === 'done')
    return (
      <div className="aurix-card rounded-2xl p-6 flex items-start gap-3" role="status">
        <CheckCircle2 className="w-5 h-5 text-green-400 shrink-0 mt-0.5" />
        <p className="text-sm text-slate-200">{t.done}</p>
      </div>
    )

  return (
    <form onSubmit={submit} className="aurix-card rounded-2xl p-5 sm:p-8 space-y-5">
      <div className="space-y-1">
        <div className="text-xs font-mono uppercase text-aurix-orange">{reg.code}</div>
        <h2 className="text-xl font-display font-bold text-white">{reg.team}</h2>
        {reg.event && <p className="text-sm text-slate-400">{reg.event}</p>}
      </div>
      {reg.reason && (
        <div className="rounded-lg border border-red-800 bg-red-950/40 p-3 text-sm text-red-200">
          <span className="font-semibold">{t.reasonLabel}:</span> {reg.reason}
        </div>
      )}
      {reg.deadline && <p className="text-sm text-yellow-300">{reg.deadline}</p>}
      <div className="space-y-3">
        {reg.members.map((m, i) => (
          <div key={i} className="flex flex-col sm:flex-row sm:items-center gap-3 justify-between rounded-lg border border-aurix-border p-3">
            <div>
              <div className="text-sm text-white">{m.name}</div>
              <div className="text-[11px] font-mono uppercase text-slate-400">
                {i === 0 ? t.leader : fill(t.member, { n: i + 1 })} · {m.hasCard ? t.current : t.missing}
              </div>
            </div>
            <label className="flex items-center gap-3 text-xs text-slate-300 cursor-pointer">
              <span className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-aurix-dark border border-aurix-border hover:border-aurix-orange">
                <Upload className="w-3.5 h-3.5 text-aurix-orange" /> {t.choose}
              </span>
              <span className="truncate max-w-[10rem]">{files[i] ? files[i]!.name : t.noFile}</span>
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp,application/pdf"
                className="sr-only"
                onChange={(e) => {
                  const f = e.target.files?.[0] || null
                  setFiles((prev) => prev.map((x, j) => (j === i ? f : x)))
                }}
              />
            </label>
          </div>
        ))}
      </div>
      {error && (
        <div className="p-3 rounded-lg bg-red-950/50 border border-red-800 text-red-300 text-sm flex items-start gap-2">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" /> {error}
        </div>
      )}
      <button
        type="submit"
        disabled={state === 'busy'}
        className="w-full inline-flex items-center justify-center gap-2 px-6 py-3 rounded-lg bg-aurix-orange text-black font-semibold text-xs font-mono uppercase tracking-wider hover:bg-orange-400 transition-colors disabled:opacity-60"
      >
        {state === 'busy' ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />} {state === 'busy' ? t.submitting : t.submit}
      </button>
    </form>
  )
}
