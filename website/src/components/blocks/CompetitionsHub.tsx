'use client'

import React from 'react'
import Link from 'next/link'
import { Terminal, Bot, Zap, Layers, Lightbulb, Trophy, ArrowRight, ChevronRight } from 'lucide-react'

interface CompetitionModule {
  id: string
  number: string
  arenaTag: string
  title: string
  description: string
  icon: React.ReactNode
  link: string
  color: {
    badgeBg: string
    badgeBorder: string
    badgeText: string
    cardBorder: string
    cardHoverBorder: string
    watermark: string
    glow: string
    connector: string
  }
}

const MODULES: { left: CompetitionModule[]; right: CompetitionModule[] } = {
  left: [
    {
      id: 'hackathon',
      number: '01',
      arenaTag: 'Arena 01',
      title: 'Robotics & AI Hackathon',
      description: '12-hour national challenge tackling 9 advanced domains with a ₹1,00,000 prize pool.',
      icon: <Terminal className="w-4 h-4" />,
      link: '/aurix/hackathon',
      color: {
        badgeBg: 'bg-rose-500/15',
        badgeBorder: 'border-rose-500/30',
        badgeText: 'text-rose-400',
        cardBorder: 'border-rose-500/20',
        cardHoverBorder: 'hover:border-rose-500/60',
        watermark: 'text-rose-500/10',
        glow: 'group-hover:shadow-[0_0_25px_rgba(244,63,94,0.2)]',
        connector: 'from-rose-500/40 via-rose-500/10 to-transparent',
      },
    },
    {
      id: 'soccer',
      number: '02',
      arenaTag: 'Arena 02',
      title: 'AURIX Robo Soccer',
      description: 'High-speed wireless robots dribbling, passing, and shooting in a live pitch arena.',
      icon: <Bot className="w-4 h-4" />,
      link: '/aurix/robo-soccer',
      color: {
        badgeBg: 'bg-cyan-500/15',
        badgeBorder: 'border-cyan-500/30',
        badgeText: 'text-krs-cyan',
        cardBorder: 'border-cyan-500/20',
        cardHoverBorder: 'hover:border-krs-cyan/60',
        watermark: 'text-cyan-500/10',
        glow: 'group-hover:shadow-[0_0_25px_rgba(6,182,212,0.2)]',
        connector: 'from-cyan-500/40 via-cyan-500/10 to-transparent',
      },
    },
    {
      id: 'race',
      number: '03',
      arenaTag: 'Arena 03',
      title: 'AURIX Robo Race',
      description: 'Precision time trials conquering chicanes, steep ramps, and dynamic obstacle tracks.',
      icon: <Zap className="w-4 h-4" />,
      link: '/aurix/robo-race',
      color: {
        badgeBg: 'bg-amber-500/15',
        badgeBorder: 'border-amber-500/30',
        badgeText: 'text-amber-400',
        cardBorder: 'border-amber-500/20',
        cardHoverBorder: 'hover:border-amber-500/60',
        watermark: 'text-amber-500/10',
        glow: 'group-hover:shadow-[0_0_25px_rgba(245,158,11,0.2)]',
        connector: 'from-amber-500/40 via-amber-500/10 to-transparent',
      },
    },
  ],
  right: [
    {
      id: 'expo',
      number: '04',
      arenaTag: 'Arena 04',
      title: 'AURIX Robo Expo',
      description: 'Working robot exhibition, live proof-of-concept demos, and faculty jury defense.',
      icon: <Layers className="w-4 h-4" />,
      link: '/aurix/robo-expo',
      color: {
        badgeBg: 'bg-yellow-500/15',
        badgeBorder: 'border-yellow-500/30',
        badgeText: 'text-yellow-400',
        cardBorder: 'border-yellow-500/20',
        cardHoverBorder: 'hover:border-yellow-500/60',
        watermark: 'text-yellow-500/10',
        glow: 'group-hover:shadow-[0_0_25px_rgba(234,179,8,0.2)]',
        connector: 'from-yellow-500/40 via-yellow-500/10 to-transparent',
      },
    },
    {
      id: 'ideathon',
      number: '05',
      arenaTag: 'Arena 05',
      title: 'AURIX Robo Ideathon',
      description: 'Problem-solving engineering pitches, simulation CAD, and real-world impact blueprints.',
      icon: <Lightbulb className="w-4 h-4" />,
      link: '/aurix/robo-ideathon',
      color: {
        badgeBg: 'bg-rose-500/15',
        badgeBorder: 'border-rose-500/30',
        badgeText: 'text-rose-400',
        cardBorder: 'border-rose-500/20',
        cardHoverBorder: 'hover:border-rose-500/60',
        watermark: 'text-rose-500/10',
        glow: 'group-hover:shadow-[0_0_25px_rgba(244,63,94,0.2)]',
        connector: 'from-rose-500/40 via-rose-500/10 to-transparent',
      },
    },
    {
      id: 'championship',
      number: '06',
      arenaTag: 'Arena 06',
      title: 'Grand Championship',
      description: 'National awards, verified credentials, and ₹2,00,000+ total cumulative prize pool.',
      icon: <Trophy className="w-4 h-4" />,
      link: '/aurix/competitions',
      color: {
        badgeBg: 'bg-blue-500/15',
        badgeBorder: 'border-blue-500/30',
        badgeText: 'text-blue-400',
        cardBorder: 'border-blue-500/20',
        cardHoverBorder: 'hover:border-blue-500/60',
        watermark: 'text-blue-500/10',
        glow: 'group-hover:shadow-[0_0_25px_rgba(59,130,246,0.2)]',
        connector: 'from-blue-500/40 via-blue-500/10 to-transparent',
      },
    },
  ],
}

