'use client'

import React from 'react'
import { Pill, useRowLabel } from '@payloadcms/ui'

const FIELDS = ['title', 'heading', 'eyebrow', 'formName', 'label', 'text', 'intro', 'body'] as const

/**
 * Header of a section in Website → Pages: number, section type and the section's own title (instead of Payload's
 * empty "Untitled" name box), so editors can find a section without opening each one.
 */
export function BlockRowLabel({ blockLabel }: { blockLabel?: string }) {
  const { data, rowNumber } = useRowLabel<Record<string, unknown>>()
  const raw = FIELDS.map((k) => data?.[k]).find((v) => typeof v === 'string' && v.trim()) as string | undefined
  const summary = raw ? raw.replace(/\s+/g, ' ').trim() : ''
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
      <span className="blocks-field__block-number">{String((rowNumber ?? 0) + 1).padStart(2, '0')}</span>
      <Pill className="blocks-field__block-pill" pillStyle="white" size="small">
        {blockLabel}
      </Pill>
      {summary && (
        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 420, color: 'var(--theme-elevation-600)' }}>
          {summary}
        </span>
      )}
    </span>
  )
}
