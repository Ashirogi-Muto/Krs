import React from 'react'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { getProjectBySlug, getAllProjects } from '@/lib/data/content'
import { constructMetadata } from '@/lib/seo/metadata'
import { BreadcrumbsJsonLd } from '@/lib/seo/structured-data'
import {
  ArrowLeft,
  Cpu,
  Layers,
  CheckCircle2,
  Calendar,
  ExternalLink,
  Code2,
  Workflow,
  Video,
  FolderGit2,
} from 'lucide-react'

export async function generateStaticParams() {
  const projects = await getAllProjects()
  return projects.map((p) => ({ slug: p.slug }))
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const p = await getProjectBySlug(slug)
  if (!p) return {}

  return constructMetadata({
    title: `${p.title} | Engineering Project Dossier`,
    description: p.shortDescription,
    path: `/projects/${p.slug}`,
  })
}

export default async function ProjectDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const project = await getProjectBySlug(slug)
  if (!project) notFound()

  return (
    <article className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-16 space-y-12">
      <BreadcrumbsJsonLd
        items={[
          { name: 'Home', url: '/' },
          { name: 'Projects', url: '/projects' },
          { name: project.title, url: `/projects/${project.slug}` },
        ]}
      />

      <Link
        href="/projects"
        className="inline-flex items-center gap-2 text-xs font-mono text-slate-400 hover:text-krs-cyan transition-colors"
      >
        <ArrowLeft className="w-3.5 h-3.5" /> Back to Project Portfolio
      </Link>

      {/* Hero Dossier Header */}
      <header className="space-y-4 border-b border-krs-border pb-8">
        <div className="flex flex-wrap items-center gap-3 text-xs font-mono">
          <span className="px-3 py-1 rounded-full bg-cyan-950/60 border border-krs-cyan text-krs-cyan">
            Status: {project.status}
          </span>
          <span className="text-slate-400 flex items-center gap-1">
            <Calendar className="w-3.5 h-3.5" /> Year: {project.year}
          </span>
        </div>

        <h1 className="text-3xl sm:text-5xl font-display font-extrabold text-white tracking-tight leading-tight">
          {project.title}
        </h1>

        <p className="text-slate-300 text-base sm:text-lg leading-relaxed max-w-3xl">
          {project.description}
        </p>

        <div className="flex flex-wrap gap-2 pt-2">
          {project.domains.map((dom) => (
            <span
              key={dom}
              className="px-2.5 py-1 text-xs font-mono rounded bg-krs-surface border border-krs-border text-slate-300"
            >
              {dom}
            </span>
          ))}
        </div>

        {(project.demoUrl || project.videoUrl || project.driveUrl || project.githubUrl) && (
          <div className="flex flex-wrap items-center gap-3 pt-4 border-t border-krs-border/60">
            {project.videoUrl && (
              <a
                href={project.videoUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-amber-500/10 border border-amber-500/40 text-amber-400 text-xs font-mono font-semibold hover:bg-amber-500/20 transition-colors"
              >
                <Video className="w-3.5 h-3.5" />
                Watch Demonstration Video
              </a>
            )}
            {project.driveUrl && (
              <a
                href={project.driveUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-krs-cyan/10 border border-krs-cyan/40 text-krs-cyan text-xs font-mono font-semibold hover:bg-krs-cyan/20 transition-colors"
              >
                <FolderGit2 className="w-3.5 h-3.5" />
                Browse Photo & Chassis Archives
              </a>
            )}
            {project.githubUrl && (
              <a
                href={project.githubUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-krs-surface border border-krs-border text-slate-300 text-xs font-mono hover:text-white transition-colors"
              >
                <Code2 className="w-3.5 h-3.5" />
                Repository
              </a>
            )}
          </div>
        )}
      </header>

      {/* Engineering Subsystems Breakdown */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {project.hardwareSpecs && project.hardwareSpecs.length > 0 && (
          <div className="tech-card rounded-xl p-6 space-y-4">
            <div className="flex items-center gap-2 text-krs-cyan font-mono text-xs uppercase font-semibold">
              <Cpu className="w-4 h-4" />
              Hardware Architecture & Mechatronics
            </div>
            <ul className="space-y-2 text-xs sm:text-sm text-slate-300">
              {project.hardwareSpecs.map((spec) => (
                <li key={spec} className="flex items-start gap-2">
                  <span className="text-krs-cyan font-bold">•</span>
                  <span>{spec}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {project.softwareSpecs && project.softwareSpecs.length > 0 && (
          <div className="tech-card rounded-xl p-6 space-y-4">
            <div className="flex items-center gap-2 text-krs-cyan font-mono text-xs uppercase font-semibold">
              <Code2 className="w-4 h-4" />
              Software Perception & Kinematics
            </div>
            <ul className="space-y-2 text-xs sm:text-sm text-slate-300">
              {project.softwareSpecs.map((spec) => (
                <li key={spec} className="flex items-start gap-2">
                  <span className="text-krs-cyan font-bold">•</span>
                  <span>{spec}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* Validated Results & Benchmarks */}
      {project.results && (
        <section className="p-8 rounded-2xl bg-krs-surface border border-krs-border space-y-3">
          <div className="flex items-center gap-2 text-krs-cyan font-mono text-xs uppercase font-semibold">
            <CheckCircle2 className="w-4 h-4" />
            Empirical Validation & Field Trials
          </div>
          <h2 className="text-xl font-display font-bold text-white">
            Tested Operational Benchmarks
          </h2>
          <p className="text-slate-300 text-sm leading-relaxed">
            {project.results}
          </p>
        </section>
      )}

      {/* Technology Badges */}
      <section className="space-y-3 pt-4 border-t border-krs-border">
        <h3 className="text-xs font-mono text-slate-400 uppercase tracking-wider">
          Integrated Technologies & Stacks
        </h3>
        <div className="flex flex-wrap gap-2">
          {project.technologies.map((t) => (
            <span
              key={t}
              className="px-3 py-1 text-xs font-mono rounded bg-krs-dark border border-krs-border text-slate-300"
            >
              {t}
            </span>
          ))}
        </div>
      </section>

      {/* Related Actions */}
      <footer className="pt-8 border-t border-krs-border flex flex-col sm:flex-row items-center justify-between gap-4">
        <Link
          href="/learning"
          className="text-xs font-mono text-krs-cyan hover:underline flex items-center gap-1"
        >
          <Workflow className="w-3.5 h-3.5" /> Read related robotics tutorials
        </Link>
        <Link
          href="/aurix"
          className="px-5 py-2.5 rounded bg-aurix-surface border border-aurix-border text-aurix-orange text-xs font-mono uppercase font-semibold hover:border-aurix-orange transition-colors"
        >
          Compete in AURIX Competitions
        </Link>
      </footer>
    </article>
  )
}