function ModuleCard({ item, side }: { item: CompetitionModule; side: 'left' | 'right' }) {
  return (
    <Link
      href={item.link}
      className={`
        group relative block p-4 sm:p-5 rounded-xl
        bg-krs-surface/85 backdrop-blur-xl
        border ${item.color.cardBorder} ${item.color.cardHoverBorder}
        transition-all duration-300 hover:-translate-y-1
        ${item.color.glow}
        overflow-hidden select-none
      `}
    >
      {/* Ghost watermark number in bottom corner */}
      <span
        className={`
          absolute -bottom-3 ${side === 'left' ? '-left-1' : '-right-1'}
          text-5xl sm:text-6xl font-black font-mono select-none pointer-events-none
          ${item.color.watermark} transition-all duration-300 group-hover:scale-110
        `}
      >
        {item.number}
      </span>

      {/* Top row: Module Tag & Icon */}
      <div className={`flex items-center justify-between mb-2.5 ${side === 'left' ? 'flex-row' : 'flex-row-reverse'}`}>
        <span className="text-[10px] font-mono tracking-wider font-semibold text-slate-300 uppercase">
          {item.arenaTag}
        </span>
        <div
          className={`
            w-7 h-7 rounded-lg flex items-center justify-center
            ${item.color.badgeBg} ${item.color.badgeBorder} ${item.color.badgeText}
            border shadow-sm group-hover:scale-110 transition-transform duration-300
          `}
        >
          {item.icon}
        </div>
      </div>

      {/* Title */}
      <h3 className="relative z-10 text-white font-bold text-sm sm:text-base mb-1 group-hover:text-cyan-300 transition-colors">
        {item.title}
      </h3>

      {/* Description */}
      <p className="relative z-10 text-slate-400 text-xs leading-relaxed line-clamp-2">
        {item.description}
      </p>

      {/* Arrow prompt */}
      <div className="relative z-10 flex items-center gap-1 text-[10px] font-mono text-krs-cyan mt-2 opacity-0 group-hover:opacity-100 transition-opacity">
        <span>View challenge details</span>
        <ChevronRight className="w-3 h-3" />
      </div>
    </Link>
  )
}

