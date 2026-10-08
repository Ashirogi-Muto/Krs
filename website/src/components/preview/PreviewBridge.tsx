'use client'

import { useEffect } from 'react'
import { parseCmsMessage } from '@/lib/cms-attrs'

const HL = 'krs-cms-hl'
const STYLE_ID = 'krs-cms-preview-style'

/** Elements for a field: exact path, else its nearest annotated parent path (a select/checkbox → its whole section). */
export function findTargets(root: ParentNode, doc: string, path: string): Element[] {
  const attr = doc.startsWith('global:') ? `[data-cms-global="${doc.slice(7)}"]` : `[data-cms-doc="${doc}"]`
  const parts = path.split('.')
  while (parts.length) {
    const found = Array.from(root.querySelectorAll(`${attr}[data-cms-path="${parts.join('.')}"]`))
    if (found.length) return found
    parts.pop()
  }
  return []
}

/** Shared wording without attributes: elements whose own text is exactly the field's value. */
export function findByText(root: Document, value: string, limit = 20): Element[] {
  const want = value.replace(/\s+/g, ' ').trim()
  if (want.length < 2) return []
  const out: Element[] = []
  const walker = root.createTreeWalker(root.body, NodeFilter.SHOW_TEXT)
  for (let n = walker.nextNode(); n && out.length < limit; n = walker.nextNode()) {
    const el = n.parentElement
    if (!el || el.closest('script,style,[data-krs-preview-ui]')) continue
    if ((n.nodeValue || '').replace(/\s+/g, ' ').trim() === want && !out.includes(el)) out.push(el)
  }
  return out
}

/**
 * Live preview, phase 2: the CMS (parent window) says which field has focus; we outline the matching text.
 * Rendered only for a CMS editor in preview (PreviewChrome). Messages are accepted only from the parent window on this
 * same origin, and only in the fixed schema (lib/cms-attrs parseCmsMessage); nothing is inserted as HTML.
 */
export function PreviewBridge() {
  useEffect(() => {
    if (window.parent === window) return
    if (!document.getElementById(STYLE_ID)) {
      const style = document.createElement('style')
      style.id = STYLE_ID
      style.textContent = `.${HL}{outline:2px solid #f97316!important;outline-offset:3px;border-radius:4px;transition:outline-color .2s}`
      document.head.appendChild(style)
    }
    const clear = () => document.querySelectorAll(`.${HL}`).forEach((el) => el.classList.remove(HL))
    const onMessage = (event: MessageEvent) => {
      if (event.origin !== window.location.origin || event.source !== window.parent) return
      const msg = parseCmsMessage(event.data)
      if (!msg) return
      clear()
      if (msg.type === 'krs-cms:clear') return
      let targets = findTargets(document, msg.doc, msg.path)
      if (!targets.length && msg.value && msg.doc.startsWith('global:')) targets = findByText(document, msg.value)
      targets.forEach((el) => el.classList.add(HL))
      const first = targets[0] as HTMLElement | undefined
      if (first) {
        const r = first.getBoundingClientRect()
        if (r.top < 0 || r.bottom > window.innerHeight) first.scrollIntoView({ block: 'center', behavior: 'smooth' })
      }
    }
    window.addEventListener('message', onMessage)
    return () => window.removeEventListener('message', onMessage)
  }, [])
  return null
}
