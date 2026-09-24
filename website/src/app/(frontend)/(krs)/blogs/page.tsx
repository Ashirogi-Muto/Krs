import React from 'react'
import Link from 'next/link'
import { constructMetadata } from '@/lib/seo/metadata'
import { BreadcrumbsJsonLd } from '@/lib/seo/structured-data'
import { getAllBlogs } from '@/lib/data/content'
import { Clock, Calendar, ChevronRight } from 'lucide-react'

export const metadata = constructMetadata({
  title: 'Robotics Engineering Blogs & Recaps | Kalam Robotics Society',
  description:
    'Technical dispatches, design retrospectives, competition insights, and engineering tutorials from Kalam Robotics Society at IILM University Greater Noida.',
  path: '/blogs',
})

const CATEGORIES = [
  'All',
  'Project Stories',
  'Club News',
  'Robotics',
  'AI',
  'Tutorials',
  'Event Recaps',
]

export default async function BlogsPage() {
  const blogs = await getAllBlogs()

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 space-y-12">
      <BreadcrumbsJsonLd
        items={[
          { name: 'Home', url: '/' },
          { name: 'Blogs', url: '/blogs' },
        ]}
      />

      <div className="space-y-4">
        <span className="text-xs font-mono text-krs-cyan uppercase tracking-wider">
          Editorial & Dispatches // Society Blog
        </span>
        <h1 className="text-3xl sm:text-5xl font-display font-extrabold text-white tracking-tight">
          Robotics Insights & Chronicles
        </h1>
        <p className="text-slate-400 text-sm sm:text-base max-w-2xl leading-relaxed">
          In-depth technical reflections, hardware teardowns, rover milestone logs, and competition updates authored by the engineers at KRS.
        </p>
      </div>

      {/* Category Filter */}
      <div className="flex flex-wrap gap-2 border-b border-krs-border pb-6">
        {CATEGORIES.map((cat, idx) => (
          <span
            key={cat}
            className={`px-3.5 py-1.5 rounded-full text-xs font-mono cursor-pointer transition-colors ${
              idx === 0
                ? 'bg-krs-cyan text-black font-semibold'
                : 'bg-krs-surface border border-krs-border text-slate-300 hover:text-white'
            }`}
          >
            {cat}
          </span>
        ))}
      </div>

      {/* Blog Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {blogs.map((b) => (
          <Link
            key={b.id}
            href={`/blogs/${b.slug}`}
            className="tech-card rounded-2xl p-6 md:p-8 flex flex-col justify-between space-y-6 group"
          >
            <div className="space-y-3">
              <div className="flex items-center justify-between text-[11px] font-mono">
                <span className="text-krs-cyan uppercase font-semibold">
                  {b.category}
                </span>
                <span className="flex items-center gap-1 text-slate-400">
                  <Clock className="w-3 h-3" />
                  {b.readingTimeMinutes} min read
                </span>
              </div>

              <h2 className="font-display font-bold text-white text-xl sm:text-2xl group-hover:text-krs-cyan transition-colors leading-snug">
                {b.title}
              </h2>

              <p className="text-slate-400 text-xs sm:text-sm leading-relaxed line-clamp-3">
                {b.summary}
              </p>
            </div>

            <div className="pt-4 border-t border-krs-border/60 flex items-center justify-between text-xs font-mono text-slate-400">
              <span>{b.author}</span>
              <span className="flex items-center gap-1 text-krs-cyan font-semibold">
                Read Article <ChevronRight className="w-3.5 h-3.5" />
              </span>
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}
