import React from 'react'
import { Zap, Play, ArrowRight } from 'lucide-react'
import Link from 'next/link'
import { HeroOrbitClient } from './HeroOrbitClient'

export function HeroOrbitBlock(props: {
  b?: any
  title?: string
  titleAccent?: string
  eyebrow?: string
  intro?: string
  primaryBtn?: { label: string; href: string }
  secondaryBtn?: { label: string; href: string }
  cms?: any
  query?: any
  path?: string
  index?: number
}) {
  const b = props.b || props
  const title = b.title || 'KALAM ROBOTICS'
  const titleAccent = b.titleAccent || 'SOCIETY'
  const eyebrow = b.eyebrow || 'IILM University, Greater Noida // Robotics Lab'
  const intro =
    b.intro ||
    'We engineer autonomous systems, push the boundaries of embedded AI, and compete on the world stage — one robot at a time.'
  const primaryBtn = b.buttons?.[0] || b.primaryBtn || { label: 'Explore KRS', href: '#about' }
  const secondaryBtn = b.buttons?.[1] || b.secondaryBtn || { label: 'Enter AURIX Arena', href: '/aurix' }

  return (
    <section
      id="hero"
      className="relative flex flex-col items-center justify-center min-h-[calc(100vh-5rem)] pt-4 sm:pt-6 md:pt-8 pb-14 sm:pb-20 px-4 sm:px-6 lg:px-8 overflow-hidden bg-krs-dark bg-tech-grid"
    >
      {/* ── Background Cybernetic Robot Atmosphere ── */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none select-none overflow-hidden z-0">
        {/* Deep ambient glow blooms */}
        <div className="absolute w-[640px] h-[640px] rounded-full blur-[140px] bg-krs-cyan/20 pointer-events-none" />
        <div className="absolute w-[480px] h-[480px] rounded-full blur-[100px] bg-blue-600/15 pointer-events-none" />

        {/* Concentric rotating radar orbit rings */}
        <div className="absolute w-[560px] h-[560px] sm:w-[680px] sm:h-[680px] rounded-full border border-dashed border-krs-cyan/20 animate-spin-slow pointer-events-none" />
        <div className="absolute w-[760px] h-[760px] sm:w-[920px] sm:h-[920px] rounded-full border border-krs-cyan/10 animate-spin-very-slow pointer-events-none" />
        <div className="absolute w-[1000px] h-[1000px] sm:w-[1200px] sm:h-[1200px] rounded-full border border-krs-cyan/05 pointer-events-none" />

        {/* Radar crosshair lines */}
        <div className="absolute w-[800px] h-px bg-gradient-to-r from-transparent via-krs-cyan/15 to-transparent pointer-events-none" />
        <div className="absolute h-[800px] w-px bg-gradient-to-b from-transparent via-krs-cyan/15 to-transparent pointer-events-none" />

        {/* The Central Background Robot */}
        <div className="relative w-[340px] sm:w-[500px] md:w-[620px] lg:w-[740px] flex items-center justify-center">
          {/* Subtle eye-glow flare behind the head */}
          <div className="absolute top-[22%] left-1/2 -translate-x-1/2 w-48 h-24 bg-krs-cyan/35 blur-2xl rounded-full pointer-events-none" />
          
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/images/hero-robot.jpg"
            alt="Robotics Society Cybernetic Mascot"
            className="w-full h-auto object-cover opacity-45 sm:opacity-50 lg:opacity-55 drop-shadow-[0_0_90px_rgba(6,182,212,0.35)] hero-robot-img"
            style={{
              maskImage: 'radial-gradient(ellipse 75% 75% at 50% 50%, black 35%, transparent 75%)',
              WebkitMaskImage: 'radial-gradient(ellipse 75% 75% at 50% 50%, black 35%, transparent 75%)',
            }}
            draggable={false}
          />

          {/* Continuous vertical scan line sweep */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <div className="hero-scan-line" />
          </div>
        </div>

        {/* Dark radial vignette over the background so foreground text is crystal sharp */}
        <div className="absolute inset-0 bg-gradient-to-b from-krs-dark/80 via-transparent to-krs-dark pointer-events-none" />
        <div className="absolute inset-0 bg-radial-gradient from-transparent via-transparent to-krs-dark/90 pointer-events-none" />
      </div>

      {/* Corner futuristic tech brackets */}
      <div className="absolute top-0 left-0 w-24 h-24 border-t-2 border-l-2 border-krs-cyan/30 pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-24 h-24 border-b-2 border-r-2 border-krs-cyan/30 pointer-events-none" />

      {/* Floating interactive orbit cards & telemetry badges */}
      <HeroOrbitClient />

      {/* ── Central Foreground Content ── */}
      <div className="relative z-10 max-w-3xl mx-auto w-full flex flex-col items-center text-center">
        {/* Eyebrow badge */}
        <div className="hero-animate hero-animate-1 inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border bg-krs-dark/85 backdrop-blur-md border-krs-cyan/40 text-krs-cyan text-[10px] sm:text-[11px] font-mono tracking-widest uppercase mb-4 shadow-[0_0_20px_rgba(6,182,212,0.2)]">
          <Zap className="w-3.5 h-3.5 text-krs-cyan animate-pulse" />
          {eyebrow}
        </div>

        {/* Main Heading */}
        <div className="hero-animate hero-animate-2 space-y-2 mb-4">
          <h1 className="text-3xl sm:text-5xl lg:text-[4rem] font-cinzel font-black tracking-wider text-white uppercase leading-[1.08] drop-shadow-[0_8px_40px_rgba(0,0,0,0.95)]">
            {title}
            <br className="hidden sm:inline" />
            <span className="gradient-text-cyan drop-shadow-[0_0_40px_rgba(6,182,212,0.6)]"> {titleAccent}</span>
          </h1>
          <div className="flex justify-center pt-1.5">
            <span className="accent-line w-28 shadow-[0_0_12px_rgba(6,182,212,0.8)]" />
          </div>
        </div>

        {/* Intro statement */}
        <p className="hero-animate hero-animate-3 max-w-xl text-slate-200 text-sm sm:text-base leading-relaxed mb-7 drop-shadow-[0_4px_16px_rgba(0,0,0,0.9)] font-light px-2">
          {intro}
        </p>

        {/* CTAs */}
        <div className="hero-animate hero-animate-4 flex flex-col sm:flex-row items-center justify-center gap-3.5">
          <Link
            href={primaryBtn.href}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-3 rounded-xl bg-krs-cyan text-black font-bold text-xs sm:text-sm hover:bg-cyan-300 transition-all shadow-[0_0_25px_rgba(6,182,212,0.45)] hover:shadow-[0_0_35px_rgba(6,182,212,0.7)] btn-shimmer"
          >
            {primaryBtn.label}
            <ArrowRight className="w-4 h-4" />
          </Link>
          <Link
            href={secondaryBtn.href}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-7 py-3 rounded-xl bg-krs-dark/80 border border-white/20 text-white font-semibold text-xs sm:text-sm hover:bg-white/10 hover:border-krs-cyan/60 transition-all backdrop-blur-md shadow-lg"
          >
            <span className="flex items-center justify-center w-6 h-6 rounded-full border border-krs-cyan/40 bg-krs-cyan/15">
              <Play className="w-2.5 h-2.5 text-krs-cyan fill-krs-cyan" />
            </span>
            {secondaryBtn.label}
          </Link>
        </div>
      </div>
    </section>
  )
}
