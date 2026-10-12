'use client'

import { useEffect, useState, useRef } from 'react'

/**
 * Cinematic HUD Preloader replicated from Yodha 2.0 aesthetics:
 * - Rotating orbital HUD rings & glowing tech crest
 * - Live animated 0-100% loading counter with phased cyber diagnostics
 * - Glowing gradient progress bar
 * - Seamless curtain slide / fade reveal
 * - Session awareness & instant skip button
 */
export function Preloader() {
  const [percent, setPercent] = useState(0)
  const [statusText, setStatusText] = useState('INITIALIZING KRS CORE PROTOCOLS...')
  const [isDismissing, setIsDismissing] = useState(false)
  const [isDone, setIsDone] = useState(false)
  const dismissedRef = useRef(false)

  const dismiss = () => {
    if (dismissedRef.current) return
    dismissedRef.current = true
    setIsDismissing(true)
    setTimeout(() => {
      setIsDone(true)
    }, 700)
  }

  useEffect(() => {
    // Check if user has already seen preloader during this browser session
    try {
      if (sessionStorage.getItem('krs_preloader_seen') === '1') {
        setIsDone(true)
        return
      }
    } catch {
      // ignore storage errors
    }

    const startTime = performance.now()
    const duration = 1800 // ms

    let animId: number

    const step = (now: number) => {
      const elapsed = now - startTime
      const progress = Math.min(elapsed / duration, 1)

      // Smooth ease-out curve
      const eased = Math.round((1 - Math.pow(1 - progress, 3)) * 100)
      setPercent(eased)

      if (eased < 35) {
        setStatusText('INITIALIZING KRS CORE PROTOCOLS...')
      } else if (eased < 70) {
        setStatusText('LOADING ROBOTICS & AUTONOMY MATRIX...')
      } else if (eased < 99) {
        setStatusText('SYNCHRONIZING SYSTEM INTERFACES...')
      } else {
        setStatusText('SYSTEM READY // WELCOME')
      }

      if (progress < 1) {
        animId = requestAnimationFrame(step)
      } else {
        try {
          sessionStorage.setItem('krs_preloader_seen', '1')
        } catch {}
        setTimeout(() => {
          dismiss()
        }, 350)
      }
    }

    animId = requestAnimationFrame(step)

    return () => {
      cancelAnimationFrame(animId)
    }
  }, [])

  if (isDone) return null

  return (
    <div
      id="krs-preloader"
      aria-hidden="true"
      className={`fixed inset-0 z-[9999] bg-[#070A12] flex flex-col items-center justify-center transition-all duration-700 select-none overflow-hidden ${
        isDismissing ? 'opacity-0 scale-105 pointer-events-none' : 'opacity-100 scale-100'
      }`}
    >
      {/* Background ambient radial glow */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(6,182,212,0.12)_0%,transparent_70%)] pointer-events-none" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(37,99,235,0.08)_0%,transparent_60%)] pointer-events-none" />
      <div className="absolute inset-0 bg-tech-grid opacity-25 pointer-events-none" />

      {/* Cyber Corner Grid Accents */}
      <div className="absolute top-6 left-6 font-mono text-[10px] text-cyan-400/50 tracking-widest uppercase flex items-center gap-2">
        <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
        SEC_ID // KRS-SYS-2026
      </div>
      <div className="absolute top-6 right-6">
        <button
          onClick={dismiss}
          type="button"
          className="text-[10px] font-mono tracking-widest uppercase px-3 py-1 rounded border border-cyan-500/20 text-cyan-400/70 hover:text-cyan-300 hover:border-cyan-500/50 hover:bg-cyan-500/10 transition-colors"
        >
          [SKIP INTRO]
        </button>
      </div>
      <div className="absolute bottom-6 left-6 font-mono text-[9px] text-slate-500 tracking-wider">
        STATUS: ENCRYPTED // NODE_01
      </div>
      <div className="absolute bottom-6 right-6 font-mono text-[9px] text-slate-500 tracking-wider">
        KALAM ROBOTICS SOCIETY
      </div>

      {/* Center HUD Ring & Crest */}
      <div className="relative flex items-center justify-center mb-8">
        {/* Outer dashed spinning ring */}
        <div className="w-36 h-36 rounded-full border border-dashed border-cyan-500/30 animate-[spin_8s_linear_infinite]" />
        
        {/* Middle notched ring */}
        <div className="absolute w-28 h-28 rounded-full border-2 border-transparent border-t-cyan-400 border-b-blue-500 animate-[spin_3s_linear_infinite_reverse] shadow-[0_0_20px_rgba(6,182,212,0.3)]" />

        {/* Center glowing core */}
        <div className="absolute w-20 h-20 rounded-full bg-gradient-to-tr from-cyan-950/80 to-blue-950/80 border border-cyan-400/50 flex flex-col items-center justify-center backdrop-blur-md shadow-[0_0_30px_rgba(6,182,212,0.4)]">
          <svg
            className="w-8 h-8 text-cyan-300 drop-shadow-[0_0_8px_rgba(6,182,212,0.8)]"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.75"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <polygon points="12 2 2 7 12 12 22 7 12 2" />
            <polyline points="2 17 12 22 22 17" />
            <polyline points="2 12 12 17 22 12" />
          </svg>
        </div>
      </div>

      {/* Percentage Counter */}
      <div className="flex items-baseline gap-1 font-mono text-cyan-300 font-bold tracking-tight">
        <span className="text-4xl sm:text-5xl drop-shadow-[0_0_12px_rgba(6,182,212,0.8)] font-display">
          {String(percent).padStart(2, '0')}
        </span>
        <span className="text-sm font-mono text-cyan-400/80">%</span>
      </div>

      {/* Progress Bar */}
      <div className="w-64 sm:w-80 h-1.5 bg-slate-900 rounded-full border border-cyan-500/20 overflow-hidden mt-4 p-[1px]">
        <div
          className="h-full bg-gradient-to-r from-cyan-400 via-blue-500 to-cyan-300 rounded-full shadow-[0_0_12px_rgba(6,182,212,0.8)] transition-all duration-100 ease-out"
          style={{ width: `${percent}%` }}
        />
      </div>

      {/* Phased Status Label */}
      <p className="mt-5 text-[11px] font-mono tracking-[0.25em] text-cyan-400/80 uppercase text-center px-4 h-4 flex items-center justify-center">
        {statusText}
      </p>

      {/* Bottom Subtitle / Brand */}
      <p className="mt-3 text-[10px] font-mono tracking-[0.35em] text-slate-500 uppercase">
        WARRIORS OF ROBOTICS &bull; KALAM ROBOTICS SOCIETY
      </p>
    </div>
  )
}
