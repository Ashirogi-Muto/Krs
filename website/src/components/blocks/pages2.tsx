import React from 'react'
import Link from 'next/link'
import { ArrowRight, Calendar, ChevronRight, Clock, Cpu, MapPin } from 'lucide-react'
import { getAllEvents } from '@/lib/data/events'
import { getAllBlogs, getAllProjects, getAllResources, getGalleryAlbums, getTeamMembers } from '@/lib/data/content'
import { formatDateRange } from '@/lib/format'
import { optimizedSrc } from '@/lib/img'
import { TEAM_GROUP_OPTIONS } from '@/lib/data/team-groups'
import { BlockIcon, CmsLink, SectionHeader, accentText, container } from './shared'
import { CmsForm } from './CmsForm'
import { AurixMark } from '@/components/aurix/AurixMark'
import { getFormTexts } from '@/lib/form-texts'

type Ctx = { b: any; query?: Record<string, any>; path?: string; index?: number }
type Btn = { label: string; href: string; style?: string }

/** The page's main heading (h1) with small line and intro. */
export function PageHeaderBlock({ b }: Ctx) {
  const center = b.align === 'center'
  const link = b.introLinkLabel && b.introLinkHref
  return (
    <div id={b.anchor || undefined} className={container}>
      <div className={`space-y-4 ${center ? 'text-center max-w-3xl mx-auto' : 'max-w-3xl'}`}>
        {b.eyebrow && <span className={`text-xs font-mono uppercase tracking-wider ${accentText(b.theme)}`}>{b.eyebrow}</span>}
        {b.title && <h1 className="text-3xl sm:text-5xl font-display font-extrabold text-white tracking-tight">{b.title}</h1>}
        {(b.intro || link) && (
          <p className={`text-sm sm:text-base leading-relaxed whitespace-pre-line ${center ? 'text-slate-300 max-w-2xl mx-auto' : 'text-slate-400'}`}>
            {b.intro}
            {link && (
              <>
                {b.intro ? ' ' : ''}
                <CmsLink href={b.introLinkHref} className={`hover:underline ${accentText(b.theme)}`}>
                  {b.introLinkLabel}
                </CmsLink>
                {b.introAfter}
              </>
            )}
          </p>
        )}
      </div>
    </div>
  )
}

/** Category pills (decorative: the first one is highlighted). */
export function Pills({ items }: { items: string[] }) {
  if (!items.length) return null
  return (
    <div className="flex flex-wrap gap-2 border-b border-krs-border pb-6">
      {items.map((cat, idx) => (
        <span
          key={cat + idx}
          className={`px-3.5 py-1.5 rounded-full text-xs font-mono transition-colors ${
            idx === 0 ? 'bg-krs-cyan text-black font-semibold' : 'bg-krs-surface border border-krs-border text-slate-300'
          }`}
        >
          {cat}
        </span>
      ))}
    </div>
  )
}
const pillItems = (b: any): string[] => (b.pills || []).map((p: any) => p.item).filter(Boolean)

export function PillsBlock({ b }: Ctx) {
  return (
    <div id={b.anchor || undefined} className={container}>
      <Pills items={pillItems(b)} />
    </div>
  )
}

