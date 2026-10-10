'use client'

import React, { useState, useEffect } from 'react'

/** Unit words and the "already started" line (CMS: Website → Event pages → Status & countdown). */
export type CountdownWords = { days: string; hours: string; mins: string; secs: string; over: string }
const DEFAULT_WORDS: CountdownWords = { days: 'Days', hours: 'Hours', mins: 'Mins', secs: 'Secs', over: 'Event is Live or Concluded' }

interface CountdownProps {
  targetDate: string
  label?: string
  words?: CountdownWords
}

export function Countdown({ targetDate, label = 'Starts In', words = DEFAULT_WORDS }: CountdownProps) {
  const [timeLeft, setTimeLeft] = useState<{
    days: number
    hours: number
    minutes: number
    seconds: number
    isPast: boolean
  }>({ days: 0, hours: 0, minutes: 0, seconds: 0, isPast: false })

  useEffect(() => {
    function calculate() {
      const difference = +new Date(targetDate) - +new Date()
      if (difference <= 0) {
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0, isPast: true })
        return
      }

      setTimeLeft({
        days: Math.floor(difference / (1000 * 60 * 60 * 24)),
        hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
        minutes: Math.floor((difference / 1000 / 60) % 60),
        seconds: Math.floor((difference / 1000) % 60),
        isPast: false,
      })
    }

    calculate()
    const timer = setInterval(calculate, 1000)
    return () => clearInterval(timer)
  }, [targetDate])

  if (timeLeft.isPast) {
    return (
      <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded bg-aurix-dark border border-aurix-border text-xs font-mono text-aurix-emerald">
        <span className="w-2 h-2 rounded-full bg-aurix-emerald animate-pulse" />
        {words.over}
      </div>
    )
  }

  return (
    <div className="flex flex-col items-start gap-1">
      <span className="text-[10px] font-mono tracking-widest text-slate-400 uppercase">
        {label}
      </span>
      <div className="flex items-center gap-2 font-mono">
        <div className="bg-aurix-dark/90 border border-aurix-border px-3 py-1.5 rounded-lg text-center min-w-[50px]">
          <span className="text-xl sm:text-2xl font-bold text-white block leading-none">
            {timeLeft.days}
          </span>
          <span className="text-[9px] text-slate-500 uppercase">{words.days}</span>
        </div>
        <span className="text-aurix-orange font-bold text-lg">:</span>
        <div className="bg-aurix-dark/90 border border-aurix-border px-3 py-1.5 rounded-lg text-center min-w-[50px]">
          <span className="text-xl sm:text-2xl font-bold text-white block leading-none">
            {String(timeLeft.hours).padStart(2, '0')}
          </span>
          <span className="text-[9px] text-slate-500 uppercase">{words.hours}</span>
        </div>
        <span className="text-aurix-orange font-bold text-lg">:</span>
        <div className="bg-aurix-dark/90 border border-aurix-border px-3 py-1.5 rounded-lg text-center min-w-[50px]">
          <span className="text-xl sm:text-2xl font-bold text-white block leading-none">
            {String(timeLeft.minutes).padStart(2, '0')}
          </span>
          <span className="text-[9px] text-slate-500 uppercase">{words.mins}</span>
        </div>
        <span className="text-aurix-orange font-bold text-lg">:</span>
        <div className="bg-aurix-dark/90 border border-aurix-border px-3 py-1.5 rounded-lg text-center min-w-[50px]">
          <span className="text-xl sm:text-2xl font-bold text-aurix-orange block leading-none">
            {String(timeLeft.seconds).padStart(2, '0')}
          </span>
          <span className="text-[9px] text-slate-500 uppercase">{words.secs}</span>
        </div>
      </div>
    </div>
  )
}
