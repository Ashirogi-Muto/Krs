'use client'

import React, { useState } from 'react'
import { CheckCircle2, Send } from 'lucide-react'
import { useTurnstile } from '@/components/auth/Turnstile'

type Field = { label: string; type?: string; required?: boolean; halfWidth?: boolean; placeholder?: string; options?: { item: string }[] }

const input =
  'w-full px-4 py-2.5 rounded-lg bg-krs-dark border border-krs-border text-white text-sm focus:border-krs-cyan outline-none'

/** A website form built in the CMS; posts to /api/forms which validates against the same field list. */
export function CmsForm({
  path, block, fields, submitLabel, sendingLabel, successTitle, successText,
}: {
  path: string
  block: string
  fields: Field[]
  submitLabel?: string
  sendingLabel?: string
  successTitle?: string
  successText?: string
}) {
  const [values, setValues] = useState<Record<string, string>>({})
  const [trap, setTrap] = useState('')
  const [state, setState] = useState<'idle' | 'sending' | 'done'>('idle')
  const [error, setError] = useState('')
  const captcha = useTurnstile()

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setState('sending')
    setError('')
    try {
      const res = await fetch('/api/forms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...captcha.headers() },
        body: JSON.stringify({ path, block, values, website: trap }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok || !data.ok) throw new Error(data.message || 'Could not send the form. Please try again.')
      setState('done')
    } catch (err: any) {
      setError(err.message || 'Could not send the form. Please try again.')
      setState('idle')
      captcha.reset()
    }
  }

  if (state === 'done')
    return (
      <div className="p-8 rounded-2xl bg-krs-surface border border-krs-cyan/40 text-center space-y-4" role="status">
        <div className="w-12 h-12 rounded-full bg-cyan-950/60 border border-krs-cyan text-krs-cyan mx-auto flex items-center justify-center">
          <CheckCircle2 className="w-6 h-6" />
        </div>
        <h2 className="text-2xl font-display font-bold text-white">{successTitle || 'Thank you'}</h2>
        {successText && <p className="text-slate-300 text-sm max-w-md mx-auto whitespace-pre-line">{successText}</p>}
      </div>
    )

  return (
    <form onSubmit={onSubmit} className="tech-card rounded-2xl p-6 sm:p-8 space-y-6" noValidate={false}>
      {/* Spam trap: invisible to people, bots fill it */}
      <div aria-hidden="true" className="absolute -left-[9999px] w-px h-px overflow-hidden">
        <label>
          Website
          <input tabIndex={-1} autoComplete="off" value={trap} onChange={(e) => setTrap(e.target.value)} />
        </label>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        {fields.map((f, i) => {
          const id = `f-${block}-${i}`
          const common = {
            id,
            required: !!f.required,
            value: values[String(i)] || '',
            onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
              setValues((v) => ({ ...v, [String(i)]: e.target.value })),
            className: input,
          }
          return (
            <div key={i} className={`space-y-2 ${f.halfWidth ? '' : 'sm:col-span-2'}`}>
              <label htmlFor={id} className="text-xs font-mono text-slate-300 block">
                {f.label}
                {f.required ? ' *' : ''}
              </label>
              {f.type === 'textarea' ? (
                <textarea {...common} rows={4} maxLength={5000} placeholder={f.placeholder || undefined} />
              ) : f.type === 'select' ? (
                <select {...common}>
                  <option value="">{f.placeholder || 'Select'}</option>
                  {(f.options || []).map((o) => (
                    <option key={o.item} value={o.item}>
                      {o.item}
                    </option>
                  ))}
                </select>
              ) : (
                <input
                  {...common}
                  type={f.type === 'email' ? 'email' : f.type === 'tel' ? 'tel' : 'text'}
                  maxLength={f.type === 'email' ? 254 : 300}
                  placeholder={f.placeholder || undefined}
                />
              )}
            </div>
          )
        })}
      </div>
      {error && (
        <p className="text-sm text-red-400" role="alert">
          {error}
        </p>
      )}
      {captcha.element}
      <button
        type="submit"
        disabled={state === 'sending' || !captcha.ready}
        className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-3 rounded-lg bg-krs-cyan text-black font-semibold text-xs font-mono uppercase hover:bg-cyan-400 transition-colors shadow-md disabled:opacity-50"
      >
        {state === 'sending' ? sendingLabel || 'Sending…' : submitLabel || 'Send'}
        <Send className="w-4 h-4" />
      </button>
    </form>
  )
}
