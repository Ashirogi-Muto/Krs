'use client'

import React from 'react'
import { useField } from '@payloadcms/ui'

/**
 * A JSON field edited as plain text (owner, 20 Oct 2026: Super Admin corrections of judge scores and tournaments).
 * Payload's own JSON editor loads Monaco from a CDN that the site's Content-Security-Policy blocks, so these fields use
 * a textarea: "marks" shows one "key: mark" per line, "json" shows formatted JSON. An edited box sends its text; the
 * collection's beforeValidate hook parses and checks it (and refuses it with a clear message).
 */
const toText = (value: unknown, mode: 'marks' | 'json') => {
  if (value === null || value === undefined) return ''
  if (typeof value === 'string') return value
  if (mode === 'marks' && typeof value === 'object') return Object.entries(value as Record<string, unknown>).map(([k, v]) => `${k}: ${v}`).join('\n')
  return JSON.stringify(value, null, 2)
}

export function JsonTextField(props: any) {
  const { path, readOnly, field, mode = 'json', rows = 12 } = props
  const { value, setValue, showError, errorMessage } = useField<unknown>({ path })
  // Bound to the field value itself (a separate copy went stale while the form loaded and mixed old and new text)
  const text = toText(value, mode)
  const label = typeof field?.label === 'string' ? field.label : field?.name
  const description = typeof field?.admin?.description === 'string' ? field.admin.description : ''
  const id = `field-${String(path).replace(/\./g, '__')}`
  return (
    <div className="field-type textarea" style={{ marginBottom: 24 }}>
      <label className="field-label" htmlFor={id}>
        {label}
      </label>
      <textarea
        id={id}
        rows={rows}
        value={text}
        disabled={Boolean(readOnly)}
        spellCheck={false}
        onChange={(e) => setValue(e.target.value)}
        style={{ width: '100%', fontFamily: 'var(--font-mono, monospace)', fontSize: 13, padding: 10, borderRadius: 4, border: '1px solid var(--theme-elevation-150)', background: 'var(--theme-input-bg)', color: 'var(--theme-text)' }}
      />
      {showError && errorMessage ? <div className="field-error" style={{ color: 'var(--theme-error-500)', fontSize: 12 }}>{errorMessage}</div> : null}
      {description ? <div className="field-description" style={{ fontSize: 12, color: 'var(--theme-elevation-500)', marginTop: 4 }}>{description}</div> : null}
    </div>
  )
}
