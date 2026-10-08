'use client'

import { useEffect } from 'react'
import { parseCmsMessage, type PreviewToCms } from '@/lib/cms-attrs'

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

/** What a click on preview text asks the CMS to do (phase 3); null = nothing to edit there. */
export function clickMessage(el: Element | null): PreviewToCms | null {
  const node = el?.closest('[data-cms-ref],[data-cms-path]')
  if (!node) {
    const text = (el?.textContent || '').replace(/\s+/g, ' ').trim()
    return text.length >= 2 && text.length <= 300 ? { type: 'krs-cms:text', text } : null
  }
  const ref = node.getAttribute('data-cms-ref')
  // The innermost annotated element wins: a person's card (ref) inside a section, a field inside a card…
  if (ref) {
    const [slug, id] = ref.split('/')
    return { type: 'krs-cms:open', target: 'doc', slug, id: Number(id) }
  }
  const path = node.getAttribute('data-cms-path') || ''
  const global = node.getAttribute('data-cms-global')
  if (global) return { type: 'krs-cms:open', target: 'global', slug: global, path }
  const doc = node.getAttribute('data-cms-doc') || ''
  return { type: 'krs-cms:focus', doc, path }
}

/**
 * Live preview, phase 2: the CMS (parent window) says which field has focus; we outline the matching text.
 * Phase 3 (clickToEdit on): a click on preview text asks the CMS to open that field (or that item / shared screen)
 * instead of following links.
 * Rendered only for a CMS editor in preview (PreviewChrome). Messages are accepted only from the parent window on this
 * same origin, and only in the fixed schema (lib/cms-attrs parseCmsMessage); nothing is inserted as HTML.
 */
export function PreviewBridge({ clickToEdit = true }: { clickToEdit?: boolean }) {
  useEffect(() => {
    if (window.parent === window) return
    if (!document.getElementById(STYLE_ID)) {
      const style = document.createElement('style')
      style.id = STYLE_ID
      style.textContent =
        `.${HL}{outline:2px solid #f97316!important;outline-offset:3px;border-radius:4px;transition:outline-color .2s}` +
        `html.krs-cms-click [data-cms-path]:hover,html.krs-cms-click [data-cms-ref]:hover{outline:1px dashed #f97316;outline-offset:2px;cursor:pointer}`
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

  useEffect(() => {
    if (window.parent === window || !clickToEdit) return
    document.documentElement.classList.add('krs-cms-click')
    const onClick = (event: MouseEvent) => {
      const el = event.target instanceof Element ? event.target : null
      if (!el || el.closest('[data-krs-preview-ui]')) return
      const msg = clickMessage(el)
      if (!msg) return
      // Stay on this page (links would navigate); the CMS opens the field instead
      event.preventDefault()
      event.stopPropagation()
      window.parent.postMessage(msg, window.location.origin)
    }
    document.addEventListener('click', onClick, true)
    return () => {
      document.documentElement.classList.remove('krs-cms-click')
      document.removeEventListener('click', onClick, true)
    }
  }, [clickToEdit])
  return null
}
