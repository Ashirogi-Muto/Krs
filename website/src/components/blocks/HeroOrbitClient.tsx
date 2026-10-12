'use client'

import React, { useEffect, useState } from 'react'
import { Cpu, Bot, Code2, Trophy } from 'lucide-react'

interface OrbitCard {
  id: string
  icon: React.ReactNode
  title: string
  sub: string
  color: string
  glowColor: string
  delay: number
  floatDuration: number
  side: 'left' | 'right'
  topPct: string
}

const CARDS: OrbitCard[] = [
  {
    id: 'autonomy',
    icon: <Bot className="w-4 h-4" />,
    title: 'Autonomous Bots',
    sub: 'Self-navigating systems',
    color: 'bg-krs-cyan/20',
    glowColor: 'shadow-krs-cyan/25 border-krs-cyan/30',
    delay: 0,
    floatDuration: 4.2,
    side: 'left',
    topPct: '22%',
  },
  {
    id: 'code',
    icon: <Code2 className="w-4 h-4" />,
    title: 'Embedded Systems',
    sub: 'Real-time firmware',
    color: 'bg-blue-500/20',
    glowColor: 'shadow-blue-500/20 border-blue-500/25',
    delay: 0.8,
    floatDuration: 5.1,
    side: 'left',
    topPct: '54%',
  },
  {
    id: 'challenge',
    icon: <Trophy className="w-4 h-4" />,
    title: 'AURIX Challenge',
    sub: 'Compete. Win. Repeat.',
    color: 'bg-amber-500/20',
    glowColor: 'shadow-amber-500/20 border-amber-400/30',
    delay: 1.4,
    floatDuration: 3.8,
    side: 'right',
    topPct: '24%',
  },
  {
    id: 'ai',
    icon: <Cpu className="w-4 h-4" />,
    title: 'AI & Vision',
    sub: 'Computer perception',
    color: 'bg-violet-500/20',
    glowColor: 'shadow-violet-500/20 border-violet-400/30',
    delay: 0.5,
    floatDuration: 4.6,
    side: 'right',
    topPct: '56%',
  },
]

function RotatingBadge() {
  return (
    <div className="absolute top-12 right-12 hidden lg:flex items-center justify-center hero-orbit-badge pointer-events-none">
      <svg viewBox="0 0 120 120" className="w-24 h-24 animate-spin-slow">
        <defs>
          <path id="circle-text" d="M 60,60 m -42,0 a 42,42 0 1,1 84,0 a 42,42 0 1,1 -84,0" />
        </defs>
        <text fill="rgba(6,182,212,0.6)" fontSize="10" fontFamily="monospace" letterSpacing="3">
          <textPath href="#circle-text">ROBOTICS SOCIETY • EST. 2019 • KRS •&nbsp;</textPath>
        </text>
      </svg>
      <span className="absolute text-krs-cyan text-lg">✦</span>
    </div>
  )
}

function FloatCard({ card }: { card: OrbitCard }) {
  const sideClass = card.side === 'left' ? 'left-[1.5%] lg:left-[3%] xl:left-[5%]' : 'right-[1.5%] lg:right-[3%] xl:right-[5%]'
  return (
    <div
      className={`absolute ${sideClass} hidden lg:block hero-float-card z-20`}
      style={{
        top: card.topPct,
        animationDelay: `${card.delay}s`,
        animationDuration: `${card.floatDuration}s`,
      }}
    >
      {/* Connector line */}
      <div
        className="absolute top-1/2 -translate-y-1/2 w-14 h-px pointer-events-none"
        style={{
          [card.side === 'left' ? 'right' : 'left']: '-3.5rem',
          background: 'linear-gradient(to right, transparent, rgba(6,182,212,0.3), transparent)',
        }}
      />
      <div
        className={`
          relative flex items-start gap-3 p-3.5 rounded-2xl
          bg-krs-surface/80 backdrop-blur-xl
          border ${card.glowColor}
          shadow-lg
          w-[160px] sm:w-[182px]
          hover:scale-105 transition-transform duration-300
        `}
      >
        <div className={`flex-shrink-0 w-8 h-8 rounded-xl ${card.color} flex items-center justify-center text-krs-cyan`}>
          {card.icon}
        </div>
        <div className="min-w-0">
          <p className="text-white text-xs font-semibold leading-snug">{card.title}</p>
          <p className="text-slate-400 text-[10px] leading-tight mt-0.5">{card.sub}</p>
        </div>
        <div className="absolute bottom-0 left-3 right-3 h-px bg-gradient-to-r from-transparent via-krs-cyan/20 to-transparent rounded-full" />
      </div>
    </div>
  )
}

export function HeroOrbitClient() {
  const [mounted, setMounted] = useState(false)
  useEffect(() => { setMounted(true) }, [])

  if (!mounted) return null

  return (
    <>
      <RotatingBadge />

      {/* Orbit cards */}
      {CARDS.map((card) => (
        <FloatCard key={card.id} card={card} />
      ))}

      {/* Stat chip — left */}
      <div className="absolute bottom-8 left-6 lg:left-12 hidden sm:block hero-stat-chip z-20" style={{ animationDelay: '1.2s' }}>
        <div className="flex items-center gap-2">
          <div className="flex -space-x-1.5">
            {['K', 'R', 'S'].map((l, i) => (
              <div key={i} className="w-6 h-6 rounded-full border-2 border-krs-dark bg-gradient-to-br from-krs-cyan/30 to-blue-600/30 flex items-center justify-center text-[8px] text-krs-cyan font-bold">
                {l}
              </div>
            ))}
            <div className="w-6 h-6 rounded-full border-2 border-krs-dark bg-krs-cyan/10 flex items-center justify-center text-[8px] text-krs-cyan font-mono">+</div>
          </div>
          <div>
            <p className="text-white text-xs font-bold leading-tight">200+ Members</p>
            <p className="text-slate-400 text-[10px] leading-tight">Active engineers</p>
          </div>
        </div>
      </div>

      {/* Stat chip — right */}
      <div className="absolute bottom-8 right-6 lg:right-12 text-right hidden sm:block hero-stat-chip z-20" style={{ animationDelay: '1.8s' }}>
        <p className="text-slate-400 text-[11px] font-mono">— Less wires.</p>
        <p className="text-white text-xs font-semibold">More robots.</p>
      </div>
    </>
  )
}
