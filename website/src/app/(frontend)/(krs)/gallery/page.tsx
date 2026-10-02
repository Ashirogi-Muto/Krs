import React from 'react'
import { constructMetadata } from '@/lib/seo/metadata'
import { BreadcrumbsJsonLd } from '@/lib/seo/structured-data'
import Link from 'next/link'
import { Camera, Image as ImageIcon, ExternalLink, Video, FolderGit2 } from 'lucide-react'
import { getGalleryAlbums } from '@/lib/data/content'
import { GALLERY_CATEGORIES } from '@/lib/data/seed-gallery'
import { getPageTexts } from '@/lib/page-texts'

export const metadata = constructMetadata({
  title: 'Lab & Field Gallery | Kalam Robotics Society',
  description:
    'Visual documentation of robotic prototypes, workbench hardware, field trials, workshops, and national competition milestones at IILM University Greater Noida.',
  path: '/gallery',
})

const CATEGORIES = ['All', ...GALLERY_CATEGORIES]

// Albums come from the CMS (Website → Gallery albums); re-read at most once a minute
export const revalidate = 60

export default async function GalleryPage({ searchParams }: { searchParams: Promise<{ category?: string }> }) {
  const t = await getPageTexts()
  const { category } = await searchParams
  const active = CATEGORIES.includes(category as any) ? (category as string) : 'All'
  const albums = (await getGalleryAlbums()).filter((a) => active === 'All' || a.category === active)
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 space-y-12">
      <BreadcrumbsJsonLd
        items={[
          { name: 'Home', url: '/' },
          { name: 'Gallery', url: '/gallery' },
        ]}
      />

      <div className="space-y-4">
        <span className="text-xs font-mono text-krs-cyan uppercase tracking-wider">
          {t.gallery.eyebrow}
        </span>
        <h1 className="text-3xl sm:text-5xl font-display font-extrabold text-white tracking-tight">
          {t.gallery.title}
        </h1>
        <p className="text-slate-400 text-sm sm:text-base max-w-2xl leading-relaxed">
          {t.gallery.intro}
        </p>
      </div>

      {/* Category Pills */}
      <div className="flex flex-wrap gap-2 pt-2 border-b border-krs-border pb-6">
        {CATEGORIES.map((cat) => (
          <Link
            key={cat}
            href={cat === 'All' ? '/gallery' : `/gallery?category=${encodeURIComponent(cat)}`}
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

      {/* Gallery Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {albums.length === 0 && <p className="text-sm text-slate-400">No albums in this category yet.</p>}
        {albums.map((item) => (
          <div
            key={item.id}
            className="tech-card rounded-xl overflow-hidden group flex flex-col justify-between"
          >
            {/* Visual Canvas Representation */}
            {item.coverImage ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={item.coverImage} alt={item.title} className="h-48 w-full object-cover border-b border-krs-border" loading="lazy" />
            ) : (
            <div className="h-48 bg-gradient-to-br from-krs-surface via-[#131d36] to-krs-dark border-b border-krs-border flex flex-col items-center justify-center p-6 text-center relative overflow-hidden">
              <div className="w-12 h-12 rounded-xl bg-krs-card border border-krs-border flex items-center justify-center text-krs-cyan mb-2 group-hover:scale-110 transition-transform">
                {item.type === 'video' ? (
                  <Video className="w-6 h-6 text-krs-amber" />
                ) : (
                  <Camera className="w-6 h-6" />
                )}
              </div>
              <span className="text-[10px] font-mono text-slate-400 uppercase tracking-widest">
                {item.category} // {item.type}
              </span>
            </div>
            )}

            <div className="p-5 space-y-3 flex-1 flex flex-col justify-between">
              <div className="space-y-2">
                <div className="flex items-center justify-between text-[11px] font-mono text-slate-400">
                  <span className="text-krs-cyan uppercase font-semibold">{item.category}</span>
                  <span>{item.date}</span>
                </div>
                <h3 className="font-display font-semibold text-white text-base">
                  {item.title}
                </h3>
                <p className="text-slate-400 text-xs leading-relaxed">
                  {item.caption}
                </p>
              </div>

              <div className="pt-3 border-t border-krs-border/60">
                <a
                  href={item.driveUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-xs font-mono text-krs-cyan hover:text-white hover:underline transition-colors"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  {item.type === 'video' ? 'Watch Demonstration Footage' : 'View Media in Google Drive'}
                </a>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
