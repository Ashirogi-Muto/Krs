'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import { AlertCircle, CheckCircle2, Loader2, Upload } from 'lucide-react'
import { fill } from '@/lib/form-texts-defaults'

const MAX = 15 * 1024 * 1024
const EXT = /\.(pdf|pptx?)$/i
const inputClass =
  'w-full px-3 py-2.5 rounded-lg bg-aurix-dark border border-aurix-border text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-aurix-orange'

export type SubmissionFormProps = {
  code: string
  round: number
  kind: 'PROPOSAL' | 'CODE_AND_DEMO'
  tracks: string[]
  hasFile: boolean
  initial: { title: string; track: string; repositoryUrl: string; demoUrl: string }
  t: Record<string, string>
}

/** PUT the file to the signed R2 link with progress (XHR: fetch has no upload progress). */
function put(url: string, file: File, contentType: string, onProgress: (pct: number) => void) {
  return new Promise<void>((resolve, reject) => {
    const xhr = new XMLHttpRequest()
    xhr.open('PUT', url)
    xhr.setRequestHeader('Content-Type', contentType)
    xhr.upload.onprogress = (e) => e.lengthComputable && onProgress(Math.round((e.loaded / e.total) * 100))
    xhr.onload = () => (xhr.status >= 200 && xhr.status < 300 ? resolve() : reject(new Error('upload')))
    xhr.onerror = () => reject(new Error('network'))
    xhr.send(file)
  })
}

/** One round's submission form (participant portal). Step 1 signed link → step 2 upload to R2 → step 3 save. */
export function SubmissionForm({ code, round, kind, tracks, hasFile, initial, t }: SubmissionFormProps) {
  const router = useRouter()
  const [title, setTitle] = useState(initial.title)
  const [track, setTrack] = useState(initial.track)
  const [repo, setRepo] = useState(initial.repositoryUrl)
  const [demo, setDemo] = useState(initial.demoUrl)
  const [file, setFile] = useState<File | null>(null)
  const [busy, setBusy] = useState<string>('')
  const [error, setError] = useState('')
  const [done, setDone] = useState('')

  const post = async (url: string, body: unknown) => {
    const res = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
    const data = await res.json().catch(() => ({}))
    if (!res.ok || !data.success) throw new Error(data.message || t.errFailed)
    return data
  }

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setDone('')
    if (file && !EXT.test(file.name)) return setError(t.errType)
    if (file && file.size > MAX) return setError(t.errSize)
    if (kind === 'PROPOSAL' && !file && !hasFile) return setError(t.errFileMissing)
    try {
      let token: string | undefined
      if (file) {
        setBusy(fill(t.uploading, { pct: 0 }))
        const link = await post('/api/aurix/submissions/upload-url', { code, round, filename: file.name, size: file.size })
        try {
          await put(link.url, file, link.contentType, (pct) => setBusy(fill(t.uploading, { pct })))
        } catch {
          throw new Error(t.errNetwork)
        }
        token = link.token
      }
      setBusy(t.saving)
      const saved = await post('/api/aurix/submissions', { code, round, title, track, repositoryUrl: repo, demoUrl: demo, token })
      setDone(saved.message || t.saved)
      setFile(null)
      router.refresh()
    } catch (err: any) {
      setError(err.message || t.errFailed)
    } finally {
      setBusy('')
    }
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <label className="block space-y-1.5">
          <span className="text-xs font-mono uppercase text-slate-400">{t.titleLabel}</span>
          <input className={inputClass} value={title} onChange={(e) => setTitle(e.target.value)} required minLength={2} maxLength={150} />
        </label>
        <label className="block space-y-1.5">
          <span className="text-xs font-mono uppercase text-slate-400">{t.trackLabel}</span>
          {tracks.length ? (
            <select className={inputClass} value={track} onChange={(e) => setTrack(e.target.value)} required>
              <option value="">{t.trackChoose}</option>
              {tracks.map((tr) => (
                <option key={tr} value={tr}>
                  {tr}
                </option>
              ))}
            </select>
          ) : (
            <input className={inputClass} value={track} onChange={(e) => setTrack(e.target.value)} maxLength={100} />
          )}
        </label>
      </div>
      {kind === 'CODE_AND_DEMO' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <label className="block space-y-1.5">
            <span className="text-xs font-mono uppercase text-slate-400">{t.repoLabel}</span>
            <input className={inputClass} type="url" value={repo} onChange={(e) => setRepo(e.target.value)} required />
          </label>
          <label className="block space-y-1.5">
            <span className="text-xs font-mono uppercase text-slate-400">{t.demoLabel}</span>
            <input className={inputClass} type="url" value={demo} onChange={(e) => setDemo(e.target.value)} />
          </label>
        </div>
      )}
      <div className="space-y-1.5">
        <span className="text-xs font-mono uppercase text-slate-400">{kind === 'PROPOSAL' ? t.fileLabel : t.fileOptional}</span>
        <label className="flex items-center gap-3 text-xs text-slate-300 cursor-pointer">
          <span className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-aurix-dark border border-aurix-border hover:border-aurix-orange">
            <Upload className="w-3.5 h-3.5 text-aurix-orange" /> {t.fileChoose}
          </span>
          <span className="truncate">{file ? file.name : hasFile ? t.fileKeep : t.fileNone}</span>
          <input
            type="file"
            accept=".ppt,.pptx,.pdf,application/pdf,application/vnd.ms-powerpoint,application/vnd.openxmlformats-officedocument.presentationml.presentation"
            className="sr-only"
            onChange={(e) => setFile(e.target.files?.[0] || null)}
          />
        </label>
        {hasFile && <p className="text-[11px] text-slate-500">{t.replaceNote}</p>}
      </div>
      {error && (
        <div className="p-3 rounded-lg bg-red-950/50 border border-red-800 text-red-300 text-sm flex items-start gap-2">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" /> {error}
        </div>
      )}
      {done && (
        <div className="p-3 rounded-lg bg-green-950/40 border border-green-800 text-green-300 text-sm flex items-start gap-2" role="status">
          <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" /> {done}
        </div>
      )}
      <button
        type="submit"
        disabled={Boolean(busy)}
        className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-lg bg-aurix-orange text-black font-semibold text-xs font-mono uppercase tracking-wider hover:bg-orange-400 transition-colors disabled:opacity-60"
      >
        {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />} {busy || (hasFile || initial.title ? t.update : t.submit)}
      </button>
    </form>
  )
}
