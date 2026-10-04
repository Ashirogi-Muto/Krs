import React from 'react'
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
export function CmsLink({ href, className, children }: { href: string; className?: string; children: React.ReactNode }) {
  if (/^https?:\/\//i.test(href))
    return (
      <a href={href} target="_blank" rel="noopener noreferrer" className={className}>
        {children}
      </a>
    )
  if (/^(mailto|tel):|^#/i.test(href))
    return (
      <a href={href} className={className}>
        {children}
      </a>
    )
  return (
    <Link href={href} className={className}>
      {children}
    </Link>
  )
}

export type Theme = 'krs' | 'aurix'
export const accentText = (t?: string) => (t === 'aurix' ? 'text-aurix-orange' : 'text-krs-cyan')

/** "01 // Small line" + title (+ "See all" link on the right) used by most sections. */
export function SectionHeader({
  eyebrow, title, intro, linkLabel, linkHref, theme,
}: { eyebrow?: string; title?: string; intro?: string; linkLabel?: string; linkHref?: string; theme?: string }) {
  if (!eyebrow && !title && !intro && !linkLabel) return null
  return (
    <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
      <div>
        {eyebrow && <span className={`text-xs font-mono uppercase tracking-wider ${accentText(theme)}`}>{eyebrow}</span>}
        {title && <h2 className="text-2xl sm:text-3xl font-display font-bold text-white tracking-tight mt-1">{title}</h2>}
        {intro && <p className="text-slate-400 text-sm leading-relaxed mt-2 max-w-3xl">{intro}</p>}
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
