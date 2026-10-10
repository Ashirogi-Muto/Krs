'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { RotateCw, ArrowRight, CheckCircle2 } from 'lucide-react'

/* ── Glowing Cybernetic Pushpin ─────────────────────────────────────────────── */
function CyberPushpin() {
  return (
    <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 z-30 pointer-events-none select-none flex items-center justify-center">
      {/* Pin shadow */}
      <div className="absolute top-2 left-2 w-4 h-4 bg-black/60 rounded-full blur-[2px]" />
      {/* Pin beacon head */}
      <div className="relative w-6 h-6 rounded-full bg-gradient-to-br from-[#ff5252] via-[#e50914] to-[#67000b] shadow-[0_0_15px_rgba(229,9,20,0.65),0_4px_8px_rgba(0,0,0,0.8)] border border-[#ff8585]/50 flex items-center justify-center">
        {/* Specular highlight */}
        <div className="absolute top-1 left-1.5 w-2 h-1.5 bg-white/80 rounded-full blur-[0.3px]" />
        {/* Center core */}
        <div className="w-1.5 h-1.5 rounded-full bg-white/90 shadow-[0_0_6px_#ffffff]" />
      </div>
    </div>
  )
}

interface DisciplineCard {
  id: string
  category: string
  image: string
  caption: string
  rotationClass: string
  backTitle: string
  backSubtitle: string
  specs: string[]
  linkHref: string
  linkText: string
}

const CARDS: DisciplineCard[] = [
  {
    id: 'hardware',
    category: 'The Hardware Builders',
    image: '/images/pillar-lab.jpg',
    caption:
      "You keep tinkering with electronics. But nobody's given you access to a dedicated lab workbench until now.",
    rotationClass: '-rotate-2 hover:rotate-0',
    backTitle: '01 // Prototyping Laboratory',
    backSubtitle: 'Component assembly, rapid PCB fabrication, and high-frequency hardware debugging.',
    specs: [
      'Custom 4-Layer Power & Motor PCBs',
      'STM32 & ARM Cortex Microcontrollers',
      'Rapid SLA & FDM 3D Prototyping',
      'High-Torque Planetary Gear Encoders',
    ],
    linkHref: '/projects',
    linkText: 'Explore Hardware Stack',
  },
  {
    id: 'arena',
    category: 'The Arena Competitors',
    image: '/images/pillar-arena.jpg',
    caption:
      "You know national competitions are where reputations are made. You're looking for a crew to build winning rovers with.",
    rotationClass: 'rotate-1 hover:rotate-0',
    backTitle: '02 // National Circuit',
    backSubtitle: 'Autonomous rover navigation, high-speed arenas, and national robotics challenges.',
    specs: [
      'University Rover Challenge (URC)',
      'AURIX National Arena Championship',
      'Autonomous Line & Maze Navigation',
      'RoboSoccer & Heavyweight Combat',
    ],
    linkHref: '/aurix',
    linkText: 'Enter AURIX Arena',
  },
  {
    id: 'systems',
    category: 'The Systems Architects',
    image: '/images/pillar-code.jpg',
    caption:
      "You've spent years writing code. Now you want to see your algorithms control physical machines in real time.",
    rotationClass: '-rotate-1.5 hover:rotate-0',
    backTitle: '03 // Cyber-Physical Stack',
    backSubtitle: 'Distributed ROS2 nodes, real-time edge AI perception, stereoscopic depth vision, and Nav2 SLAM.',
    specs: [
      'ROS2 Humble Robot Middleware',
      'Stereo Depth Real-Time Visual Odometry',
      '2D/3D LiDAR SLAM & Costmaps',
      'YOLOv11 Edge Neural Vision Inferencing',
    ],
    linkHref: '/insights',
    linkText: 'Inspect Perception Stack',
  },
]

