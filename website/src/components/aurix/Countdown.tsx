'use client'

import React, { useState, useEffect } from 'react'

interface CountdownProps {
  targetDate: string
  label?: string
}

export function Countdown({ targetDate, label = 'Starts In' }: CountdownProps) {
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
        Event is Live or Concluded
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
          <span className="text-[9px] text-slate-500 uppercase">Days</span>
        </div>
        <span className="text-aurix-orange font-bold text-lg">:</span>
        <div className="bg-aurix-dark/90 border border-aurix-border px-3 py-1.5 rounded-lg text-center min-w-[50px]">
          <span className="text-xl sm:text-2xl font-bold text-white block leading-none">
            {String(timeLeft.hours).padStart(2, '0')}
          </span>
          <span className="text-[9px] text-slate-500 uppercase">Hours</span>
        </div>
        <span className="text-aurix-orange font-bold text-lg">:</span>
        <div className="bg-aurix-dark/90 border border-aurix-border px-3 py-1.5 rounded-lg text-center min-w-[50px]">
          <span className="text-xl sm:text-2xl font-bold text-white block leading-none">
            {String(timeLeft.minutes).padStart(2, '0')}
          </span>
          <span className="text-[9px] text-slate-500 uppercase">Mins</span>
        </div>
        <span className="text-aurix-orange font-bold text-lg">:</span>
        <div className="bg-aurix-dark/90 border border-aurix-border px-3 py-1.5 rounded-lg text-center min-w-[50px]">
          <span className="text-xl sm:text-2xl font-bold text-aurix-orange block leading-none">
            {String(timeLeft.seconds).padStart(2, '0')}
          </span>
          <span className="text-[9px] text-slate-500 uppercase">Secs</span>
        </div>
      </div>
    </div>
  )
}
