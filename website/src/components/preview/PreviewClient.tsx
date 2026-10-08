'use client'

import React from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { RefreshRouteOnSave } from '@payloadcms/live-preview-react'
import { PreviewBridge } from './PreviewBridge'

/**
 * Only rendered for a CMS editor in live preview (components/preview/PreviewChrome.tsx).
 * - RefreshRouteOnSave: the CMS panel posts "payload-document-event" after every save / autosave; we re-render the page
 *   on the server (router.refresh). It only accepts messages whose origin is this site.
 * - A small badge with "Exit preview" (a plain form post, so no client state is involved).
 */
export function PreviewClient({ t }: { t: { badge: string; badgeNote: string; exit: string } }) {
  const router = useRouter()
  const path = usePathname() || '/'
  const origin = typeof window === 'undefined' ? '' : window.location.origin
  return (
    <>
      {origin && <RefreshRouteOnSave refresh={() => router.refresh()} serverURL={origin} />}
      <PreviewBridge />
      <form
        method="post"
        action="/api/preview/exit"
        title={t.badgeNote}
        data-krs-preview-ui=""
        style={{
          position: 'fixed',
          left: 12,
          bottom: 12,
          zIndex: 2147483000,
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          padding: '6px 8px 6px 12px',
          borderRadius: 999,
          background: 'rgba(15,23,42,.92)',
          border: '1px solid #f97316',
          color: '#fff',
          font: '600 12px/1.2 system-ui, sans-serif',
          boxShadow: '0 4px 16px rgba(0,0,0,.4)',
        }}
      >
        <span>{t.badge}</span>
        <input type="hidden" name="path" value={path} />
        <button
          type="submit"
          style={{ border: 0, borderRadius: 999, padding: '4px 10px', background: '#f97316', color: '#000', font: 'inherit', cursor: 'pointer' }}
        >
          {t.exit}
        </button>
      </form>
    </>
  )
}
