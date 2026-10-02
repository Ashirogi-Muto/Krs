import React from 'react'
import Link from 'next/link'
import { constructMetadata } from '@/lib/seo/metadata'
import { BreadcrumbsJsonLd } from '@/lib/seo/structured-data'
import { getAllProjects } from '@/lib/data/content'
import { Cpu, ArrowRight, Code, Layers } from 'lucide-react'

// Content comes from the CMS; re-read at most once a minute
export const revalidate = 60

export const metadata = constructMetadata({
  title: 'Engineering Projects Portfolio | Kalam Robotics Society',
  description:
    'Explore custom autonomous rovers, IoT agricultural sensors, multi-DOF hexapods, and robotics hardware engineered at IILM University Greater Noida.',
  path: '/projects',
})

export default async function ProjectsPage() {
  const projects = await getAllProjects()

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 space-y-12">
      <BreadcrumbsJsonLd
        items={[
          { name: 'Home', url: '/' },
          { name: 'Projects', url: '/projects' },
        ]}
      />

      <div className="space-y-4">
        <span className="text-xs font-mono text-krs-cyan uppercase tracking-wider">
          Hardware & Software Systems // Engineering Portfolio
        </span>
        <h1 className="text-3xl sm:text-5xl font-display font-extrabold text-white tracking-tight">
          Robotics Project Portfolio
        </h1>
        <p className="text-slate-400 text-sm sm:text-base max-w-2xl leading-relaxed">
          In-house cyber-physical systems designed, fabricated, and validated by multidisciplinary student engineering teams at IILM University.
        </p>
      </div>

      {/* Projects Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {projects.map((p) => (
          <div
            key={p.id}
            className="tech-card rounded-2xl overflow-hidden flex flex-col justify-between group"
          >
            {/* Visual Canvas Representation */}
            <div className="h-48 bg-gradient-to-br from-krs-surface via-[#141e38] to-krs-dark border-b border-krs-border flex flex-col items-center justify-center p-6 text-center relative overflow-hidden">
              <div className="w-12 h-12 rounded-xl bg-krs-card border border-krs-border flex items-center justify-center text-krs-cyan mb-2 group-hover:scale-110 transition-transform">
                <Cpu className="w-6 h-6" />
              </div>
              <span className="text-xs font-mono text-slate-300 font-semibold tracking-wider">
                {p.year} // {p.status}
              </span>
            </div>

            <div className="p-6 space-y-4 flex-1 flex flex-col justify-between">
              <div className="space-y-3">
                <div className="flex flex-wrap gap-1.5">
                  {p.domains.slice(0, 2).map((dom) => (
                    <span
                      key={dom}
                      className="px-2 py-0.5 text-[10px] font-mono rounded bg-krs-surface border border-krs-border text-krs-cyan"
                    >
                      {dom}
                    </span>
                  ))}
                </div>

                <h2 className="font-display font-bold text-white text-xl group-hover:text-krs-cyan transition-colors leading-snug">
                  {p.title}
                </h2>

                <p className="text-slate-400 text-xs leading-relaxed line-clamp-3">
                  {p.shortDescription}
                </p>
              </div>

              <div className="pt-4 border-t border-krs-border/60 flex items-center justify-between">
                <div className="flex flex-wrap gap-1 text-[11px] font-mono text-slate-400">
                  <span>{p.technologies.slice(0, 2).join(', ')}</span>
                </div>
                <Link
                  href={`/projects/${p.slug}`}
                  className="inline-flex items-center gap-1 text-xs font-mono font-semibold text-krs-cyan hover:underline"
                >
                  Dossier <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
