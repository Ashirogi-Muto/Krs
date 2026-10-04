import React from 'react'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { getBlogBySlug, getAllBlogs } from '@/lib/data/content'
import { constructMetadata } from '@/lib/seo/metadata'
import { BreadcrumbsJsonLd, BlogPostingJsonLd } from '@/lib/seo/structured-data'
import { ArrowLeft, Clock, Calendar, User, Tag } from 'lucide-react'
import { isVisibleIn } from '@/lib/visibility'
import { getFormTexts } from '@/lib/form-texts'
import { isSafeHref } from '@/payload/fields/common'
import { getHiddenRoutes } from '@/lib/site-settings'

// Content comes from the CMS; re-read at most once a minute
export const revalidate = 60

export async function generateStaticParams() {
  const blogs = await getAllBlogs()
  return blogs.map((b) => ({ slug: b.slug }))
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const blog = await getBlogBySlug(slug)
  if (!blog) return {}

  return constructMetadata({
    title: `${blog.title} | KRS Blog`,
    description: blog.summary,
    path: `/blogs/${blog.slug}`,
  })
}

export default async function BlogDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const hidden = await getHiddenRoutes()
  const isRouteVisible = (href: string) => isVisibleIn(hidden, href)
  const { slug } = await params
  const blog = await getBlogBySlug(slug)
  if (!blog) notFound()
  const L = (await getFormTexts()).blogPage // labels: CMS → Labels & messages → Blog post page
  const ctaHref = isSafeHref(L.ctaHref) ? L.ctaHref : '/join'

  return (
    <article className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16 space-y-10">
      <BlogPostingJsonLd post={blog} />
      <BreadcrumbsJsonLd
        items={[
          { name: 'Home', url: '/' },
          { name: 'Blogs', url: '/blogs' },
          { name: blog.title, url: `/blogs/${blog.slug}` },
        ]}
      />

      <Link
        href="/blogs"
        className="inline-flex items-center gap-2 text-xs font-mono text-slate-400 hover:text-krs-cyan transition-colors"
      >
        <ArrowLeft className="w-3.5 h-3.5" /> {L.back}
      </Link>

      <header className="space-y-4 border-b border-krs-border pb-8">
        <div className="flex flex-wrap items-center gap-3 text-xs font-mono">
          <span className="px-2.5 py-1 rounded bg-krs-surface text-krs-cyan border border-krs-border font-semibold">
            {blog.category}
          </span>
          <span className="text-slate-400 flex items-center gap-1">
            <Clock className="w-3 h-3" />
            {blog.readingTimeMinutes} {L.readLabel}
          </span>
          <span className="text-slate-400 flex items-center gap-1">
            <Calendar className="w-3 h-3" />
            {new Date(blog.publishedAt).toLocaleDateString('en-IN', {
              month: 'long',
              day: 'numeric',
              year: 'numeric',
            })}
          </span>
        </div>

        <h1 className="text-3xl sm:text-5xl font-display font-extrabold text-white tracking-tight leading-tight">
          {blog.title}
        </h1>

        <p className="text-slate-300 text-base sm:text-lg leading-relaxed">
          {blog.summary}
        </p>

        <div className="flex items-center gap-2 text-xs font-mono text-slate-400 pt-2">
          <User className="w-3.5 h-3.5 text-krs-cyan" />
          <span>By {blog.author}</span>
        </div>
      </header>

      {blog.coverImage && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={blog.coverImage} alt={blog.title} className="w-full max-h-[480px] object-cover rounded-2xl border border-krs-border" />
      )}

      {/* Main Content */}
      <div className="prose prose-invert prose-cyan max-w-none text-slate-300 text-sm sm:text-base leading-relaxed space-y-6">
        <div className="whitespace-pre-line font-sans">
          {blog.content}
        </div>
      </div>

      {/* Tags & Footer */}
      <footer className="pt-8 border-t border-krs-border space-y-6">
        <div className="flex flex-wrap items-center gap-2">
          <Tag className="w-3.5 h-3.5 text-slate-400" />
          {blog.tags.map((tag) => (
            <span
              key={tag}
              className="px-2.5 py-0.5 text-xs font-mono rounded bg-krs-surface border border-krs-border text-slate-400"
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
          {isRouteVisible(ctaHref) && (
            <Link
              href={ctaHref}
              className="px-5 py-2.5 rounded bg-krs-cyan text-black font-semibold text-xs font-mono uppercase hover:bg-cyan-400 transition-colors whitespace-nowrap"
            >
              {L.ctaButton}
            </Link>
          )}
        </div>
      </footer>
    </article>
  )
}
