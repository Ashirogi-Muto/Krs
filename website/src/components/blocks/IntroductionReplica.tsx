import React from 'react'
import Link from 'next/link'
import { Bot, Cpu, Trophy, Users, ChevronRight, Sparkles } from 'lucide-react'
import { NO_CMS, type Cms } from '@/lib/cms-attrs'
import { container } from './shared'

/**
 * Introduction section for Kalam Robotics Society:
 * Replaces certificate with authentic KRS laboratory & rover imagery,
 * and details the 4 core pillars of what the society does in a 2x2 grid.
 */
export function IntroductionReplica({ b, cms = NO_CMS }: { b?: any; cms?: Cms }) {
  const chips: string[] = (b?.chips || []).map((c: any) => c.item).filter(Boolean)

  return (
    <section id={b?.anchor || 'about'} {...cms()} className={`${container} py-8 sm:py-12 scroll-mt-24`}>
      {/* ── Section Header ── */}
      <div className="flex flex-col items-center text-center mb-10 sm:mb-12">
        <span className="text-[11px] font-mono text-krs-cyan uppercase tracking-widest mb-2.5">
          {b?.eyebrow || '01 // Institutional Foundation'}
        </span>

        <h2 className="text-3xl sm:text-4xl md:text-[44px] font-display font-black text-white tracking-tight leading-tight">
          Pioneering{' '}
          <span className="relative inline-block text-rose-500">
            Applied Robotics
            <span className="absolute -bottom-1 left-0 right-0 h-[3px] bg-rose-500/80 rounded-full shadow-[0_0_12px_rgba(244,63,94,0.7)]" />
          </span>
        </h2>

        <p className="max-w-2xl mx-auto text-slate-300 text-sm sm:text-base leading-relaxed mt-4 font-normal px-2">
          Kalam Robotics Society (KRS) is the premier multidisciplinary student robotics and cyber-physical systems laboratory at IILM University, Greater Noida — engineering autonomous rovers, competitive platforms, and deep-tech careers.
        </p>
      </div>

      {/* ── Main 2-Column Split: KRS Lab Image + 2x2 Society Pillars Grid ── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center max-w-6xl mx-auto">
        {/* ══════ LEFT COLUMN: High-Tech KRS Lab Image Card ══════ */}
        <div className="lg:col-span-6 flex flex-col">
          <div className="relative rounded-3xl p-3 sm:p-4 bg-[#0b101e]/95 border border-white/10 hover:border-krs-cyan/40 shadow-[0_16px_50px_rgba(0,0,0,0.65)] backdrop-blur-xl transition-all duration-300 group overflow-hidden">
            {/* Ambient Cyan/Rose Glow Blobs */}
            <div className="absolute -top-24 -left-24 w-64 h-64 rounded-full blur-[85px] bg-krs-cyan/15 pointer-events-none" />
            <div className="absolute -bottom-24 -right-24 w-64 h-64 rounded-full blur-[85px] bg-rose-500/10 pointer-events-none" />

            {/* Corner Tech Accent Brackets */}
            <div className="absolute top-2.5 left-2.5 w-6 h-6 border-t-2 border-l-2 border-krs-cyan/60 pointer-events-none z-20" />
            <div className="absolute top-2.5 right-2.5 w-6 h-6 border-t-2 border-r-2 border-krs-cyan/60 pointer-events-none z-20" />
            <div className="absolute bottom-2.5 left-2.5 w-6 h-6 border-b-2 border-l-2 border-krs-cyan/60 pointer-events-none z-20" />
            <div className="absolute bottom-2.5 right-2.5 w-6 h-6 border-b-2 border-r-2 border-krs-cyan/60 pointer-events-none z-20" />

            {/* Image Container with Inner Border & Hover Scale */}
            <div className="relative rounded-2xl overflow-hidden aspect-[4/3] bg-slate-950 border border-white/10">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/images/krs-lab.jpg"
                alt="Kalam Robotics Society Engineering Lab and Autonomous Rover Team"
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out"
              />

              {/* Top-Left Status Pill Overlay */}
              <div className="absolute top-3.5 left-3.5 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-black/80 backdrop-blur-md border border-krs-cyan/50 text-krs-cyan text-[10px] font-mono font-bold uppercase tracking-wider shadow-lg">
                <span className="w-1.5 h-1.5 rounded-full bg-krs-cyan animate-pulse" />
                <span>KRS RESEARCH LAB // 01</span>
              </div>

              {/* Bottom Info Gradient Bar Overlay */}
              <div className="absolute inset-x-0 bottom-0 p-4 sm:p-5 bg-gradient-to-t from-[#070a12] via-[#070a12]/80 to-transparent flex flex-col justify-end">
                <div className="flex items-center gap-2 mb-1">
                  <Sparkles className="w-3.5 h-3.5 text-cyan-300" />
                  <span className="text-[11px] font-mono uppercase tracking-widest text-cyan-300 font-semibold">
                    IILM UNIVERSITY • GREATER NOIDA
                  </span>
                </div>
                <p className="text-xs sm:text-[13px] text-slate-200 font-medium">
                  Multidisciplinary Robotics, Cyber-Physical Systems &amp; Rover Prototyping
                </p>
              </div>
            </div>
          </div>

          {/* Under-Card Note: Red Dot + Mission Statement */}
          <div className="flex items-center gap-2.5 mt-3.5 px-2">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.9)] animate-pulse shrink-0" />
            <span className="text-xs text-slate-400 font-mono">
              Hands-on bench engineering across mechanical, electronics &amp; software domains
            </span>
          </div>
        </div>

        {/* ══════ RIGHT COLUMN: 2x2 Society Operations Grid ══════ */}
        <div className="lg:col-span-6 flex flex-col justify-between space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 sm:gap-6">
            {/* Pillar 1: Autonomous Systems & Rovers */}
            <div className="p-4 sm:p-5 rounded-2xl bg-[#0c1222]/85 border border-white/10 hover:border-krs-cyan/40 transition-all duration-300 group">
              <div className="w-9 h-9 rounded-xl bg-krs-cyan/10 border border-krs-cyan/30 flex items-center justify-center text-krs-cyan mb-3.5 group-hover:scale-110 transition-transform">
                <Bot className="w-4 h-4" />
              </div>
              <h4 className="text-white font-display font-bold text-base mb-1.5 group-hover:text-cyan-300 transition-colors">
                Autonomous Rovers &amp; R&amp;D
              </h4>
              <p className="text-slate-400 text-xs sm:text-[13px] leading-relaxed">
                Design and fabricate custom terrain rovers, robotic manipulators, and mechanical chassis with advanced sensor fusion.
              </p>
            </div>

            {/* Pillar 2: Edge AI & Vision */}
            <div className="p-4 sm:p-5 rounded-2xl bg-[#0c1222]/85 border border-white/10 hover:border-krs-cyan/40 transition-all duration-300 group">
              <div className="w-9 h-9 rounded-xl bg-blue-500/10 border border-blue-500/30 flex items-center justify-center text-blue-400 mb-3.5 group-hover:scale-110 transition-transform">
                <Cpu className="w-4 h-4" />
              </div>
              <h4 className="text-white font-display font-bold text-base mb-1.5 group-hover:text-blue-300 transition-colors">
                Edge AI &amp; ROS2 Navigation
              </h4>
              <p className="text-slate-400 text-xs sm:text-[13px] leading-relaxed">
                Develop real-time computer vision pipelines, SLAM spatial mapping, and autonomous obstacle avoidance on onboard neural accelerators.
              </p>
            </div>

            {/* Pillar 3: Competitions & Arena */}
            <div className="p-4 sm:p-5 rounded-2xl bg-[#0c1222]/85 border border-white/10 hover:border-krs-cyan/40 transition-all duration-300 group">
              <div className="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 mb-3.5 group-hover:scale-110 transition-transform">
                <Trophy className="w-4 h-4" />
              </div>
              <h4 className="text-white font-display font-bold text-base mb-1.5 group-hover:text-amber-300 transition-colors">
                National Arena Competitions
              </h4>
              <p className="text-slate-400 text-xs sm:text-[13px] leading-relaxed">
                Compete across premier national robotics challenges including Robo Soccer, high-speed Robo Race, and the annual AURIX championship.
              </p>
            </div>

            {/* Pillar 4: Skilling & Incubation */}
            <div className="p-4 sm:p-5 rounded-2xl bg-[#0c1222]/85 border border-white/10 hover:border-krs-cyan/40 transition-all duration-300 group">
              <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 mb-3.5 group-hover:scale-110 transition-transform">
                <Users className="w-4 h-4" />
              </div>
              <h4 className="text-white font-display font-bold text-base mb-1.5 group-hover:text-emerald-300 transition-colors">
                Hands-on Skilling &amp; Incubation
              </h4>
              <p className="text-slate-400 text-xs sm:text-[13px] leading-relaxed">
                Bridge classroom theory to bench engineering with bootcamps in PCB design, firmware development, 3D printing, and industry mentorship.
              </p>
            </div>
          </div>

          {/* Technical Domain Badges & Link to Society Dossier */}
          {chips.length > 0 && (
            <div className="pt-2">
              <div className="flex flex-wrap gap-1.5">
                {chips.slice(0, 6).map((c) => (
                  <span
                    key={c}
                    className="px-2.5 py-0.5 text-[11px] font-mono rounded-md bg-krs-surface/80 border border-white/10 text-slate-300 hover:border-krs-cyan/40 hover:text-cyan-300 transition-colors"
                  >
                    {c}
                  </span>
                ))}
              </div>

              {b?.linkLabel && b?.linkHref && (
                <div className="pt-3">
                  <Link
                    href={b.linkHref}
                    className="inline-flex items-center gap-1.5 text-xs font-mono text-krs-cyan hover:underline"
                  >
                    <span>{b.linkLabel}</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </section>
  )
}
