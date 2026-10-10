import React from 'react'
import { NO_CMS, type Cms } from '@/lib/cms-attrs'
import Link from 'next/link'
import { AurixMark } from '@/components/aurix/AurixMark'
import {
  Cpu, Terminal, Trophy, BookOpen, Layers, Code, Compass, Zap, Rocket, Users, Calendar, MapPin, Mail, Phone,
  Award, Target, Lightbulb, Wrench, Shield, Globe, Star, Camera, GraduationCap, Bot, CircuitBoard, Gauge, Flag, Heart,
  Clock, ChevronRight, type LucideIcon,
} from 'lucide-react'

const ICONS: Record<string, LucideIcon> = {
  cpu: Cpu, terminal: Terminal, trophy: Trophy, 'book-open': BookOpen, layers: Layers, code: Code, compass: Compass,
  zap: Zap, rocket: Rocket, users: Users, calendar: Calendar, 'map-pin': MapPin, mail: Mail, phone: Phone,
  award: Award, target: Target, lightbulb: Lightbulb, wrench: Wrench, shield: Shield, globe: Globe, star: Star,
  camera: Camera, 'graduation-cap': GraduationCap, bot: Bot, 'circuit-board': CircuitBoard, gauge: Gauge, flag: Flag,
  heart: Heart, clock: Clock,
}

export function BlockIcon({ name, className }: { name?: string; className?: string }) {
  // "flame" was the fire icon; it now shows the AURIX logo
  if (name === 'flame') return <AurixMark className={className} />
  const I = (name && ICONS[name]) || Cpu
  return <I className={className} />
}

/** Link typed by an editor (already validated by the CMS): internal → next/link, external → new tab. */
export function CmsLink({
  href, className, children, attrs,
}: { href: string; className?: string; children: React.ReactNode; attrs?: Record<string, string> /* live preview only */ }) {
  if (/^https?:\/\//i.test(href))
    return (
      <a href={href} target="_blank" rel="noopener noreferrer" className={className} {...attrs}>
        {children}
      </a>
    )
  if (/^(mailto|tel):|^#/i.test(href))
    return (
      <a href={href} className={className} {...attrs}>
        {children}
      </a>
    )
  return (
    <Link href={href} className={className} {...attrs}>
      {children}
    </Link>
  )
}

export type Theme = 'krs' | 'aurix'
export const accentText = (t?: string) => (t === 'aurix' ? 'text-aurix-orange' : 'text-krs-cyan')

/** "01 // Small line" + title (+ "See all" link on the right) used by most sections. */
export function SectionHeader({
  eyebrow, title, intro, linkLabel, linkHref, theme, cms = NO_CMS,
}: { eyebrow?: string; title?: string; intro?: string; linkLabel?: string; linkHref?: string; theme?: string; cms?: Cms }) {
  if (!eyebrow && !title && !intro && !linkLabel) return null
  return (
    <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 reveal">
      <div>
        {eyebrow && <span className={`text-xs font-mono uppercase tracking-wider ${accentText(theme)}`} {...cms('eyebrow')}>{eyebrow}</span>}
        {title && <h2 className={`text-2xl sm:text-4xl ${theme === 'aurix' ? 'font-display font-bold' : 'font-cinzel font-bold tracking-wide'} text-white tracking-tight mt-1 drop-shadow-[0_2px_15px_rgba(6,182,212,0.2)]`} {...cms('title')}>{title}</h2>}
        {title && <span className="accent-line mt-3" />}
        {intro && <p className="text-slate-400 text-sm leading-relaxed mt-3 max-w-3xl" {...cms('intro')}>{intro}</p>}
      </div>
      {linkLabel && linkHref && (
        <CmsLink href={linkHref} className={`text-xs font-mono hover:underline inline-flex items-center gap-1 ${accentText(theme)}`}>
          {linkLabel} <ChevronRight className="w-3.5 h-3.5" />
        </CmsLink>
      )}
    </div>
  )
}

export const container = 'max-w-7xl mx-auto px-4 sm:px-6 lg:px-8'
