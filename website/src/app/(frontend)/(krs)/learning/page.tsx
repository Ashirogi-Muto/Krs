import React from 'react'
import Link from 'next/link'
import { constructMetadata } from '@/lib/seo/metadata'
import { BreadcrumbsJsonLd } from '@/lib/seo/structured-data'
import { getAllResources } from '@/lib/data/content'
import { BookOpen, Clock, ChevronRight, Sparkles } from 'lucide-react'

export const metadata = constructMetadata({
  title: 'Robotics Knowledge Hub | Learning Resources',
  description:
    'Curated engineering tutorials, ROS2 architectural guides, embedded firmware codebooks, and PCB design principles published by Kalam Robotics Society.',
  path: '/learning',
})

const CATEGORIES = [
  'All',
  'ROS / ROS2',
  'ESP32',
  'PCB Design',
  'Embedded Systems',
  'Computer Vision',
  'Control Systems',
  'CAD & 3D Printing',
]

export default async function LearningPage() {
  const resources = await getAllResources()

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 space-y-12">
      <BreadcrumbsJsonLd
        items={[
          { name: 'Home', url: '/' },
          { name: 'Learning', url: '/learning' },
        ]}
      />

      <div className="space-y-4">
        <span className="text-xs font-mono text-krs-cyan uppercase tracking-wider">
          Curriculum & Pedagogy // Knowledge Hub
        </span>
        <h1 className="text-3xl sm:text-5xl font-display font-extrabold text-white tracking-tight">
          Robotics Knowledge Hub
        </h1>
        <p className="text-slate-400 text-sm sm:text-base max-w-2xl leading-relaxed">
          Open-access technical tutorials, hardware design guides, and software architecture walkthroughs crafted by society leads to elevate engineering standards.
        </p>
      </div>

      {/* Categories */}
      <div className="flex flex-wrap gap-2 border-b border-krs-border pb-6">
        {CATEGORIES.map((cat, idx) => (
          <span
            key={cat}
            className={`px-3.5 py-1.5 rounded-full text-xs font-mono cursor-pointer transition-colors ${
              idx === 0
                ? 'bg-krs-cyan text-black font-semibold'
                : 'bg-krs-surface border border-krs-border text-slate-300 hover:text-white hover:border-slate-500'
            }`}
          >
            {cat}
          </span>
        ))}
      </div>

      {/* Resource Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {resources.map((res) => (
          <Link
            key={res.id}
            href={`/learning/${res.slug}`}
            className="tech-card rounded-xl p-6 flex flex-col justify-between space-y-5 group"
          >
            <div className="space-y-3">
              <div className="flex items-center justify-between text-[11px] font-mono">
                <span className="px-2.5 py-0.5 rounded bg-krs-surface text-krs-cyan border border-krs-border">
                  {res.category}
                </span>
                <span className="flex items-center gap-1 text-slate-400">
                  <Clock className="w-3 h-3" />
                  {res.estimatedTime}
                </span>
              </div>
              <h2 className="font-display font-bold text-white text-lg group-hover:text-krs-cyan transition-colors leading-snug">
                {res.title}
              </h2>
              <p className="text-slate-400 text-xs leading-relaxed line-clamp-3">
                {res.summary}
              </p>
            </div>

            <div className="pt-4 border-t border-krs-border/60 flex items-center justify-between text-[11px] font-mono">
              <span className="text-slate-400">{res.resourceType}</span>
              <span className="text-krs-cyan uppercase font-semibold flex items-center gap-1">
                {res.difficulty} <ChevronRight className="w-3.5 h-3.5" />
              </span>
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}
