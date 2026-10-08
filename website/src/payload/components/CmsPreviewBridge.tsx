'use client'

import React, { useEffect } from 'react'
import { fieldIdToPath, type CmsToPreview } from '../../lib/cms-attrs'

/** Which document this admin screen edits: "pages/8" or "global:form-texts" (null on lists, dashboard…). */
export function docFromAdminPath(pathname: string): string | null {
  const c = pathname.match(/^\/admin\/collections\/([a-z-]+)\/([1-9][0-9]{0,9})\/?$/)
  if (c) return `${c[1]}/${c[2]}`
  const g = pathname.match(/^\/admin\/globals\/([a-z-]+)\/?$/)
  return g ? `global:${g[1]}` : null
}

const previewFrame = () => document.getElementById('live-preview-iframe') as HTMLIFrameElement | null

/**
 * Live preview, phase 2 (CMS side, admin.components.providers): when a field gets focus, tell the preview iframe which
 * field it is (and, for shared wording, its text) so the page outlines it. Messages go only to this origin.
 */
export default function CmsPreviewBridge({ children }: { children?: React.ReactNode }) {
  useEffect(() => {
    let clearTimer: ReturnType<typeof setTimeout> | undefined
    const send = (msg: CmsToPreview) => previewFrame()?.contentWindow?.postMessage(msg, window.location.origin)
    const onFocusIn = (event: FocusEvent) => {
      const doc = docFromAdminPath(window.location.pathname)
      const target = event.target as HTMLElement | null
      if (!doc || !target || !previewFrame()) return
      const field = target.closest('[id^="field-"]')
      const path = field ? fieldIdToPath(field.id) : null
      if (!path) return
      clearTimeout(clearTimer)
      const value = target instanceof HTMLInputElement || target instanceof HTMLTextAreaElement ? target.value.slice(0, 300) : undefined
      send({ type: 'krs-cms:highlight', doc, path, ...(value && value.trim() ? { value } : {}) })
    }
    const onFocusOut = () => {
      clearTimeout(clearTimer)
      clearTimer = setTimeout(() => send({ type: 'krs-cms:clear' }), 200)
    }
    document.addEventListener('focusin', onFocusIn)
    document.addEventListener('focusout', onFocusOut)
    return () => {
      document.removeEventListener('focusin', onFocusIn)
      document.removeEventListener('focusout', onFocusOut)
      clearTimeout(clearTimer)
    }
  }, [])
  return <>{children}</>
}