export function DisciplinesPinnedBlock(props: {
  b?: any
  title?: string
  eyebrow?: string
  intro?: string
}) {
  const [flipped, setFlipped] = useState<Record<string, boolean>>({})

  const toggleFlip = (id: string) => {
    setFlipped((prev) => ({ ...prev, [id]: !prev[id] }))
  }

  return (
    <section className="relative w-full py-10 sm:py-14 px-4 sm:px-6 lg:px-8 rounded-2xl overflow-hidden bg-krs-dark/95 border border-krs-cyan/25 shadow-[0_16px_60px_rgba(0,0,0,0.7),inset_0_0_60px_rgba(6,182,212,0.05)] bg-tech-grid">
      {/* Ambient cyan and blue glow pools */}
      <div className="absolute top-0 left-1/4 w-[500px] h-[500px] rounded-full blur-[140px] bg-krs-cyan/15 pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] rounded-full blur-[140px] bg-blue-600/10 pointer-events-none" />

      {/* Cyber corner brackets */}
      <div className="absolute top-0 left-0 w-16 h-16 border-t-2 border-l-2 border-krs-cyan/40 pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-16 h-16 border-b-2 border-r-2 border-krs-cyan/40 pointer-events-none" />

      {/* ── Heading in dark robotics theme ── */}
      <div className="relative z-10 max-w-2xl mx-auto text-center mb-8 sm:mb-10 space-y-2">
        <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full border bg-krs-cyan/10 border-krs-cyan/30 text-krs-cyan text-[10px] font-mono tracking-wider uppercase mb-1">
          <span>02 // Operational Pillars</span>
        </div>
        <h2 className="text-3xl sm:text-4xl lg:text-[42px] font-black tracking-tight text-white leading-tight font-cinzel">
          Engineering Rigor{' '}
          <span className="gradient-text-cyan drop-shadow-[0_0_25px_rgba(6,182,212,0.5)] font-normal">
            in Every Discipline
          </span>
        </h2>
        <p className="text-slate-300 text-xs sm:text-sm max-w-lg mx-auto leading-relaxed font-light">
          Kalam Robotics Society is built for ambitious engineers ready to design, prototype, and dominate across
          robotics disciplines.
        </p>
      </div>

      {/* ── 3 Dark Cyber Pinned Cards ── */}
      <div className="relative z-10 max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8 items-start">
        {CARDS.map((card) => {
          const isFlipped = !!flipped[card.id]

          return (
            <div
              key={card.id}
              className={`group perspective-1000 transition-transform duration-500 ${card.rotationClass}`}
            >
              <div
                onClick={() => toggleFlip(card.id)}
                className={`
                  relative w-full min-h-[440px] sm:min-h-[460px] cursor-pointer
                  flip-card-inner
                  ${isFlipped ? 'flip-card-is-flipped' : 'flip-card-hover-flip'}
                `}
              >
                {/* ════════════ FRONT SIDE ════════════ */}
                <div
                  className="
                    absolute inset-0 w-full h-full
                    bg-[#0b101d] text-white
                    p-6 sm:p-7
                    rounded-t-lg
                    torn-paper-edge
                    shadow-[0_20px_50px_rgba(0,0,0,0.8),0_0_20px_rgba(6,182,212,0.15)]
                    border border-krs-cyan/30
                    backface-hidden
                    flex flex-col
                  "
                >
                  <CyberPushpin />

                  {/* Category Title Underlined in Glowing Accent */}
                  <div className="text-center pt-2 mb-5">
                    <h3 className="inline-block text-krs-cyan font-bold text-base sm:text-lg tracking-wide border-b-2 border-krs-cyan/80 pb-0.5 drop-shadow-[0_0_10px_rgba(6,182,212,0.4)]">
                      {card.category}
                    </h3>
                  </div>

                  {/* Centered Grayscale Photograph with Dark Frame */}
                  <div className="relative w-full aspect-[4/3] rounded bg-black/60 overflow-hidden border border-krs-cyan/25 shadow-inner mb-5 select-none">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={card.image}
                      alt={card.category}
                      className="w-full h-full object-cover grayscale contrast-125 brightness-90 group-hover:scale-105 group-hover:brightness-100 transition-all duration-500"
                      draggable={false}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent pointer-events-none" />
                  </div>

                  {/* Caption Paragraph */}
                  <p className="text-slate-300 text-xs sm:text-[13px] leading-relaxed text-center font-normal px-1 mb-4 flex-grow">
                    {card.caption}
                  </p>

                  {/* Flip Action Indicator */}
                  <div className="pt-2 border-t border-dashed border-white/10 flex items-center justify-center gap-1.5 text-[11px] font-mono text-slate-400 group-hover:text-krs-cyan transition-colors pb-3">
                    <RotateCw className="w-3 h-3 text-krs-cyan" />
                    <span>Flip dossier for specs</span>
                  </div>
                </div>

                {/* ════════════ BACK SIDE ════════════ */}
                <div
                  className="
                    absolute inset-0 w-full h-full
                    bg-[#0b101d] text-white
                    p-6 sm:p-7
                    rounded-t-lg
                    torn-paper-edge
                    shadow-[0_20px_50px_rgba(0,0,0,0.8),0_0_20px_rgba(6,182,212,0.15)]
                    border border-krs-cyan/40
                    backface-hidden
                    rotate-y-180
                    flex flex-col justify-between
                  "
                >
                  <CyberPushpin />

                  {/* Back Header */}
                  <div>
                    <div className="text-center pt-2 mb-4">
                      <span className="text-[10px] font-mono text-krs-cyan uppercase tracking-widest block mb-0.5">
                        Technical Dossier
                      </span>
                      <h4 className="text-white font-bold text-base sm:text-lg tracking-tight border-b-2 border-krs-cyan/80 pb-0.5 inline-block">
                        {card.backTitle}
                      </h4>
                    </div>

                    <p className="text-slate-400 text-xs leading-relaxed text-center mb-5">
                      {card.backSubtitle}
                    </p>

                    {/* Spec checklist */}
                    <div className="space-y-2.5 bg-black/40 p-3.5 rounded-lg border border-white/10 mb-4">
                      {card.specs.map((spec, i) => (
                        <div key={i} className="flex items-start gap-2 text-xs text-slate-200">
                          <CheckCircle2 className="w-3.5 h-3.5 text-krs-cyan flex-shrink-0 mt-0.5" />
                          <span className="leading-tight font-medium">{spec}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Bottom CTA on Back */}
                  <div className="pt-2 pb-3">
                    <Link
                      href={card.linkHref}
                      onClick={(e) => e.stopPropagation()}
                      className="w-full inline-flex items-center justify-center gap-1.5 py-2.5 px-4 rounded-lg bg-krs-cyan text-black hover:bg-cyan-300 text-xs font-bold transition-all shadow-[0_0_15px_rgba(6,182,212,0.4)] btn-shimmer"
                    >
                      <span>{card.linkText}</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </section>
  )
}
