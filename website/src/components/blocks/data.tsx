import React from 'react'
import Link from 'next/link'
import { ArrowRight, ChevronRight } from 'lucide-react'
import { getAllEvents, withoutHiddenEvents } from '@/lib/data/events'
import { getAllBlogs, getAllProjects, getAllResources } from '@/lib/data/content'
import { optimizedSrc } from '@/lib/img'
import { formatINR } from '@/lib/format'
import { getHiddenRoutes } from '@/lib/site-settings'
import { isVisibleIn } from '@/lib/visibility'
import { SectionHeader, container } from './shared'

/** Case-study style box of one project (KRS home "flagship dossier"). */
export async function FeaturedProjectBlock({ b }: { b: any }) {
  const projects = await getAllProjects()
  const chosen = b.project && typeof b.project === 'object' ? String(b.project.slug || '') : ''
  const p = (chosen && projects.find((x) => x.slug === chosen)) || projects.find((x) => x.featured) || projects[0]
  if (!p) return null
  const showLink = isVisibleIn(await getHiddenRoutes(), `/projects/${p.slug}`)
  return (
    <section id={b.anchor || undefined} className={container}>
      <div className="tech-card rounded-2xl p-8 md:p-12 space-y-8 border-krs-border">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-krs-border/60 pb-6">
          <div>
            {b.eyebrow && <span className="text-xs font-mono text-krs-cyan uppercase tracking-wider">{b.eyebrow}</span>}
            <h2 className="text-2xl sm:text-3xl font-display font-bold text-white tracking-tight mt-1">{p.title}</h2>
          </div>
          <span className="self-start sm:self-auto px-3 py-1 text-xs font-mono rounded-full bg-cyan-950/60 border border-krs-cyan text-krs-cyan">
            {b.statusLabel ? `${b.statusLabel} ` : ''}
            {p.status}
          </span>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div className="lg:col-span-7 space-y-4">
            <p className="text-slate-300 text-sm leading-relaxed">{p.description}</p>
            {p.results && (
              <div className="p-4 rounded-lg bg-krs-surface border border-krs-border text-xs text-slate-300 space-y-1">
                {b.benchmarkLabel && <span className="font-mono text-krs-cyan uppercase font-semibold">{b.benchmarkLabel}</span>}
                <p>{p.results}</p>
              </div>
            )}
            {b.buttonLabel && showLink && (
              <div className="pt-2">
                <Link
                  href={`/projects/${p.slug}`}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded bg-krs-surface border border-krs-border text-krs-cyan text-xs font-mono font-semibold uppercase hover:border-krs-cyan transition-colors"
                >
                  {b.buttonLabel} <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            )}
          </div>
          <div className="lg:col-span-5 space-y-4">
            {p.coverImage && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={optimizedSrc(p.coverImage, 640)} alt={p.title} className="w-full h-56 object-cover rounded-lg border border-krs-border" loading="lazy" />
            )}
            {[
              { title: b.hardwareTitle, list: p.hardwareSpecs },
              { title: b.softwareTitle, list: p.softwareSpecs },
            ]
              .filter((s) => s.list?.length)
              .map((s, i) => (
                <div key={i} className="p-4 rounded-lg bg-krs-dark border border-krs-border space-y-2">
                  {s.title && <span className="text-xs font-mono text-slate-400 uppercase tracking-wider block">{s.title}</span>}
                  <ul className="text-xs text-slate-300 space-y-1.5 list-disc list-inside">
                    {s.list!.map((spec) => (
                      <li key={spec}>{spec}</li>
                    ))}
                  </ul>
                </div>
              ))}
          </div>
        </div>
      </div>
    </section>
  )
}

/** "Exactly 5 Members" / "1–3 Members" (with a prefix: "Team: 5 Members"), "1 Operator", or the fallback. */
function teamLine(e: any, prefix: string, fallback: string) {
  if (e.minTeamSize && e.maxTeamSize) {
    if (e.minTeamSize === e.maxTeamSize) return prefix ? `${prefix}${e.minTeamSize} Members` : `Exactly ${e.minTeamSize} Members`
    return `${prefix}${e.minTeamSize}–${e.maxTeamSize} Members`
  }
  return e.operatorCount ? `${e.operatorCount} Operator` : fallback
}

