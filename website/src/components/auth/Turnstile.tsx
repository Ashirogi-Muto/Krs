'use client'

import React, { useCallback, useEffect, useRef, useState } from 'react'

type TurnstileApi = {
  render: (el: HTMLElement, opts: Record<string, unknown>) => string
  reset: (id?: string) => void
  remove: (id?: string) => void
}
declare global {
  interface Window {
    turnstile?: TurnstileApi
  }
}

const SCRIPT = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit'
let scriptPromise: Promise<void> | null = null
const loadScript = () =>
  (scriptPromise ||= new Promise<void>((resolve, reject) => {
    if (window.turnstile) return resolve()
    const s = document.createElement('script')
    s.src = SCRIPT
    s.async = true
    s.onload = () => resolve()
    s.onerror = () => reject(new Error('Turnstile script failed to load'))
    document.head.appendChild(s)
  }))

/**
 * Cloudflare Turnstile for a form. While the check is off on the server (no site key) it renders nothing and
 * `ready` is true. `headers()` gives the header to send with the request; `reset()` gets a fresh token after a submit.
 */
export function useTurnstile() {
  const box = useRef<HTMLDivElement>(null)
  const widget = useRef<string | undefined>(undefined)
  const [siteKey, setSiteKey] = useState<string | null | undefined>(undefined)
  const [token, setToken] = useState('')

  useEffect(() => {
    let live = true
    fetch('/api/turnstile-config', { cache: 'no-store' })
      .then((r) => r.json())
      .then((d) => live && setSiteKey(d?.siteKey || null))
      .catch(() => live && setSiteKey(null))
    return () => {
      live = false
    }
  }, [])

  useEffect(() => {
    if (!siteKey || !box.current) return
    let cancelled = false
    loadScript()
      .then(() => {
        if (cancelled || !box.current || !window.turnstile) return
        widget.current = window.turnstile.render(box.current, {
          sitekey: siteKey,
          theme: 'dark',
          callback: (t: string) => setToken(t),
          'expired-callback': () => setToken(''),
          'error-callback': () => setToken(''),
        })
      })
      .catch(() => setToken(''))
    return () => {
      cancelled = true
      if (widget.current && window.turnstile) window.turnstile.remove(widget.current)
      widget.current = undefined
    }
  }, [siteKey])

  const reset = useCallback(() => {
    setToken('')
    if (widget.current && window.turnstile) window.turnstile.reset(widget.current)
  }, [])

  const on = Boolean(siteKey)
  return {
    /** Place inside the form. */
    element: on ? <div ref={box} className="min-h-[65px]" /> : null,
    /** False only while the check is on and has not produced a token yet. */
    ready: siteKey === null || (on && Boolean(token)),
    headers: (): Record<string, string> => (on && token ? { 'cf-turnstile-response': token } : {}),
    reset,
  }
}
