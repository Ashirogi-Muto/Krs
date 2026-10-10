'use client'

import React, { useEffect } from 'react'
import { toast } from '@payloadcms/ui'
import { adminUrlFor, docFromAdminPath, fieldIdToPath, parsePreviewMessage, pathToFieldId, type CmsToPreview } from '../../lib/cms-attrs'
import { PREVIEW_COLLECTIONS, PREVIEW_GLOBALS } from '../../lib/preview-targets'

const previewFrame = () => document.getElementById('live-preview-iframe') as HTMLIFrameElement | null

/** Screens the preview may ask to open: the previewable ones plus items shown inside pages. */
const ALLOWED = {
  collections: [...Object.keys(PREVIEW_COLLECTIONS), 'people', 'gallery-albums'],
  globals: Object.keys(PREVIEW_GLOBALS),
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms))
async function waitFor<T>(find: () => T | null, ms = 700): Promise<T | null> {
  for (let t = 0; t <= ms; t += 100) {
    const hit = find()
    if (hit) return hit
    await sleep(100)
  }
  return null
}

/** The CMS element for a path: the field itself, or for a row path ("layout.3", "faqs.0") the row. */
export function cmsElementFor(path: string): HTMLElement | null {
  const field = document.getElementById(pathToFieldId(path))
  if (field) return field
  const parts = path.split('.')
  const last = parts[parts.length - 1]
  if (/^[0-9]+$/.test(last) && parts.length > 1) return document.getElementById(`${parts.slice(0, -1).join('-')}-row-${last}`)
  return null
}

/**
 * Bring a field into view: fields in another tab or a collapsed row are not in the page yet, so open each tab in turn
 * and expand rows ("Show All") until it appears; then scroll to it, focus it and flash an outline. Never changes a value.
 */
export async function revealField(path: string): Promise<boolean> {
  if (!path) return false
  // Try the path, then its parents (a field without its own input → its row/section)
  const candidates = path.split('.').map((_, i, a) => a.slice(0, a.length - i).join('.'))
  const find = () => {
    for (const c of candidates) {
      const el = cmsElementFor(c)
      if (el) return el
    }
    return null
  }
  // Is the field's top-level part (e.g. "faqs" for faqs.1.question) on screen? Then we are in the right tab.
  const top = candidates[candidates.length - 1]
  const inThisTab = () => document.getElementById(pathToFieldId(top)) || document.querySelector(`[id^="${top}-row-"]`)
  const expandRows = async () => {
    for (let pass = 0; pass < 4; pass++) {
      const showAll = Array.from(document.querySelectorAll<HTMLButtonElement>('.array-field__header-action, .blocks-field__header-action'))
        .filter((b) => /show all/i.test(b.textContent || ''))
      if (!showAll.length) return null
      showAll.forEach((b) => b.click())
      const exact = await waitFor(() => cmsElementFor(path), 400)
      if (exact) return exact
    }
    return null
  }
  let el: HTMLElement | null = cmsElementFor(path)
  if (!el && !inThisTab()) {
    for (const tab of Array.from(document.querySelectorAll<HTMLButtonElement>('.tabs-field__tab-button'))) {
      tab.click()
      if (await waitFor(inThisTab, 300)) break
    }
  }
  el = el || (await waitFor(() => cmsElementFor(path), 300)) || (await expandRows())
  el = el || find()
  if (!el) return false
  el.scrollIntoView({ block: 'center', behavior: 'smooth' })
  const input = el.matches('input,textarea,select,[contenteditable="true"]')
    ? el
    : el.querySelector<HTMLElement>('input:not([type="hidden"]),textarea,select,[contenteditable="true"]')
  input?.focus({ preventScroll: true })
  const box = (el.closest('.field-type') as HTMLElement | null) || el
  const before = box.style.outline
  box.style.outline = '2px solid #f97316'
  setTimeout(() => (box.style.outline = before), 1600)
  return true
}

/**
 * Live preview, phase 2 (CMS side, admin.components.providers): when a field gets focus, tell the preview iframe which
 * field it is (and, for shared wording, its text) so the page outlines it. Messages go only to this origin.
 */
export function CmsPreviewBridgeClient({ children, t }: { children?: React.ReactNode; t: { sharedNote: string; noField: string } }) {
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

    // Phase 3: a click in the preview → focus that field here, or open that item / shared screen in a new tab
    const onMessage = async (event: MessageEvent) => {
      const frame = previewFrame()
      if (!frame || event.origin !== window.location.origin || event.source !== frame.contentWindow) return
      const msg = parsePreviewMessage(event.data, ALLOWED)
      if (!msg) return
      const doc = docFromAdminPath(window.location.pathname)
      const byText = async (text?: string) => {
        if (!text) return false
        const hit = Array.from(document.querySelectorAll<HTMLInputElement | HTMLTextAreaElement>('input[id^="field-"],textarea[id^="field-"]'))
          .find((f) => f.value.replace(/\s+/g, ' ').trim() === text)
        const path = hit ? fieldIdToPath(hit.id) : null
        return path ? revealField(path) : false
      }
      // On a shared-wording screen, clicked text that is one of its own fields wins over the page/section around it
      if (doc?.startsWith('global:') && msg.type !== 'krs-cms:text' && !(msg.type === 'krs-cms:open' && doc === `global:${msg.slug}`) && (await byText(msg.text))) return
      if (msg.type === 'krs-cms:focus') {
        if (msg.doc === doc) {
          if (!(await revealField(msg.path))) toast.info(t.noField)
        } else {
          // Another document's field (e.g. a competition's fee while editing shared labels): open it
          const [slug, id] = msg.doc.split('/')
          const open = parsePreviewMessage({ type: 'krs-cms:open', target: 'doc', slug, id: Number(id), path: msg.path }, ALLOWED)
          if (open && open.type === 'krs-cms:open') window.open(adminUrlFor(open), '_blank', 'noopener')
        }
      } else if (msg.type === 'krs-cms:open') {
        if (msg.target === 'global' && doc === `global:${msg.slug}`) {
          if (!(await revealField(msg.path || ''))) toast.info(t.noField)
        } else window.open(adminUrlFor(msg), '_blank', 'noopener')
      } else if (msg.type === 'krs-cms:text') {
        // Shared wording without an attribute: a field on this screen with exactly that text (rendered fields only)
        if (!(await byText(msg.text))) toast.info(t.noField)
      }
    }
    window.addEventListener('message', onMessage)

    // Opened from a preview click (new tab): /admin/…#focus=<path>
    const focus = window.location.hash.match(/^#focus=([A-Za-z0-9_.]{1,200})$/)?.[1]
    if (focus && fieldIdToPath(pathToFieldId(focus))) {
      void (async () => {
        await waitFor(() => document.querySelector('[id^="field-"]'), 8000)
        await revealField(focus)
        if (window.location.pathname.startsWith('/admin/globals/')) toast.info(t.sharedNote)
      })()
    }

    return () => {
      document.removeEventListener('focusin', onFocusIn)
      document.removeEventListener('focusout', onFocusOut)
      window.removeEventListener('message', onMessage)
      clearTimeout(clearTimer)
    }
  }, [t])
  return <>{children}</>
}
