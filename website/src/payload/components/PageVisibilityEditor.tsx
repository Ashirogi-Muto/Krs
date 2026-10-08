'use client'

import React, { useMemo, useState } from 'react'
import { fill } from '../../lib/form-texts-defaults'
import { visibilityGroupLabels, type StaffTexts } from '../../lib/staff-texts-defaults'

export type VisibilityRow = { route: string; label: string; group: string; note?: string }

const GROUP_ORDER = ['KRS site', 'AURIX site', 'Competitions', 'Your pages', 'Accounts & portals', 'Legal', 'Other']
const box: React.CSSProperties = { border: '1px solid var(--theme-elevation-150)', borderRadius: 8, marginBottom: 20, overflow: 'hidden' }
const field: React.CSSProperties = {
  padding: '8px 10px',
  borderRadius: 4,
  border: '1px solid var(--theme-elevation-150)',
  background: 'var(--theme-input-bg)',
  color: 'var(--theme-text)',
  fontSize: 14,
}
const rowStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: 16,
  padding: '10px 14px',
  borderTop: '1px solid var(--theme-elevation-100)',
}

/** Visible / Hidden switch per page; one Save for all changes. */
export function PageVisibilityEditor({ rows, initialHidden, t }: { rows: VisibilityRow[]; initialHidden: string[]; t: StaffTexts['visibility'] }) {
  const groupLabel = visibilityGroupLabels(t)
  const [saved, setSaved] = useState<string[]>(initialHidden)
  const [hidden, setHidden] = useState<Set<string>>(new Set(initialHidden))
  const [state, setState] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle')
  const [message, setMessage] = useState('')
  const [query, setQuery] = useState('')
  const [show, setShow] = useState<'all' | 'visible' | 'hidden'>('all')
  const [group, setGroup] = useState('all')

  const allGroups = useMemo(() => GROUP_ORDER.filter((g) => rows.some((r) => r.group === g)), [rows])
  const groups = useMemo(() => {
    const q = query.trim().toLowerCase()
    const by = new Map<string, VisibilityRow[]>()
    for (const r of rows) {
      if (q && !r.label.toLowerCase().includes(q) && !r.route.toLowerCase().includes(q)) continue
      if (show !== 'all' && hidden.has(r.route) !== (show === 'hidden')) continue
      if (group !== 'all' && r.group !== group) continue
      by.set(r.group, [...(by.get(r.group) || []), r])
    }
    return GROUP_ORDER.filter((g) => by.has(g)).map((g) => [g, by.get(g)!] as const)
  }, [rows, query, show, group, hidden])
  const dirty = saved.length !== hidden.size || saved.some((p) => !hidden.has(p))

  function toggle(route: string) {
    const next = new Set(hidden)
    if (next.has(route)) next.delete(route)
    else next.add(route)
    setHidden(next)
    setState('idle')
  }

  async function save() {
    setState('saving')
    setMessage('')
    try {
      const res = await fetch('/api/admin/page-visibility', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ hiddenPaths: [...hidden] }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data.error || t.saveFailed)
      setSaved(data.hiddenPaths)
      setHidden(new Set(data.hiddenPaths))
      setState('saved')
      setMessage(t.saved)
    } catch (err: any) {
      setState('error')
      setMessage(err.message)
    }
  }

  return (
    <div>
      <div
        style={{
          position: 'sticky',
          top: 0,
          zIndex: 2,
          background: 'var(--theme-bg)',
          padding: '12px 0',
          marginBottom: 12,
          display: 'flex',
          alignItems: 'center',
          gap: 16,
          flexWrap: 'wrap',
        }}
      >
        <button type="button" className="btn btn--style-primary btn--size-medium" style={{ margin: 0 }} onClick={save} disabled={!dirty || state === 'saving'}>
          {state === 'saving' ? t.saving : t.save}
        </button>
        <span style={{ fontSize: 13, color: 'var(--theme-elevation-600)' }}>
          {fill(t.hiddenCount, { n: hidden.size })}
          {dirty ? t.unsaved : ''}
        </span>
        {message && (
          <span role="status" style={{ fontSize: 13, color: state === 'error' ? 'var(--theme-error-500)' : 'var(--theme-success-600)' }}>
            {message}
          </span>
        )}
      </div>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 16 }}>
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={t.searchPlaceholder}
          aria-label={t.ariaSearch}
          style={{ ...field, minWidth: 260 }}
        />
        <select value={show} onChange={(e) => setShow(e.target.value as any)} aria-label={t.ariaShow} style={field}>
          <option value="all">{t.showAll}</option>
          <option value="visible">{t.showVisible}</option>
          <option value="hidden">{t.showHidden}</option>
        </select>
        <select value={group} onChange={(e) => setGroup(e.target.value)} aria-label={t.ariaSection} style={field}>
          <option value="all">{t.allSections}</option>
          {allGroups.map((g) => (
            <option key={g} value={g}>
              {groupLabel[g] || g}
            </option>
          ))}
        </select>
      </div>
      {groups.length === 0 && <p>{t.noMatch}</p>}
      {groups.map(([groupName, list]) => (
        <section key={groupName} style={box}>
          <h2 style={{ fontSize: 15, margin: 0, padding: '10px 14px', background: 'var(--theme-elevation-50)' }}>{groupLabel[groupName] || groupName}</h2>
          {list.map((r) => {
            const isHidden = hidden.has(r.route)
            return (
              <div key={r.route} style={rowStyle}>
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontWeight: 500 }}>{r.label}</div>
                  <div style={{ fontSize: 12, color: 'var(--theme-elevation-500)' }}>
                    {r.route}
                    {r.note ? ` — ${r.note}` : ''}
                  </div>
                </div>
                <button
                  type="button"
                  role="switch"
                  aria-checked={!isHidden}
                  aria-label={fill(t.ariaSwitch, { page: r.label, state: isHidden ? t.hidden : t.visible })}
                  onClick={() => toggle(r.route)}
                  style={{
                    flexShrink: 0,
                    minWidth: 96,
                    padding: '6px 12px',
                    borderRadius: 999,
                    cursor: 'pointer',
                    fontSize: 13,
                    fontWeight: 600,
                    border: `1px solid ${isHidden ? 'var(--theme-elevation-300)' : 'var(--theme-success-500)'}`,
                    background: isHidden ? 'var(--theme-elevation-100)' : 'var(--theme-success-100)',
                    color: isHidden ? 'var(--theme-elevation-700)' : 'var(--theme-success-800)',
                  }}
                >
                  {isHidden ? t.hidden : t.visible}
                </button>
              </div>
            )
          })}
        </section>
      ))}
    </div>
  )
}
