'use client'

import React from 'react'
import { useSearchParams } from 'next/navigation'

/**
 * CSV links that carry the list's current query (filters, search, sort), so each file holds exactly the teams the list
 * shows. Paging is dropped: the export is never limited to one page.
 */
export function RegistrationsExportLinks({ views, title, titleAll, help }: { views: { view: string; label: string }[]; title: string; titleAll: string; help: string }) {
  const params = useSearchParams()
  const q = new URLSearchParams()
  let filtered = false
  for (const [k, v] of params.entries()) {
    if (k.startsWith('where[') || k === 'search' || k === 'sort') q.append(k, v)
    if ((k.startsWith('where[') || k === 'search') && v) filtered = true
  }
  const query = q.toString()
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 8, margin: '0 0 16px' }}>
      <span style={{ fontSize: 13, color: 'var(--theme-elevation-600)' }}>{filtered ? title : titleAll}</span>
      {views.map(({ view, label }) => (
        <a
          key={view}
          href={`/api/admin/registrations-export?view=${view}&filtered=1${query ? `&${query}` : ''}`}
          className="btn btn--style-secondary btn--size-small"
          style={{ margin: 0 }}
          download
        >
          {label}
        </a>
      ))}
      <span style={{ flexBasis: '100%', fontSize: 12, color: 'var(--theme-elevation-500)' }}>{help}</span>
    </div>
  )
}
