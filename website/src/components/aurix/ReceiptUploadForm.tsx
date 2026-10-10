'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Upload, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react'
import { fill } from '@/lib/form-texts-defaults'
import { prepareIdFile } from '@/components/aurix/id-file'

const MAX = 5 * 1024 * 1024
const EXT = /\.(pdf|jpe?g|png|webp)$/i
const inputClass = 'w-full rounded-lg bg-aurix-dark border border-aurix-border px-3 py-2.5 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-aurix-orange'

/** PUT the file to the signed R2 link with progress. */
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

/**
 * One team's receipt upload (/aurix/payment-done). Photos and screenshots are resized in the browser (max 1600 px,
 * re-saved as JPEG, which also drops hidden photo data such as location); PDFs are sent as they are (≤ 5 MB).
 */
export function ReceiptUploadForm({ code, paymentId: initialPaymentId, t }: { code: string; paymentId: string; t: Record<string, string> }) {
  const router = useRouter()
  const [file, setFile] = useState<File | null>(null)
  const [paymentId, setPaymentId] = useState(initialPaymentId)
  const [busy, setBusy] = useState('')
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
    if (!file) return setError(t.errNone)
    if (!EXT.test(file.name)) return setError(t.errType)
    try {
      setBusy(fill(t.uploading, { pct: 0 }))
      const ready = await prepareIdFile(file)
      if (ready.size > MAX) throw new Error(t.errSize)
      const link = await post('/api/aurix/receipt/upload-url', { code, filename: ready.name, size: ready.size })
      try {
        await put(link.url, ready, link.contentType, (pct) => setBusy(fill(t.uploading, { pct })))
      } catch {
        throw new Error(t.errNetwork)
      }
      setBusy(t.saving)
      const saved = await post('/api/aurix/receipt', { code, token: link.token, paymentId })
      setDone(saved.message || t.done)
      setFile(null)
      router.refresh()
    } catch (err: any) {
      setError(err.message || t.errFailed)
    } finally {
      setBusy('')
    }
  }

  return (
    <form onSubmit={submit} className="space-y-3">
      <label className="block space-y-1.5">
        <span className="text-xs font-mono uppercase text-slate-400">{t.paymentIdLabel}</span>
        <input className={inputClass} value={paymentId} onChange={(e) => setPaymentId(e.target.value)} maxLength={44} autoComplete="off" />
      </label>
      <label className="flex items-center gap-3 text-xs text-slate-300 cursor-pointer">
        <span className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-aurix-dark border border-aurix-border hover:border-aurix-orange">
          <Upload className="w-3.5 h-3.5 text-aurix-orange" /> {t.choose}
        </span>
        <span className="truncate">{file ? file.name : t.noFile}</span>
        <input type="file" accept="application/pdf,image/jpeg,image/png,image/webp,image/*" className="sr-only" onChange={(e) => setFile(e.target.files?.[0] || null)} />
      </label>
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
        {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />} {busy || t.submit}
      </button>
    </form>
  )
}
