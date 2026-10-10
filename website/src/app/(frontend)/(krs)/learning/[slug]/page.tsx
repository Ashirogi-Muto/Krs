import React from 'react'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { getResourceBySlug, getAllResources } from '@/lib/data/content'
import { constructMetadata } from '@/lib/seo/metadata'
import { fill } from '@/lib/form-texts-defaults'
import { BreadcrumbsJsonLd } from '@/lib/seo/structured-data'
import { ArrowLeft, Clock, User, Tag, BookOpen } from 'lucide-react'
import { getHiddenRoutes } from '@/lib/site-settings'
import { isVisibleIn } from '@/lib/visibility'
import { getFormTexts } from '@/lib/form-texts'
import { isSafeHref } from '@/payload/fields/common'

// Content comes from the CMS; re-read at most once a minute
export const revalidate = 60

export async function generateStaticParams() {
  const resources = await getAllResources()
  return resources.map((r) => ({ slug: r.slug }))
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const res = await getResourceBySlug(slug)
  if (!res) return {}

  return constructMetadata({
    title: fill((await getFormTexts()).seo.tabLearning, { title: res.title }),
    description: res.summary,
    path: `/learning/${res.slug}`,
  })
}

export default async function LearningDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const res = await getResourceBySlug(slug)
  if (!res) notFound()
  const L = (await getFormTexts()).learningPage // labels: CMS → Labels & messages → Learning resource page
  const ctaHref = isSafeHref(L.ctaHref) ? L.ctaHref : '/projects'

  return (
    <article className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16 space-y-10">
      <BreadcrumbsJsonLd
        items={[
          { name: 'Home', url: '/' },
          { name: 'Learning', url: '/learning' },
          { name: res.title, url: `/learning/${res.slug}` },
        ]}
      />

      <Link
        href="/learning"
        className="inline-flex items-center gap-2 text-xs font-mono text-slate-400 hover:text-krs-cyan transition-colors"
      >
        <ArrowLeft className="w-3.5 h-3.5" /> {L.back}
      </Link>

      <header className="space-y-4 border-b border-krs-border pb-8">
        <div className="flex flex-wrap items-center gap-3 text-xs font-mono">
          <span className="px-2.5 py-1 rounded bg-krs-surface text-krs-cyan border border-krs-border">
            {res.category}
          </span>
          <span className="text-slate-400 flex items-center gap-1">
            <Clock className="w-3 h-3" />
            {res.estimatedTime}
          </span>
          <span className="text-slate-400 uppercase font-semibold">
            {L.difficulty} {res.difficulty}
          </span>
        </div>

        <h1 className="text-3xl sm:text-4xl font-display font-extrabold text-white tracking-tight leading-tight">
          {res.title}
        </h1>

        <p className="text-slate-300 text-base leading-relaxed">
          {res.summary}
        </p>

        <div className="flex items-center gap-2 text-xs font-mono text-slate-400 pt-2">
          <User className="w-3.5 h-3.5 text-krs-cyan" />
          <span>Authored by {res.author}</span>
          <span>•</span>
          <span>Published {new Date(res.publishedAt).toLocaleDateString('en-IN', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
        </div>
      </header>

      {/* Main Technical Content */}
      <div className="prose prose-invert prose-cyan max-w-none space-y-6 text-slate-300 text-sm sm:text-base leading-relaxed">
        <div className="whitespace-pre-line font-sans">
          {res.content}
        </div>
      </div>

      {res.driveUrl && (
        <a
          href={res.driveUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-krs-cyan/10 border border-krs-cyan/40 text-krs-cyan text-xs font-mono font-semibold hover:bg-krs-cyan/20 transition-colors"
        >
          {L.drive}
        </a>
      )}

      {/* Tags & Internal Linking */}
      <footer className="pt-8 border-t border-krs-border space-y-6">
        <div className="flex flex-wrap items-center gap-2">
          <Tag className="w-3.5 h-3.5 text-slate-400" />
          {res.tags.map((tag) => (
            <span
              key={tag}
              className="px-2 py-0.5 text-xs font-mono bg-krs-surface border border-krs-border/80 text-slate-400 rounded"
            >
              #{tag}
            </span>
          ))}
        </div>

        <div className="p-6 rounded-xl bg-krs-surface border border-krs-border flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="space-y-1">
            <h2 className="font-display font-semibold text-white text-sm">
              {L.ctaTitle}
            </h2>
            <p className="text-xs text-slate-400">
              {L.ctaText}
            </p>
          </div>
{isVisibleIn(await getHiddenRoutes(), ctaHref) && (
          <Link
            href={ctaHref}
            className="px-4 py-2 rounded bg-krs-cyan text-black font-semibold text-xs font-mono uppercase hover:bg-cyan-400 transition-colors whitespace-nowrap"
          >
            {L.ctaButton}
          </Link>
          )}
        </div>
      </footer>
    </article>
  )
}