export async function ProjectGridBlock({ b }: Ctx) {
  const projects = await getAllProjects()
  return (
    <section id={b.anchor || undefined} className={`${container} space-y-8`}>
      <SectionHeader eyebrow={b.eyebrow} title={b.title} intro={b.intro} />
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {projects.map((p) => (
          <div key={p.id} className="tech-card rounded-2xl overflow-hidden flex flex-col justify-between group">
            {p.coverImage ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={optimizedSrc(p.coverImage, 640)} alt={p.title} className="h-48 w-full object-cover border-b border-krs-border" loading="lazy" />
            ) : (
            <div className="h-48 bg-gradient-to-br from-krs-surface via-[#141e38] to-krs-dark border-b border-krs-border flex flex-col items-center justify-center p-6 text-center relative overflow-hidden">
              <div className="w-12 h-12 rounded-xl bg-krs-card border border-krs-border flex items-center justify-center text-krs-cyan mb-2 group-hover:scale-110 transition-transform">
                <Cpu className="w-6 h-6" />
              </div>
              <span className="text-xs font-mono text-slate-300 font-semibold tracking-wider">
                {p.year} // {p.status}
              </span>
            </div>
            )}
            <div className="p-6 space-y-4 flex-1 flex flex-col justify-between">
              <div className="space-y-3">
                <div className="flex flex-wrap gap-1.5">
                  {p.domains.slice(0, 2).map((dom) => (
                    <span key={dom} className="px-2 py-0.5 text-[10px] font-mono rounded bg-krs-surface border border-krs-border text-krs-cyan">
                      {dom}
                    </span>
                  ))}
                </div>
                <h2 className="font-display font-bold text-white text-xl group-hover:text-krs-cyan transition-colors leading-snug">{p.title}</h2>
                <p className="text-slate-400 text-xs leading-relaxed line-clamp-3">{p.shortDescription}</p>
              </div>
              <div className="pt-4 border-t border-krs-border/60 flex items-center justify-between">
                <div className="flex flex-wrap gap-1 text-[11px] font-mono text-slate-400">
                  <span>{p.technologies.slice(0, 2).join(', ')}</span>
                </div>
                <Link href={`/projects/${p.slug}`} className="inline-flex items-center gap-1 text-xs font-mono font-semibold text-krs-cyan hover:underline">
                  {b.buttonLabel || 'Dossier'} <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}

export async function ResourceGridBlock({ b }: Ctx) {
  const resources = await getAllResources()
  return (
    <section id={b.anchor || undefined} className={`${container} space-y-12`}>
      <SectionHeader eyebrow={b.eyebrow} title={b.title} intro={b.intro} />
      <Pills items={pillItems(b)} />
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {resources.map((res) => (
          <Link key={res.id} href={`/learning/${res.slug}`} className="tech-card rounded-xl p-6 flex flex-col justify-between space-y-5 group">
            <div className="space-y-3">
              <div className="flex items-center justify-between text-[11px] font-mono">
                <span className="px-2.5 py-0.5 rounded bg-krs-surface text-krs-cyan border border-krs-border">{res.category}</span>
                <span className="flex items-center gap-1 text-slate-400">
                  <Clock className="w-3 h-3" />
                  {res.estimatedTime}
                </span>
              </div>
              <h2 className="font-display font-bold text-white text-lg group-hover:text-krs-cyan transition-colors leading-snug">{res.title}</h2>
              <p className="text-slate-400 text-xs leading-relaxed line-clamp-3">{res.summary}</p>
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
    </section>
  )
}

export async function BlogGridBlock({ b }: Ctx) {
  const blogs = await getAllBlogs()
  return (
    <section id={b.anchor || undefined} className={`${container} space-y-12`}>
      <SectionHeader eyebrow={b.eyebrow} title={b.title} intro={b.intro} />
      <Pills items={pillItems(b)} />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {blogs.map((post) => (
          <Link key={post.id} href={`/blogs/${post.slug}`} className="tech-card rounded-2xl p-6 md:p-8 flex flex-col justify-between space-y-6 group">
            {post.coverImage && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={optimizedSrc(post.coverImage, 640)} alt={post.title} className="h-48 w-full object-cover rounded-lg border border-krs-border" loading="lazy" />
            )}
            <div className="space-y-3">
              <div className="flex items-center justify-between text-[11px] font-mono">
                <span className="text-krs-cyan uppercase font-semibold">{post.category}</span>
                <span className="flex items-center gap-1 text-slate-400">
                  <Clock className="w-3 h-3" />
                  {post.readingTimeMinutes} {b.readLabel || 'min read'}
                </span>
              </div>
              <h2 className="font-display font-bold text-white text-xl sm:text-2xl group-hover:text-krs-cyan transition-colors leading-snug">{post.title}</h2>
              <p className="text-slate-400 text-xs sm:text-sm leading-relaxed line-clamp-3">{post.summary}</p>
            </div>
            <div className="pt-4 border-t border-krs-border/60 flex items-center justify-between text-xs font-mono text-slate-400">
              <span>{post.author}</span>
              <span className="flex items-center gap-1 text-krs-cyan font-semibold">
                {b.readMoreLabel || 'Read Article'} <ChevronRight className="w-3.5 h-3.5" />
              </span>
            </div>
          </Link>
        ))}
      </div>
    </section>
  )
}

/** Gallery: a grid of photos (owner, 7 Oct 2026) with a working category filter (?category=…). */
export async function GalleryGridBlock({ b, query = {}, path = '/gallery' }: Ctx) {
  const all = await getGalleryAlbums()
  const used = Array.from(new Set(all.map((a) => a.category).filter(Boolean))) as string[]
  const chosen: string[] = (b.categories || []).map((c: any) => c.item).filter(Boolean)
  const categories = chosen.length ? chosen : used
  const allLabel = b.allLabel || 'All'
  const requested = typeof query.category === 'string' ? query.category : ''
  const active = categories.includes(requested) ? requested : allLabel
  const albums = all.filter((a) => active === allLabel || a.category === active)
  const photos = albums.flatMap((a) => a.photos.map((p, i) => ({ ...p, key: `${a.id}-${i}`, title: a.title, caption: a.caption })))
  return (
    <section id={b.anchor || undefined} className={`${container} space-y-12`}>
      <SectionHeader eyebrow={b.eyebrow} title={b.title} intro={b.intro} />
      {b.showFilter !== false && categories.length > 0 && (
        <div className="flex flex-wrap gap-2 pt-2 border-b border-krs-border pb-6">
          {[allLabel, ...categories].map((cat) => (
            <Link
              key={cat}
              href={cat === allLabel ? path : `${path}?category=${encodeURIComponent(cat)}`}
              className={`px-3.5 py-1.5 rounded-full text-xs font-mono transition-colors ${
                cat === active
                  ? 'bg-krs-cyan text-black font-semibold shadow-sm'
                  : 'bg-krs-surface border border-krs-border text-slate-300 hover:text-white hover:border-slate-600'
              }`}
            >
              {cat}
            </Link>
          ))}
        </div>
      )}
      {photos.length === 0 ? (
        <p className="text-sm text-slate-400">{b.emptyText || 'No photos in this category yet.'}</p>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2 sm:gap-3">
          {photos.map((p) => (
            <a
              key={p.key}
              href={p.url}
              target="_blank"
              rel="noopener noreferrer"
              className="group relative block aspect-square overflow-hidden rounded-lg border border-krs-border bg-krs-surface"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={optimizedSrc(p.url, 640)}
                alt={p.alt}
                loading="lazy"
                className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
              />
              {(p.title || p.caption) && (
                <span className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/85 via-black/50 to-transparent p-3 opacity-0 transition-opacity duration-200 group-hover:opacity-100 group-focus-visible:opacity-100">
                  {p.title && <span className="block font-display text-sm font-semibold text-white">{p.title}</span>}
                  {p.caption && <span className="mt-0.5 block text-[11px] leading-snug text-slate-300 line-clamp-2">{p.caption}</span>}
                </span>
              )}
            </a>
          ))}
        </div>
      )}
    </section>
  )
}

/** Big AURIX banner with live dates (KRS events page). */
export async function EventBannerBlock({ b }: Ctx) {
  let dates = ''
  if (b.showDates !== false) {
    const aurix = (await getAllEvents()).filter((e) => e.series === 'AURIX')
    const start = aurix.map((e) => e.startDate).filter(Boolean).sort()[0]
    const end = aurix.map((e) => e.endDate).filter(Boolean).sort().slice(-1)[0]
    dates = start ? formatDateRange(start, end, 'long') : (await getFormTexts()).general.datesTbaInText
  }
  return (
    <section id={b.anchor || undefined} className={container}>
      <div className="relative rounded-2xl bg-aurix-card border-2 border-aurix-orange/80 p-8 sm:p-12 overflow-hidden bg-aurix-grid shadow-2xl shadow-aurix-orange/10">
        <div className="relative z-10 max-w-3xl space-y-5">
          {b.badge && (
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded bg-aurix-dark border border-aurix-border text-xs font-mono text-aurix-orange uppercase font-semibold">
              <AurixMark className="w-4 h-4" />
              {b.badge}
            </div>
          )}
          {b.title && <h2 className="text-3xl sm:text-5xl font-display font-extrabold text-white tracking-tight leading-tight">{b.title}</h2>}
          {b.text && <p className="text-slate-300 text-sm sm:text-base leading-relaxed whitespace-pre-line">{b.text}</p>}
          {(dates || b.venue) && (
            <div className="flex flex-wrap items-center gap-4 text-xs font-mono text-slate-300 pt-2">
              {dates && (
                <span className="flex items-center gap-1.5 bg-aurix-dark px-3 py-1.5 rounded border border-aurix-border">
                  <Calendar className="w-4 h-4 text-aurix-orange" />
                  {dates}
                </span>
              )}
              {b.venue && (
                <span className="flex items-center gap-1.5 bg-aurix-dark px-3 py-1.5 rounded border border-aurix-border">
                  <MapPin className="w-4 h-4 text-aurix-orange" />
                  {b.venue}
                </span>
              )}
            </div>
          )}
          {(b.buttons || []).length > 0 && (
            <div className="pt-4 flex flex-wrap gap-4">
              {(b.buttons as Btn[]).map((btn) =>
                (btn.style || 'primary') === 'primary' ? (
                  <CmsLink
                    key={btn.href + btn.label}
                    href={btn.href}
                    className="inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-aurix-orange text-black font-semibold text-xs font-mono uppercase hover:bg-orange-400 transition-colors shadow-lg"
                  >
                    {btn.label} <ArrowRight className="w-4 h-4" />
                  </CmsLink>
                ) : (
                  <CmsLink
                    key={btn.href + btn.label}
                    href={btn.href}
                    className="inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-aurix-dark border border-aurix-border text-white text-xs font-mono uppercase hover:border-aurix-orange transition-colors"
                  >
                    {btn.label}
                  </CmsLink>
                ),
              )}
            </div>
          )}
        </div>
      </div>
    </section>
  )
}

/** Members from People, grouped. */
export async function TeamGridBlock({ b }: Ctx) {
  const members = await getTeamMembers()
  // The groups named in this section first (their order and headings), then every other group that has published
  // people, so nobody disappears because their group was never added to the section
  const named: { group: string; title: string }[] = (b.groups || []).filter((g: any) => g?.group)
  const groups = [
    ...named,
    ...TEAM_GROUP_OPTIONS.filter((o) => !named.some((g) => g.group === o.value) && members.some((m) => m.teamGroup === o.value)).map((o) => ({
      group: o.value,
      title: o.label,
    })),
  ]
  return (
    <section id={b.anchor || undefined} className={`${container} space-y-16`}>
      <SectionHeader eyebrow={b.eyebrow} title={b.title} intro={b.intro} />
      {groups.map(({ group, title }) => {
        const list = members.filter((m) => m.teamGroup === group)
        if (!list.length) return null
        return (
          <div key={group} className="space-y-6">
            <div className="border-b border-krs-border pb-3 flex items-center justify-between">
              <h2 className="text-xl sm:text-2xl font-display font-bold text-white tracking-tight">{title}</h2>
              <span className="text-xs font-mono text-slate-500">
                {list.length} {list.length === 1 ? b.memberSingular || 'Member' : b.memberPlural || 'Members'}
              </span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {list.map((m) => (
                <div key={m.id} className="tech-card rounded-xl p-6 flex flex-col justify-between space-y-4 group">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between text-[11px] font-mono">
                      <span className="text-krs-cyan uppercase">{m.teamGroup}</span>
                      {m.startYear && (
                        <span className="text-slate-500">
                          {m.endYear ? `${m.startYear}–${m.endYear}` : `${b.sinceLabel || 'Since'} ${m.startYear}`}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-4">
                      {m.photo && (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={optimizedSrc(m.photo, 128)} alt={m.name} className="w-16 h-16 rounded-full object-cover border border-krs-border shrink-0" loading="lazy" />
                      )}
                      <div>
                        <h3 className="font-display font-bold text-white text-lg group-hover:text-krs-cyan transition-colors">{m.name}</h3>
                        <p className="text-slate-300 text-xs font-mono mt-0.5">{m.role}</p>
                        <p className="text-slate-500 text-[11px] font-mono">{m.department}</p>
                      </div>
                    </div>
                    {m.bio && <p className="text-slate-400 text-xs leading-relaxed">{m.bio}</p>}
                  </div>
                  <div className="pt-4 border-t border-krs-border/60 text-[11px] font-mono text-slate-500 flex items-center justify-between">
                    <span>
                      {b.statusLabel || 'Status:'} {m.active ? b.activeLabel || 'Active' : b.alumniLabel || 'Alumni'}
                    </span>
                    <span className="flex items-center gap-3">
                      {m.linkedin && (
                        <a href={m.linkedin} target="_blank" rel="noopener noreferrer" className="text-slate-400 hover:text-krs-cyan" aria-label={`${m.name} on LinkedIn`}>
                          LinkedIn
                        </a>
                      )}
                      {m.github && (
                        <a href={m.github} target="_blank" rel="noopener noreferrer" className="text-slate-400 hover:text-krs-cyan" aria-label={`${m.name} on GitHub`}>
                          GitHub
                        </a>
                      )}
                      {b.footerText && !m.linkedin && !m.github && <span className="text-slate-400">{b.footerText}</span>}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )
      })}
    </section>
  )
}

export function TimelineBlock({ b }: Ctx) {
  const items = (b.items || []).filter((i: any) => i?.title)
  return (
    <section id={b.anchor || undefined} className={`${container} space-y-8`}>
      <SectionHeader eyebrow={b.eyebrow} title={b.title} intro={b.intro} />
      <div className="relative border-l-2 border-krs-border ml-4 sm:ml-6 space-y-10 pl-6 sm:pl-8">
        {items.map((item: any, i: number) => (
          <div key={`${item.year}-${i}`} className="relative group">
            <div className="absolute -left-[31px] sm:-left-[39px] top-1 w-4 h-4 rounded-full bg-krs-dark border-2 border-krs-cyan" />
            <div className="space-y-1">
              {item.year && <span className="text-xs font-mono text-krs-cyan font-semibold">{item.year}</span>}
              <h3 className="font-display font-bold text-white text-lg">{item.title}</h3>
              {item.description && <p className="text-slate-400 text-xs sm:text-sm max-w-2xl leading-relaxed">{item.description}</p>}
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}

export function NoticeBlock({ b }: Ctx) {
  return (
    <section id={b.anchor || undefined} className={container}>
      <div className="p-8 rounded-2xl bg-krs-surface border border-krs-border space-y-4">
        {b.label && (
          <div className="flex items-center gap-2 text-krs-cyan font-mono text-xs uppercase">
            <BlockIcon name={b.icon || 'shield'} className="w-4 h-4" />
            {b.label}
          </div>
        )}
        {b.title && <h2 className="text-xl font-display font-bold text-white">{b.title}</h2>}
        {b.text && <p className="text-slate-300 text-xs sm:text-sm leading-relaxed max-w-3xl whitespace-pre-line">{b.text}</p>}
      </div>
    </section>
  )
}

/** A CMS-built form; with contact details it becomes a two-column layout (contact page). */
export async function FormBlock({ b, path = '/', index = 0 }: Ctx) {
  const items = (b.contactItems || []).filter((c: any) => c?.title)
  const selectPlaceholder = (await getFormTexts()).general.selectPlaceholder
  const form = (
    <CmsForm
      selectPlaceholder={selectPlaceholder}
      path={path}
      block={b.id ? String(b.id) : `i:${index}`}
      fields={(b.fields || []).filter((f: any) => f?.label)}
      submitLabel={b.submitLabel}
      sendingLabel={b.sendingLabel}
      successTitle={b.successTitle}
      successText={b.successText}
    />
  )
  return (
    <section id={b.anchor || undefined} className={`${container} space-y-8`}>
      <SectionHeader eyebrow={b.eyebrow} title={b.title} intro={b.intro} />
      {items.length ? (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div className="lg:col-span-5 space-y-6">
            <div className="tech-card rounded-2xl p-6 space-y-4">
              {items.map((c: any, i: number) => (
                <div key={i} className={`flex items-start gap-3 ${i ? 'pt-4 border-t border-krs-border/60' : ''}`}>
                  <div className="w-10 h-10 rounded-lg bg-krs-surface border border-krs-border flex items-center justify-center text-krs-cyan shrink-0">
                    <BlockIcon name={c.icon} className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="font-display font-bold text-white text-base">{c.title}</h2>
                    {c.text && <p className="text-slate-300 text-xs sm:text-sm mt-1 leading-relaxed whitespace-pre-line">{c.text}</p>}
                    {c.highlight && <p className="text-krs-cyan text-xs font-mono font-semibold mt-0.5 break-all">{c.highlight}</p>}
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="lg:col-span-7">{form}</div>
        </div>
      ) : (
        form
      )}
    </section>
  )
}
