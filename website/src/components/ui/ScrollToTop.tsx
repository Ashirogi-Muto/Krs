'use client'

import { useEffect, useState } from 'react'
import { ArrowUp } from 'lucide-react'

export function ScrollToTop({ label }: { label: string }) {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const handleScroll = () => {
      setVisible(window.scrollY > 400)
    }
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  if (!visible) return null

  return (
    <button
      onClick={scrollToTop}
      type="button"
      aria-label={label}
      className="fixed bottom-6 right-6 z-50 p-3 rounded-full bg-slate-900/80 backdrop-blur-md border border-cyan-500/30 text-cyan-400 hover:text-white hover:bg-cyan-500/20 hover:border-cyan-400 shadow-[0_0_20px_rgba(6,182,212,0.25)] transition-all duration-300 hover:scale-110 active:scale-95 flex items-center justify-center group"
    >
      <ArrowUp className="w-4 h-4 transition-transform group-hover:-translate-y-0.5" />
    </button>
  )
}