/** AURIX competition cards, live from Events. */
export async function EventCardsBlock({ b }: { b: any }) {
  // Open competitions first; "coming soon" ones after them (stable otherwise: start date, then creation order)
  let events = (await withoutHiddenEvents(await getAllEvents()))
    .filter((e) => e.series === 'AURIX')
    .sort((x, y) => Number(Boolean(x.comingSoon)) - Number(Boolean(y.comingSoon)))
  if (b.featuredOnly) events = events.filter((e) => e.featured)
  events = events.slice(0, b.limit || 3)
  const large = b.variant === 'large'
  return (
    <section id={b.anchor || undefined} className={`${container} space-y-8`}>
      <SectionHeader eyebrow={b.eyebrow} title={b.title} intro={b.intro} linkLabel={b.linkLabel} linkHref={b.linkHref} theme="aurix" />
      <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 ${large ? 'gap-8' : 'gap-6'}`}>
        {events.map((comp) => (
          <div
            key={comp.id}
            className={`aurix-card flex flex-col justify-between group ${large ? 'rounded-2xl p-6 sm:p-8 space-y-6' : 'rounded-xl p-6 space-y-4'}`}
          >
            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs font-mono">
                <span className={`rounded bg-aurix-dark border border-aurix-border text-aurix-orange ${large ? 'px-2.5 py-0.5 font-bold' : 'px-2 py-0.5'}`}>
                  {comp.eventType}
                </span>
                <span className={large ? 'text-slate-300 font-bold' : 'text-slate-400 font-semibold'}>
                  {comp.comingSoon ? 'Coming Soon' : comp.registrationFee !== null ? `₹${comp.registrationFee}${b.feeSuffix || ''}` : 'Registration Open'}
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

/** Latest learning resources. */
export async function ResourceCardsBlock({ b }: { b: any }) {
  // Cards link to the resource pages: none when Learning is hidden
  if (!isVisibleIn(await getHiddenRoutes(), '/learning')) return null
  const resources = (await getAllResources()).slice(0, b.limit || 3)
  return (
    <section id={b.anchor || undefined} className={`${container} space-y-8`}>
      <SectionHeader eyebrow={b.eyebrow} title={b.title} intro={b.intro} linkLabel={b.linkLabel} linkHref={b.linkHref} />
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {resources.map((res) => (
          <Link key={res.id} href={`/learning/${res.slug}`} className="tech-card rounded-xl p-6 flex flex-col justify-between space-y-4 group">
            <div className="space-y-3">
              <div className="flex items-center justify-between text-[11px] font-mono">
                <span className="px-2 py-0.5 rounded bg-krs-surface text-krs-cyan border border-krs-border">{res.category}</span>
                <span className="text-slate-400">{res.estimatedTime}</span>
              </div>
              <h3 className="font-display font-bold text-white text-base group-hover:text-krs-cyan transition-colors">{res.title}</h3>
              <p className="text-slate-400 text-xs line-clamp-3 leading-relaxed">{res.summary}</p>
            </div>
            <div className="pt-4 border-t border-krs-border/60 flex items-center justify-between text-[11px] font-mono text-slate-400">
              <span>
                {b.byLabel ? `${b.byLabel} ` : ''}
                {res.author}
              </span>
              <span className="text-krs-cyan uppercase">{res.difficulty}</span>
            </div>
          </Link>
        ))}
      </div>
    </section>
  )
}

/** Latest blog posts. */
export async function BlogCardsBlock({ b }: { b: any }) {
  // Cards link to the posts: none when Blogs is hidden
  if (!isVisibleIn(await getHiddenRoutes(), '/blogs')) return null
  const blogs = (await getAllBlogs()).slice(0, b.limit || 2)
  return (
    <section id={b.anchor || undefined} className={`${container} space-y-8`}>
      <SectionHeader eyebrow={b.eyebrow} title={b.title} intro={b.intro} linkLabel={b.linkLabel} linkHref={b.linkHref} />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {blogs.map((blog) => (
          <Link key={blog.id} href={`/blogs/${blog.slug}`} className="tech-card rounded-xl p-6 flex flex-col justify-between space-y-4 group">
            {blog.coverImage && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={optimizedSrc(blog.coverImage, 640)} alt={blog.title} className="h-40 w-full object-cover rounded-lg border border-krs-border" loading="lazy" />
            )}
            <div className="space-y-3">
              <div className="flex items-center justify-between text-[11px] font-mono">
                <span className="text-krs-cyan uppercase">{blog.category}</span>
                <span className="text-slate-400">
                  {blog.readingTimeMinutes} {b.readLabel || 'min read'}
                </span>
              </div>
              <h3 className="font-display font-bold text-white text-lg group-hover:text-krs-cyan transition-colors">{blog.title}</h3>
              <p className="text-slate-400 text-xs leading-relaxed line-clamp-2">{blog.summary}</p>
            </div>
            <div className="pt-4 border-t border-krs-border/60 text-[11px] font-mono text-slate-400 flex items-center justify-between">
              <span>{blog.author}</span>
              <span>{new Date(blog.publishedAt).toLocaleDateString('en-IN', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
            </div>
          </Link>
        ))}
      </div>
    </section>
  )
}
