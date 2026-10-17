'use client'

import React, { useState } from 'react'
import { Check, Copy } from 'lucide-react'

/** The offer box's "Copy code" button (competition pages). Without clipboard access it simply does nothing. */
export function CopyCode({ code, copy, copied }: { code: string; copy: string; copied: string }) {
  const [done, setDone] = useState(false)
  return (
    <button
      type="button"
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(code)
          setDone(true)
          setTimeout(() => setDone(false), 2000)
        } catch {
          // clipboard blocked (old browser / permissions): the code is on screen to type
        }
      }}
      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-aurix-orange/60 text-aurix-orange text-xs font-mono uppercase hover:bg-aurix-orange/10 transition-colors"
    >
      {done ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
      <span aria-live="polite">{done ? copied : copy}</span>
    </button>
  )
}
