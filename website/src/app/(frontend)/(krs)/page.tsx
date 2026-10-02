import React from 'react'
import Link from 'next/link'
import {
  Cpu,
  ArrowRight,
  Flame,
  Terminal,
  Trophy,
  BookOpen,
  Code,
  Compass,
  Layers,
  ChevronRight,
  Zap,
} from 'lucide-react'
import { getAllEvents } from '@/lib/data/events'
import {
  getAllProjects,
  getAllResources,
  getAllBlogs,
  getGeneralInfo,
} from '@/lib/data/content'
import { constructMetadata } from '@/lib/seo/metadata'
import { isVisibleIn } from '@/lib/visibility'
import { getHiddenRoutes } from '@/lib/site-settings'
import { getPageTexts } from '@/lib/page-texts'

// Re-read event data from the CMS at most once a minute
export const revalidate = 60

export const metadata = constructMetadata({
  title: 'Kalam Robotics Society | IILM University, Greater Noida',
  description:
    'Official engineering laboratory and robotics society of IILM University Greater Noida. Autonomous rovers, embedded firmware, computer vision, and the national AURIX competition platform.',
  path: '',
})

export default async function HomePage() {
  const t = await getPageTexts()
  const hidden = await getHiddenRoutes()
  const isRouteVisible = (href: string) => isVisibleIn(hidden, href)
  const [info, events, projects, resources, blogs] = await Promise.all([
    getGeneralInfo(),
    getAllEvents(),
    getAllProjects(),
    getAllResources(),
    getAllBlogs(),
  ])

  const aurixCompetitions = events.filter((e) => e.series === 'AURIX')
  const featuredProject = projects.find((p) => p.featured) || projects[0]

  return (
    <div className="space-y-24 md:space-y-32 pb-24">
      {/* 1. HERO SECTION */}
      <section className="relative min-h-[85vh] flex items-center justify-center pt-20 pb-16 px-4 sm:px-6 lg:px-8 bg-tech-grid overflow-hidden">
        {/* Subtle radial glow accent */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[350px] bg-krs-cyan/10 blur-[130px] rounded-full pointer-events-none" />

        <div className="max-w-5xl mx-auto text-center relative z-10 space-y-6">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-krs-surface border border-krs-border text-[11px] font-mono tracking-wider text-krs-cyan uppercase shadow-sm">
            <span className="w-2 h-2 rounded-full bg-krs-cyan animate-pulse" />
            {t.home.heroEyebrow}
          </div>

          <h1 className="text-4xl sm:text-6xl lg:text-7xl font-display font-extrabold tracking-tight text-white uppercase leading-[1.08]">
            KALAM ROBOTICS <br className="hidden sm:inline" />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-krs-cyan via-white to-krs-cyan">
              SOCIETY
            </span>
          </h1>

          <div className="flex items-center justify-center gap-3 sm:gap-6 text-xs sm:text-sm font-mono tracking-widest text-slate-400 font-semibold py-2">
            <span>LEARN.</span>
            <span className="text-krs-cyan">•</span>
            <span>BUILD.</span>
            <span className="text-krs-cyan">•</span>
            <span>COMPETE.</span>
            <span className="text-krs-cyan">•</span>
            <span>INNOVATE.</span>
          </div>

          <p className="max-w-2xl mx-auto text-slate-300 text-sm sm:text-base leading-relaxed">
            {t.home.heroIntro}
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
            <a
              href="#about"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-lg bg-krs-cyan text-black font-semibold text-sm hover:bg-cyan-400 transition-colors shadow-lg shadow-krs-cyan/20"
            >
              Explore KRS
              <ArrowRight className="w-4 h-4" />
            </a>
            <Link
              href="/aurix"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-lg bg-aurix-surface border border-aurix-border text-aurix-orange font-semibold text-sm hover:border-aurix-orange transition-all"
            >
              <Flame className="w-4 h-4 text-aurix-orange" />
              Enter AURIX Arena
            </Link>
          </div>
        </div>
      </section>

      {/* 2. KRS INTRODUCTION */}
      <section id="about" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 scroll-mt-24">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center tech-card rounded-2xl p-8 md:p-12">
          <div className="lg:col-span-7 space-y-4">
            <span className="text-xs font-mono text-krs-cyan uppercase tracking-wider">
              {t.home.aboutEyebrow}
            </span>
            <h2 className="text-2xl sm:text-3xl font-display font-bold text-white tracking-tight">
              {t.home.aboutTitle}
            </h2>
            <p className="text-slate-300 text-sm sm:text-base leading-relaxed">
              {info.about}
            </p>
            <div className="pt-2">
              {isRouteVisible('/insights') && (
                <Link
                  href="/insights"
                  className="inline-flex items-center gap-2 text-xs font-mono text-krs-cyan hover:underline"
                >
                  Read society constitution & history <ChevronRight className="w-3.5 h-3.5" />
                </Link>
              )}
            </div>
          </div>
          <div className="lg:col-span-5 bg-krs-dark/80 rounded-xl p-6 border border-krs-border space-y-4">
            <h3 className="text-xs font-mono text-slate-400 uppercase tracking-wider">
              {t.home.domainsTitle}
            </h3>
            <div className="flex flex-wrap gap-2">
              {info.domains.map((dom) => (
                <span
                  key={dom}
                  className="px-2.5 py-1 text-xs font-mono rounded bg-krs-surface border border-krs-border/80 text-slate-300"
                >
                  {dom}
                </span>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* 3. AURIX FLAGSHIP FEATURE */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="relative rounded-2xl bg-aurix-card border border-aurix-border p-8 md:p-12 overflow-hidden bg-aurix-grid">
          <div className="relative z-10 max-w-3xl space-y-4">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded bg-aurix-dark border border-aurix-border text-[11px] font-mono text-aurix-orange uppercase">
              <Flame className="w-3 h-3 text-aurix-orange animate-pulse" />
              {t.home.aurixEyebrow}
            </div>
            <h2 className="text-3xl sm:text-4xl font-display font-bold text-white tracking-tight">
              {t.home.aurixTitle}
            </h2>
            <p className="text-slate-300 text-sm sm:text-base leading-relaxed">
              {t.home.aurixIntro}
            </p>
            <div className="flex flex-wrap gap-4 pt-2">
              <Link
                href="/aurix"
                className="inline-flex items-center gap-2 px-6 py-2.5 rounded bg-aurix-orange text-black font-semibold text-xs font-mono uppercase hover:bg-orange-400 transition-colors"
              >
                {t.home.aurixButton}
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
              <Link
                href="/aurix/hackathon"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded bg-aurix-dark border border-aurix-border text-white text-xs font-mono uppercase hover:border-aurix-orange transition-colors"
              >
                {t.home.hackathonButton}
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* 4. WHAT WE DO */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        <div>
          <span className="text-xs font-mono text-krs-cyan uppercase tracking-wider">
            {t.home.pillarsEyebrow}
          </span>
          <h2 className="text-2xl sm:text-3xl font-display font-bold text-white tracking-tight mt-1">
            {t.home.pillarsTitle}
          </h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {info.pillars.map((pillar, idx) => (
            <div
              key={pillar.title}
              className="tech-card rounded-xl p-6 space-y-3"
            >
              <div className="w-10 h-10 rounded-lg bg-krs-surface border border-krs-border flex items-center justify-center text-krs-cyan">
                {idx === 0 && <Terminal className="w-5 h-5" />}
                {idx === 1 && <Trophy className="w-5 h-5" />}
                {idx === 2 && <BookOpen className="w-5 h-5" />}
                {idx === 3 && <Layers className="w-5 h-5" />}
              </div>
              <h3 className="font-display font-semibold text-white text-base">
                {pillar.title}
              </h3>
              <p className="text-slate-400 text-xs leading-relaxed">
                {pillar.description}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* 5. FEATURED PROJECT — YUVAAN */}
      {featuredProject && isRouteVisible('/projects') && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="tech-card rounded-2xl p-8 md:p-12 space-y-8 border-krs-border">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-krs-border/60 pb-6">
              <div>
                <span className="text-xs font-mono text-krs-cyan uppercase tracking-wider">
                  03 // Flagship Engineering Dossier
                </span>
                <h2 className="text-2xl sm:text-3xl font-display font-bold text-white tracking-tight mt-1">
                  {featuredProject.title}
                </h2>
              </div>
              <span className="self-start sm:self-auto px-3 py-1 text-xs font-mono rounded-full bg-cyan-950/60 border border-krs-cyan text-krs-cyan">
                Status: {featuredProject.status}
              </span>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
              <div className="lg:col-span-7 space-y-4">
                <p className="text-slate-300 text-sm leading-relaxed">
                  {featuredProject.description}
                </p>
                {featuredProject.results && (
                  <div className="p-4 rounded-lg bg-krs-surface border border-krs-border text-xs text-slate-300 space-y-1">
                    <span className="font-mono text-krs-cyan uppercase font-semibold">
                      Validated Benchmark:
                    </span>
                    <p>{featuredProject.results}</p>
                  </div>
                )}
                <div className="pt-2">
                  <Link
                    href={`/projects/${featuredProject.slug}`}
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded bg-krs-surface border border-krs-border text-krs-cyan text-xs font-mono font-semibold uppercase hover:border-krs-cyan transition-colors"
                  >
                    View Complete Case Study <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>

              <div className="lg:col-span-5 space-y-4">
                <div className="p-4 rounded-lg bg-krs-dark border border-krs-border space-y-2">
                  <span className="text-xs font-mono text-slate-400 uppercase tracking-wider block">
                    Hardware Subsystems
                  </span>
                  <ul className="text-xs text-slate-300 space-y-1.5 list-disc list-inside">
                    {featuredProject.hardwareSpecs?.map((spec) => (
                      <li key={spec}>{spec}</li>
                    ))}
                  </ul>
                </div>

                <div className="p-4 rounded-lg bg-krs-dark border border-krs-border space-y-2">
                  <span className="text-xs font-mono text-slate-400 uppercase tracking-wider block">
                    Software Perception Stack
                  </span>
                  <ul className="text-xs text-slate-300 space-y-1.5 list-disc list-inside">
                    {featuredProject.softwareSpecs?.map((spec) => (
                      <li key={spec}>{spec}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* 6. UPCOMING AURIX COMPETITIONS PREVIEW */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <span className="text-xs font-mono text-aurix-orange uppercase tracking-wider">
              04 // AURIX 2026 Series
            </span>
            <h2 className="text-2xl sm:text-3xl font-display font-bold text-white tracking-tight mt-1">
              Active Competitions
            </h2>
          </div>
          <Link
            href="/aurix"
            className="text-xs font-mono text-aurix-orange hover:underline inline-flex items-center gap-1"
          >
            All Competitions <ChevronRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {aurixCompetitions.slice(0, 3).map((comp) => (
            <div
              key={comp.id}
              className="aurix-card rounded-xl p-6 flex flex-col justify-between space-y-4"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between text-xs font-mono">
                  <span className="px-2 py-0.5 rounded bg-aurix-dark border border-aurix-border text-aurix-orange">
                    {comp.eventType}
                  </span>
                  <span className="text-slate-400 font-semibold">
                    {comp.comingSoon ? 'Coming Soon' : comp.registrationFee !== null ? `₹${comp.registrationFee} / team` : 'Registration Open'}
                  </span>
                </div>
                <h3 className="font-display font-bold text-white text-lg">
                  {comp.title}
                </h3>
                <p className="text-slate-400 text-xs line-clamp-3 leading-relaxed">
                  {comp.shortDescription}
                </p>
              </div>

              <div className="pt-4 border-t border-aurix-border/60 flex items-center justify-between">
                <span className="text-[11px] font-mono text-slate-400">
                  {comp.minTeamSize && comp.maxTeamSize
                    ? comp.minTeamSize === comp.maxTeamSize
                      ? `Exactly ${comp.minTeamSize} Members`
                      : `${comp.minTeamSize}–${comp.maxTeamSize} Members`
                    : comp.operatorCount
                    ? `${comp.operatorCount} Operator`
                    : 'Team'}
                </span>
                <Link
                  href={`/aurix/${comp.slug}`}
                  className="inline-flex items-center gap-1 text-xs font-mono text-aurix-orange font-semibold hover:underline"
                >
                  View Details <ChevronRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 7. KNOWLEDGE HUB PREVIEW */}
      {isRouteVisible('/learning') && (
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <span className="text-xs font-mono text-krs-cyan uppercase tracking-wider">
              05 // Knowledge Hub
            </span>
            <h2 className="text-2xl sm:text-3xl font-display font-bold text-white tracking-tight mt-1">
              Robotics Tutorials & Engineering Articles
            </h2>
          </div>
          <Link
            href="/learning"
            className="text-xs font-mono text-krs-cyan hover:underline inline-flex items-center gap-1"
          >
            All Resources <ChevronRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {resources.slice(0, 3).map((res) => (
            <Link
              key={res.id}
              href={`/learning/${res.slug}`}
              className="tech-card rounded-xl p-6 flex flex-col justify-between space-y-4 group"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between text-[11px] font-mono">
                  <span className="px-2 py-0.5 rounded bg-krs-surface text-krs-cyan border border-krs-border">
                    {res.category}
                  </span>
                  <span className="text-slate-400">{res.estimatedTime}</span>
                </div>
                <h3 className="font-display font-bold text-white text-base group-hover:text-krs-cyan transition-colors">
                  {res.title}
                </h3>
                <p className="text-slate-400 text-xs line-clamp-3 leading-relaxed">
                  {res.summary}
                </p>
              </div>

              <div className="pt-4 border-t border-krs-border/60 flex items-center justify-between text-[11px] font-mono text-slate-400">
                <span>By {res.author}</span>
                <span className="text-krs-cyan uppercase">{res.difficulty}</span>
              </div>
            </Link>
          ))}
        </div>
      </section>
      )}

      {/* 8. LATEST BLOGS PREVIEW */}
      {isRouteVisible('/blogs') && (
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <span className="text-xs font-mono text-krs-cyan uppercase tracking-wider">
              06 // Society Dispatch
            </span>
            <h2 className="text-2xl sm:text-3xl font-display font-bold text-white tracking-tight mt-1">
              Latest Engineering Blogs & Stories
            </h2>
          </div>
          <Link
            href="/blogs"
            className="text-xs font-mono text-krs-cyan hover:underline inline-flex items-center gap-1"
          >
            All Blogs <ChevronRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {blogs.slice(0, 2).map((blog) => (
            <Link
              key={blog.id}
              href={`/blogs/${blog.slug}`}
              className="tech-card rounded-xl p-6 flex flex-col justify-between space-y-4 group"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between text-[11px] font-mono">
                  <span className="text-krs-cyan uppercase">{blog.category}</span>
                  <span className="text-slate-400">{blog.readingTimeMinutes} min read</span>
                </div>
                <h3 className="font-display font-bold text-white text-lg group-hover:text-krs-cyan transition-colors">
                  {blog.title}
                </h3>
                <p className="text-slate-400 text-xs leading-relaxed line-clamp-2">
                  {blog.summary}
                </p>
              </div>

              <div className="pt-4 border-t border-krs-border/60 text-[11px] font-mono text-slate-400 flex items-center justify-between">
                <span>{blog.author}</span>
                <span>{new Date(blog.publishedAt).toLocaleDateString('en-IN', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
              </div>
            </Link>
          ))}
        </div>
      </section>
      )}

      {isRouteVisible('/join') && (
        <>
          {/* 9. JOIN KRS CTA */}
          <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="tech-card rounded-2xl p-8 md:p-14 text-center space-y-6 relative overflow-hidden bg-tech-grid">
              <div className="max-w-2xl mx-auto space-y-3">
                <span className="text-xs font-mono text-krs-cyan uppercase tracking-wider">
                  Recruitment // Season 2026–2027
                </span>
                <h2 className="text-3xl sm:text-4xl font-display font-extrabold text-white tracking-tight">
                  Build the Future of Cyber-Physical Systems
                </h2>
                <p className="text-slate-300 text-sm leading-relaxed">
                  KRS welcomes passionate developers, hardware enthusiasts, roboticists, and CAD designers across all academic years at IILM University.
                </p>
              </div>
              <div className="pt-2">
                            <Link
                  href="/join"
                  className="inline-flex items-center gap-2 px-8 py-3.5 rounded-lg bg-krs-cyan text-black font-semibold text-sm font-mono uppercase hover:bg-cyan-400 transition-colors shadow-lg shadow-krs-cyan/25"
                >
                  Apply to Join KRS
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </div>
          </section>
        </>
      )}
    </div>
  )
}
