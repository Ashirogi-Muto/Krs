import React from 'react'
import { NO_CMS, cmsRef, type Cms } from '@/lib/cms-attrs'
import Link from 'next/link'
import { ArrowRight, ChevronRight, Sparkles, ShieldCheck, Cpu, Terminal } from 'lucide-react'
import { getAllEvents, withoutHiddenEvents } from '@/lib/data/events'
import { getAllBlogs, getAllProjects, getAllResources } from '@/lib/data/content'
import { optimizedSrc } from '@/lib/img'
import { formatINR } from '@/lib/format'
import { getHiddenRoutes } from '@/lib/site-settings'
import { isVisibleIn } from '@/lib/visibility'
import { SectionHeader, container } from './shared'
import { getFormTexts } from '@/lib/form-texts'

/** Case-study style box of one project (KRS home "flagship dossier") - elevated with blurred background image & HUD aesthetics. */
export async function FeaturedProjectBlock({ b, cms = NO_CMS }: { b: any; cms?: Cms }) {
  const projects = await getAllProjects()
  const chosen = b.project && typeof b.project === 'object' ? String(b.project.slug || '') : ''
  const p = (chosen && projects.find((x) => x.slug === chosen)) || projects.find((x) => x.featured) || projects[0]
  if (!p) return null
  const showLink = isVisibleIn(await getHiddenRoutes(), `/projects/${p.slug}`)

  return (
    <section id={b.anchor || undefined} {...cms()} className={`${container} py-4 sm:py-6 scroll-mt-24`}>
      <div className="relative rounded-3xl p-6 sm:p-8 md:p-12 border border-krs-cyan/35 hover:border-krs-cyan/60 shadow-[0_20px_70px_rgba(0,0,0,0.8),inset_0_0_60px_rgba(6,182,212,0.06)] overflow-hidden transition-all duration-500 group reveal">
        {/* ── Elevated Blurred Background Image & Atmosphere ── */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none select-none">
          {p.coverImage && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={optimizedSrc(p.coverImage, 1080)}
              alt=""
              className="w-full h-full object-cover object-center scale-110 filter blur-xl md:blur-2xl opacity-35 group-hover:scale-115 group-hover:opacity-40 transition-all duration-1000 ease-out"
            />
          )}
          {/* Deep cyber dark gradient overlay for optimal readability */}
          <div className="absolute inset-0 bg-gradient-to-r from-[#070a12]/95 via-[#091124]/90 to-[#070a12]/85" />
          <div className="absolute inset-0 bg-gradient-to-t from-[#070a12] via-transparent to-[#070a12]/75" />
          {/* Ambient Cybernetic Radial Glows */}
          <div className="absolute -top-32 -left-32 w-80 h-80 rounded-full blur-[100px] bg-krs-cyan/20" />
          <div className="absolute -bottom-32 -right-32 w-80 h-80 rounded-full blur-[100px] bg-blue-600/15" />
          <div className="absolute inset-0 bg-tech-grid opacity-20" />
        </div>

        {/* ── Corner Tech Accent Brackets ── */}
        <div className="absolute top-3 left-3 w-7 h-7 border-t-2 border-l-2 border-krs-cyan/60 pointer-events-none z-20" />
        <div className="absolute top-3 right-3 w-7 h-7 border-t-2 border-r-2 border-krs-cyan/60 pointer-events-none z-20" />
        <div className="absolute bottom-3 left-3 w-7 h-7 border-b-2 border-l-2 border-krs-cyan/60 pointer-events-none z-20" />
        <div className="absolute bottom-3 right-3 w-7 h-7 border-b-2 border-r-2 border-krs-cyan/60 pointer-events-none z-20" />

        {/* ── Dossier Header with Status Pill ── */}
        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-6 mb-8">
          <div>
            {b.eyebrow && (
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-krs-cyan/10 border border-krs-cyan/30 text-krs-cyan text-[11px] font-mono uppercase tracking-widest mb-2 shadow-[0_0_12px_rgba(6,182,212,0.15)]">
                <Sparkles className="w-3 h-3 text-krs-cyan animate-pulse" />
                <span {...cms('eyebrow')}>{b.eyebrow}</span>
              </div>
            )}
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-display font-extrabold text-white tracking-tight leading-tight mt-0.5">
              {p.title}
            </h2>
          </div>

          <div className="self-start sm:self-auto inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-cyan-950/80 border border-krs-cyan/50 text-cyan-300 font-mono text-xs font-semibold tracking-wider shadow-[0_0_15px_rgba(6,182,212,0.25)] backdrop-blur-md">
            <span className="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.9)] animate-pulse" />
            <span>
              {b.statusLabel ? `${b.statusLabel} ` : ''}
              {p.status}
            </span>
          </div>
        </div>

        {/* ── Main Content Grid ── */}
        <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left Column: Mission Description, Benchmark & CTA */}
          <div className="lg:col-span-7 space-y-5">
            {p.coverImage && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={optimizedSrc(p.coverImage, 640)}
                alt={p.title}
                loading="lazy"
                className="w-full h-56 sm:h-64 object-cover rounded-2xl border border-krs-cyan/25 shadow-[0_8px_25px_rgba(0,0,0,0.5)]"
              />
            )}
            <p className="text-slate-200 text-sm sm:text-base leading-relaxed font-normal">
              {p.description}
            </p>

            {p.results && (
              <div className="relative p-5 rounded-2xl bg-[#0d162a]/80 border border-krs-cyan/35 backdrop-blur-md space-y-2 shadow-[0_8px_25px_rgba(0,0,0,0.5)] group-hover:border-krs-cyan/60 transition-colors">
                {b.benchmarkLabel && (
                  <div className="flex items-center gap-2 text-krs-cyan font-mono font-bold text-xs uppercase tracking-wider">
                    <ShieldCheck className="w-4 h-4 text-krs-cyan" />
                    <span {...cms('benchmarkLabel')}>{b.benchmarkLabel}</span>
                  </div>
                )}
                <p className="text-xs sm:text-sm text-slate-300 leading-relaxed font-normal">
                  {p.results}
                </p>
              </div>
            )}

            {b.buttonLabel && showLink && (
              <div className="pt-2">
                <Link
                  href={`/projects/${p.slug}`}
                  className="inline-flex items-center gap-2.5 px-6 py-3 rounded-xl bg-gradient-to-r from-blue-600 via-krs-cyan to-cyan-300 hover:from-blue-500 hover:to-cyan-200 text-black text-xs font-mono font-bold uppercase tracking-wider transition-all shadow-[0_0_20px_rgba(6,182,212,0.35)] hover:shadow-[0_0_30px_rgba(6,182,212,0.6)] btn-shimmer group"
                >
                  <span>{b.buttonLabel}</span>
                  <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                </Link>
              </div>
            )}
          </div>

          {/* Right Column: Hardware & Software Specification HUD Panels */}
          <div className="lg:col-span-5 space-y-4">
            {/* Hardware Specifications */}
            {p.hardwareSpecs && p.hardwareSpecs.length > 0 && (
              <div className="p-5 rounded-2xl bg-[#0c1326]/85 border border-white/10 hover:border-krs-cyan/40 backdrop-blur-md space-y-3 transition-all duration-300 shadow-[0_8px_25px_rgba(0,0,0,0.35)] group">
                <div className="flex items-center gap-2">
                  <Cpu className="w-4 h-4 text-krs-cyan" />
                  <span className="text-xs font-mono text-cyan-300 uppercase tracking-wider font-semibold">
                    {b.hardwareTitle}
                  </span>
                </div>
                <ul className="space-y-2 text-xs text-slate-200 leading-relaxed">
                  {p.hardwareSpecs.map((spec) => (
                    <li key={spec} className="flex items-start gap-2.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-krs-cyan mt-1.5 shrink-0 shadow-[0_0_6px_rgba(6,182,212,0.8)]" />
                      <span>{spec}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Software Perception Stack */}
            {p.softwareSpecs && p.softwareSpecs.length > 0 && (
              <div className="p-5 rounded-2xl bg-[#0c1326]/85 border border-white/10 hover:border-blue-400/40 backdrop-blur-md space-y-3 transition-all duration-300 shadow-[0_8px_25px_rgba(0,0,0,0.35)] group">
                <div className="flex items-center gap-2">
                  <Terminal className="w-4 h-4 text-blue-400" />
                  <span className="text-xs font-mono text-blue-300 uppercase tracking-wider font-semibold">
                    {b.softwareTitle}
                  </span>
                </div>
                <ul className="space-y-2 text-xs text-slate-200 leading-relaxed">
                  {p.softwareSpecs.map((spec) => (
                    <li key={spec} className="flex items-start gap-2.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-blue-400 mt-1.5 shrink-0 shadow-[0_0_6px_rgba(96,165,250,0.8)]" />
                      <span>{spec}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  )
}

/** "Exactly 5 Members" / "1–3 Members" (with a prefix: "Team: 5 Members"), "1 Operator", or the fallback. */
export function teamLine(e: any, prefix: string, fallback: string) {
  if (e.minTeamSize && e.maxTeamSize) {
    if (e.minTeamSize === e.maxTeamSize) return prefix ? `${prefix}${e.minTeamSize} Members` : `Exactly ${e.minTeamSize} Members`
    return `${prefix}${e.minTeamSize}–${e.maxTeamSize} Members`
  }
  return e.operatorCount ? `${e.operatorCount} Operator` : fallback
}

/** AURIX competition cards, live from Events. */
export async function EventCardsBlock({ b, cms = NO_CMS }: { b: any; cms?: Cms }) {
  // Open competitions first; "coming soon" ones after them (stable otherwise: start date, then creation order)
  let events = (await withoutHiddenEvents(await getAllEvents()))
    .filter((e) => e.series === 'AURIX')
    .sort((x, y) => Number(Boolean(x.comingSoon)) - Number(Boolean(y.comingSoon)))
  if (b.featuredOnly) events = events.filter((e) => e.featured)
  events = events.slice(0, b.limit || 3)
  const large = b.variant === 'large'
  const texts = await getFormTexts()
  return (
    <section id={b.anchor || undefined} {...cms()} className={`${container} space-y-8`}>
      <SectionHeader cms={cms} eyebrow={b.eyebrow} title={b.title} intro={b.intro} linkLabel={b.linkLabel} linkHref={b.linkHref} theme="aurix" />
      <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 ${large ? 'gap-8' : 'gap-6'}`}>
        {events.map((comp) => (
          <div
            key={comp.id}
            {...cmsRef(cms !== NO_CMS, 'events', comp.id)}
            className={`aurix-card flex flex-col justify-between group reveal ${large ? 'rounded-2xl p-6 sm:p-8 space-y-6' : 'rounded-xl p-6 space-y-4'}`}
          >
            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs font-mono">
                <span className={`rounded bg-aurix-dark border border-aurix-border text-aurix-orange ${large ? 'px-2.5 py-0.5 font-bold' : 'px-2 py-0.5'}`}>
                  {comp.eventType}
                </span>
                <span className={large ? 'text-slate-300 font-bold' : 'text-slate-400 font-semibold'}>
                  {comp.comingSoon ? texts.general.comingSoon : comp.registrationFee !== null ? `₹${comp.registrationFee}${b.feeSuffix || ''}` : texts.general.registrationOpen}
                </span>
              </div>
              <h3
                className={
                  large
                    ? 'font-display font-extrabold text-white text-xl sm:text-2xl group-hover:text-aurix-orange transition-colors leading-snug'
                    : 'font-display font-bold text-white text-lg'
                }
              >
                {comp.title}
              </h3>
              {b.showPrizePool && comp.prizePool ? (
                <div className="text-xs font-mono font-bold text-aurix-orange">
                  {b.prizeLabel || 'Prize pool'} {formatINR(comp.prizePool)}
                </div>
              ) : null}
              <p className={`text-slate-400 leading-relaxed line-clamp-3 ${large ? 'text-xs sm:text-sm' : 'text-xs'}`}>{comp.shortDescription}</p>
            </div>
            <div className="pt-4 border-t border-aurix-border/60 flex items-center justify-between">
              <span className="text-[11px] font-mono text-slate-400">
                {teamLine(comp, b.teamPrefix || '', b.teamFallback || 'Team')}
              </span>
              <Link
                href={`/aurix/${comp.slug}`}
                className={`inline-flex items-center gap-1.5 text-xs font-mono text-aurix-orange hover:underline ${large ? 'font-bold' : 'font-semibold'}`}
              >
                {b.buttonLabel || 'View Details'} {large ? <ArrowRight className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
              </Link>
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}

/** Latest learning resources with continuous auto-scrolling horizontal marquee. */
export async function ResourceCardsBlock({ b, cms = NO_CMS }: { b: any; cms?: Cms }) {
  // Cards link to the resource pages: none when Learning is hidden
  if (!isVisibleIn(await getHiddenRoutes(), '/learning')) return null
  const allResources = await getAllResources()
  if (!allResources || allResources.length === 0) return null

  // Create an extended repeating list for seamless loop (at least 6-8 items per track half)
  const baseList = allResources.length < 4
    ? [...allResources, ...allResources, ...allResources]
    : allResources.length < 6
    ? [...allResources, ...allResources]
    : allResources

  // Duplicate for infinite seamless marquee loop
  const marqueeItems = [...baseList, ...baseList]

  return (
    <section id={b.anchor || undefined} {...cms()} className="w-full py-4 space-y-6 overflow-hidden">
      <div className={container}>
        <SectionHeader
          cms={cms}
          eyebrow={b.eyebrow}
          title={b.title}
          intro={b.intro}
          linkLabel={b.linkLabel}
          linkHref={b.linkHref}
        />
      </div>

      {/* ── Infinite Horizontal Auto-Scroll Marquee ── */}
      <div className="marquee-container relative w-full overflow-hidden py-3">
        {/* Left & Right Edge Fade Gradients */}
        <div className="absolute left-0 top-0 bottom-0 w-16 sm:w-28 md:w-36 bg-gradient-to-r from-krs-dark via-krs-dark/80 to-transparent z-10 pointer-events-none" />
        <div className="absolute right-0 top-0 bottom-0 w-16 sm:w-28 md:w-36 bg-gradient-to-l from-krs-dark via-krs-dark/80 to-transparent z-10 pointer-events-none" />

        {/* Scrolling Track */}
        <div className="animate-marquee flex gap-5 sm:gap-6 px-4">
          {marqueeItems.map((res, idx) => {
            const initials = res.author
              ? res.author
                  .split(' ')
                  .map((w) => w[0])
                  .filter(Boolean)
                  .slice(0, 2)
                  .join('')
              : 'KR'

            return (
              <Link
                key={`${res.id}-${idx}`}
                href={`/learning/${res.slug}`}
                className="w-[310px] sm:w-[350px] md:w-[370px] shrink-0 rounded-2xl bg-[#0c1322]/90 border border-white/10 hover:border-krs-cyan/60 p-5 sm:p-6 flex flex-col justify-between group transition-all duration-300 hover:-translate-y-1 shadow-lg hover:shadow-[0_0_25px_rgba(6,182,212,0.2)] backdrop-blur-xl select-none"
                {...cmsRef(cms !== NO_CMS, 'resources', res.id)}
              >
                <div className="space-y-3">
                  {/* Category Pill & Reading Time */}
                  <div className="flex items-center justify-between text-[11px] font-mono">
                    <span className="px-2.5 py-0.5 rounded-full bg-krs-cyan/15 text-krs-cyan border border-krs-cyan/30 font-semibold tracking-wide">
                      {res.category}
                    </span>
                    <span className="text-slate-400 font-mono text-xs">{res.estimatedTime}</span>
                  </div>

                  {/* Title */}
                  <h3 className="font-display font-bold text-white text-base sm:text-lg group-hover:text-cyan-300 transition-colors line-clamp-2 leading-snug">
                    {res.title}
                  </h3>

                  {/* Summary */}
                  <p className="text-slate-400 text-xs sm:text-[13px] line-clamp-3 leading-relaxed font-normal">
                    {res.summary}
                  </p>
                </div>

                {/* Bottom Author Row (Alumni reference style) */}
                <div className="pt-4 mt-3 border-t border-white/10 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-krs-cyan/30 to-blue-600/30 border border-krs-cyan/40 flex items-center justify-center text-[10px] font-bold text-krs-cyan shrink-0">
                      {initials}
                    </div>
                    <div className="min-w-0">
                      <p className="text-white text-xs font-semibold truncate leading-tight">
                        {b.byLabel ? `${b.byLabel} ` : ''}
                        {res.author}
                      </p>
                      <p className="text-[10px] font-mono text-krs-cyan uppercase tracking-wider mt-0.5 truncate">
                        {[res.difficulty, res.resourceType].filter(Boolean).join(' // ')}
                      </p>
                    </div>
                  </div>

                  <ChevronRight className="w-4 h-4 text-slate-500 group-hover:text-krs-cyan group-hover:translate-x-1 transition-all shrink-0" />
                </div>
              </Link>
            )
          })}
        </div>
      </div>
    </section>
  )
}

/** Latest blog posts - styled with full-bleed photo cards, dark bottom gradient overlay, and gold category tags matching the reference. */
export async function BlogCardsBlock({ b, cms = NO_CMS }: { b: any; cms?: Cms }) {
  // Cards link to the posts: none when Blogs is hidden
  if (!isVisibleIn(await getHiddenRoutes(), '/blogs')) return null
  const blogs = (await getAllBlogs()).slice(0, b.limit || 3)
  if (!blogs || blogs.length === 0) return null

  // Posts without a cover get a neutral illustration (not a photo that looks like it belongs to the post)
  const fallbackImages = ['/images/robotics-board.webp', '/images/hero-robot.webp']

  return (
    <section id={b.anchor || undefined} {...cms()} className={`${container} space-y-8 py-6`}>
      <SectionHeader
        cms={cms}
        eyebrow={b.eyebrow}
        title={b.title}
        intro={b.intro}
        linkLabel={b.linkLabel}
        linkHref={b.linkHref}
      />
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
        {blogs.map((blog, idx) => {
          const coverImg = optimizedSrc(blog.coverImage, 640) || fallbackImages[idx % fallbackImages.length]
          return (
            <Link
              key={blog.id}
              href={`/blogs/${blog.slug}`}
              className="relative rounded-3xl overflow-hidden min-h-[440px] sm:min-h-[480px] flex flex-col justify-end p-6 sm:p-7 border border-white/10 hover:border-krs-cyan/50 shadow-[0_14px_45px_rgba(0,0,0,0.7)] hover:shadow-[0_18px_60px_rgba(6,182,212,0.25)] transition-all duration-500 group reveal"
              {...cmsRef(cms !== NO_CMS, 'posts', blog.id)}
            >
              {/* Full-Bleed Background Image with Smooth Hover Zoom */}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={coverImg}
                alt={blog.title}
                className="absolute inset-0 w-full h-full object-cover object-center group-hover:scale-110 transition-transform duration-700 ease-out"
                loading="lazy"
              />

              {/* Multi-layered Dark Bottom Gradient Overlay (Matches Reference) */}
              <div className="absolute inset-0 bg-gradient-to-t from-black via-black/85 via-50% to-transparent" />
              <div className="absolute inset-0 bg-black/20 group-hover:bg-transparent transition-colors duration-500" />

              {/* Top Read-Time Pill */}
              <div className="absolute top-5 right-5 z-10 px-3 py-1 rounded-full bg-black/70 backdrop-blur-md border border-white/15 text-[11px] font-mono text-slate-300 shadow-md">
                {blog.readingTimeMinutes} {b.readLabel || 'min read'}
              </div>

              {/* Overlaid Content at Bottom (Exact Reference Typography) */}
              <div className="relative z-10 space-y-2.5">
                {/* Gold/Amber Eyebrow Tag with Wide Tracking */}
                <span className="text-[11px] font-mono font-bold tracking-[0.2em] uppercase text-amber-400 block drop-shadow-sm">
                  {blog.category || 'TECHNICAL DISPATCH'}
                </span>

                {/* Bold White Title */}
                <h3 className="font-display font-extrabold text-white text-xl sm:text-2xl leading-snug tracking-tight group-hover:text-cyan-300 transition-colors line-clamp-2">
                  {blog.title}
                </h3>

                {/* Excerpt / Summary */}
                <p className="text-slate-300 text-xs sm:text-[13px] leading-relaxed line-clamp-3 font-normal">
                  {blog.summary}
                </p>

                {/* Subtle Author & Date Line */}
                <div className="pt-3.5 border-t border-white/15 flex items-center justify-between text-[11px] font-mono text-slate-400">
                  <span className="truncate max-w-[170px]">{blog.author}</span>
                  <span>
                    {new Date(blog.publishedAt).toLocaleDateString('en-IN', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                    })}
                  </span>
                </div>
              </div>
            </Link>
          )
        })}
      </div>
    </section>
  )
}
