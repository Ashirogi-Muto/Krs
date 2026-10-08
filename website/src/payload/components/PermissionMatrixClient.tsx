'use client'

import React from 'react'
import { useField, useFormFields } from '@payloadcms/ui'
import type { CatalogueItem, CatalogueSection } from '../access/permissions'

type Texts = { help: string; page: string; view: string; create: string; edit: string; del: string; more: string; notGrantable: string; createLimited: string; none: string; summary: string }

const cell: React.CSSProperties = { padding: '6px 8px', borderBottom: '1px solid var(--theme-elevation-100)', verticalAlign: 'top' }
const head: React.CSSProperties = { ...cell, textAlign: 'left', fontWeight: 600, fontSize: 12, color: 'var(--theme-elevation-600)' }
const groupRow: React.CSSProperties = { ...cell, paddingTop: 16, fontWeight: 700, fontSize: 13 }

/** The permission matrix of an access role (value: the list of permission keys). */
export function PermissionMatrixClient({ path, sections, grantable, readOnly, t }: { path: string; sections: CatalogueSection[]; grantable: string[]; readOnly: boolean; t: Texts }) {
  const { value, setValue } = useField<string[]>({ path })
  const limited = useFormFields(([fields]) => (fields.limitedCollections?.value as string[] | undefined) || [])
  const selected = new Set(Array.isArray(value) ? value : [])
  const may = new Set(grantable)

  const toggle = (key: string) => {
    const next = new Set(selected)
    if (next.has(key)) next.delete(key)
    else next.add(key)
    setValue([...next])
  }

  const box = (item: CatalogueItem | undefined, withLabel = false) => {
    if (!item) return null
    const blockedByLimit = item.kind === 'create' && Boolean(item.collection) && limited.includes(item.collection!)
    // A ticked box stays untickable even when greyed out, so an editor can always remove what they may not grant
    const disabled = readOnly || ((!may.has(item.key) || blockedByLimit) && !selected.has(item.key))
    const why = !may.has(item.key) ? t.notGrantable : blockedByLimit ? t.createLimited : item.help || ''
    return (
      <label key={item.key} title={why} style={{ display: 'flex', gap: 6, alignItems: 'flex-start', opacity: disabled ? 0.45 : 1, cursor: disabled ? 'not-allowed' : 'pointer', marginBottom: withLabel ? 4 : 0 }}>
        <input type="checkbox" checked={selected.has(item.key)} disabled={disabled} onChange={() => toggle(item.key)} />
        {withLabel ? <span>{item.label}</span> : null}
      </label>
    )
  }

  let group = ''
  const rows: React.ReactNode[] = []
  for (const s of sections) {
    if (s.group !== group) {
      group = s.group
      rows.push(
        <tr key={`g-${group}`}>
          <td style={groupRow} colSpan={6}>
            {group}
          </td>
        </tr>,
      )
    }
    const of = (kind: CatalogueItem['kind']) => s.items.filter((i) => i.kind === kind)
    // One box per CRUD column when the page has exactly one such permission; the rest go under "More"
    const single = (kind: CatalogueItem['kind']) => (of(kind).length === 1 ? of(kind)[0] : undefined)
    const more = s.items.filter((i) => i.kind === 'extra' || of(i.kind).length > 1)
    rows.push(
      <tr key={s.id}>
        <td style={cell}>{s.label}</td>
        <td style={cell}>{box(single('view'))}</td>
        <td style={cell}>{box(single('create'))}</td>
        <td style={cell}>{box(single('edit'))}</td>
        <td style={cell}>{box(single('delete'))}</td>
        <td style={cell}>{more.map((i) => box(i, true))}</td>
      </tr>,
    )
  }

  return (
    <div style={{ margin: '8px 0 24px' }}>
      <p style={{ marginBottom: 8, color: 'var(--theme-elevation-600)' }}>{t.help}</p>
      <p style={{ marginBottom: 12, fontWeight: 600 }}>{selected.size ? t.summary.replace('{n}', String(selected.size)) : t.none}</p>
      <div style={{ overflowX: 'auto' }}>
        <table style={{ borderCollapse: 'collapse', width: '100%', minWidth: 760 }}>
          <thead>
            <tr>
              <th style={head}>{t.page}</th>
              <th style={head}>{t.view}</th>
              <th style={head}>{t.create}</th>
              <th style={head}>{t.edit}</th>
              <th style={head}>{t.del}</th>
              <th style={head}>{t.more}</th>
            </tr>
          </thead>
          <tbody>{rows}</tbody>
        </table>
      </div>
    </div>
  )
}