export function CompetitionsHubBlock(props: {
  b?: any
  title?: string
  eyebrow?: string
  intro?: string
}) {
  return (
    <section className="relative w-full py-12 sm:py-16 px-4 sm:px-6 lg:px-8 overflow-hidden bg-[#070a12] my-2">
      {/* ── Multi-Layered Elevated Background (Subtle yet Noticeable) ── */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none select-none">
        {/* Engineering Board Background with handwritten robotics formulas & schematics */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/images/robotics-board.jpg"
          alt=""
          className="w-full h-full object-cover object-center scale-105 filter blur-sm sm:blur-md opacity-30"
        />

        {/* Dual-Tone Arena Spotlight: Vibrant Orange Core + Cyan Wings */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_55%,rgba(249,115,22,0.22)_0%,rgba(249,115,22,0.08)_35%,transparent_70%)]" />
        <div className="absolute top-1/3 left-1/12 w-[500px] h-[500px] rounded-full blur-[140px] bg-krs-cyan/15" />
        <div className="absolute bottom-1/3 right-1/12 w-[500px] h-[500px] rounded-full blur-[140px] bg-blue-600/15" />

        {/* Smooth Vignette on Edges for Clean Blending */}
        <div className="absolute inset-0 bg-gradient-to-b from-[#070a12] via-transparent to-[#070a12]" />
        <div className="absolute inset-0 bg-gradient-to-r from-[#070a12] via-transparent to-[#070a12]" />

        {/* Crisp Tech Grid Pattern */}
        <div className="absolute inset-0 bg-tech-grid opacity-35" />

        {/* Concentric Arena Radar Geometry Centered Behind Core */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[520px] h-[520px] rounded-full border border-aurix-orange/20 pointer-events-none" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[760px] h-[760px] rounded-full border border-dashed border-aurix-orange/15 pointer-events-none" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[1050px] h-[1050px] rounded-full border border-dashed border-krs-cyan/10 pointer-events-none" />
      </div>

      {/* Top & Bottom Subtle Energy Lines */}
      <div className="absolute top-0 left-1/4 right-1/4 h-[1px] bg-gradient-to-r from-transparent via-aurix-orange/50 to-transparent pointer-events-none" />
      <div className="absolute bottom-0 left-1/4 right-1/4 h-[1px] bg-gradient-to-r from-transparent via-krs-cyan/40 to-transparent pointer-events-none" />

      {/* ── Section Heading ── */}
      <div className="relative z-10 max-w-2xl mx-auto text-center mb-8 sm:mb-10 space-y-2">
        <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full border bg-aurix-orange/10 border-aurix-orange/30 text-aurix-orange text-[10px] font-mono tracking-wider uppercase">
          <span>04 // AURIX 2026 Series</span>
        </div>
        <h2 className="text-3xl sm:text-4xl lg:text-[42px] font-black tracking-tight text-white leading-tight font-cinzel">
          The Competition{' '}
          <span className="gradient-text-orange drop-shadow-[0_0_25px_rgba(249,115,22,0.5)]">
            Toolkit
          </span>
        </h2>
        <p className="text-slate-300 text-xs sm:text-sm max-w-lg mx-auto leading-relaxed font-light">
          Every challenge in this arena maps directly to elite hardware mastery, autonomous control, and national recognition.
        </p>
      </div>

      {/* ── Hub & Spoke Radial Layout ── */}
      <div className="relative z-10 max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-5 lg:gap-6 items-center">
        {/* Left Column — 3 Cards */}
        <div className="lg:col-span-4 space-y-3.5">
          {MODULES.left.map((item) => (
            <ModuleCard key={item.id} item={item} side="left" />
          ))}
        </div>

        {/* Center Circular Core Hub */}
        <div className="lg:col-span-4 flex items-center justify-center py-4 lg:py-0 select-none">
          <div className="relative w-[260px] h-[260px] sm:w-[290px] sm:h-[290px] flex items-center justify-center">
            {/* Ambient pulsing glow behind center orb */}
            <div className="absolute inset-[-15px] rounded-full bg-aurix-orange/20 blur-xl animate-pulse pointer-events-none" />

            {/* Rotating dashed concentric orbit rings */}
            <div className="absolute inset-[-25px] rounded-full border border-dashed border-aurix-orange/30 animate-spin-slow pointer-events-none" />
            <div className="absolute inset-[-40px] rounded-full border border-aurix-orange/15 animate-spin-very-slow pointer-events-none" />

            {/* Center Elevated Sphere */}
            <div
              className="
                relative z-10 w-full h-full rounded-full
                bg-gradient-to-b from-[#131b2e] via-[#0d1322] to-[#080c16]
                border-2 border-aurix-orange/50
                shadow-[0_0_40px_rgba(249,115,22,0.35),inset_0_0_25px_rgba(249,115,22,0.15)]
                p-6 sm:p-7 flex flex-col items-center justify-center text-center
              "
            >
              {/* Badge */}
              <span className="text-[9px] font-mono tracking-widest text-aurix-orange uppercase font-bold mb-1.5">
                National Arena
              </span>

              {/* Title */}
              <h3 className="text-2xl sm:text-3xl font-black font-cinzel text-white leading-tight mb-1.5 drop-shadow-[0_4px_20px_rgba(0,0,0,0.8)]">
                The AURIX<br />
                <span className="text-aurix-orange">Core</span>
              </h3>

              {/* Description */}
              <p className="text-slate-300 text-[11px] sm:text-xs leading-relaxed max-w-[190px] mb-4 font-light">
                The premier high-performance robotics challenge circuit.
              </p>

              {/* Action Button */}
              <Link
                href="/aurix"
                className="
                  inline-flex items-center gap-1.5 px-5 py-2 rounded-full
                  bg-gradient-to-r from-amber-500 to-aurix-orange
                  text-black font-bold text-[11px] uppercase font-mono tracking-wider
                  shadow-[0_0_15px_rgba(249,115,22,0.6)] hover:shadow-[0_0_25px_rgba(249,115,22,0.9)]
                  hover:scale-105 transition-all
                  btn-shimmer
                "
              >
                <span>Enter Arena</span>
                <ArrowRight className="w-3 h-3" />
              </Link>
            </div>
          </div>
        </div>

        {/* Right Column — 3 Cards */}
        <div className="lg:col-span-4 space-y-3.5">
          {MODULES.right.map((item) => (
            <ModuleCard key={item.id} item={item} side="right" />
          ))}
        </div>
      </div>
    </section>
  )
}
