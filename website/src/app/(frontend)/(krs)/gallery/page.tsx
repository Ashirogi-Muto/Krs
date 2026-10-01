import React from 'react'
import { constructMetadata } from '@/lib/seo/metadata'
import { BreadcrumbsJsonLd } from '@/lib/seo/structured-data'
import { Camera, Image as ImageIcon, ExternalLink, Video, FolderGit2 } from 'lucide-react'

export const metadata = constructMetadata({
  title: 'Lab & Field Gallery | Kalam Robotics Society',
  description:
    'Visual documentation of robotic prototypes, workbench hardware, field trials, workshops, and national competition milestones at IILM University Greater Noida.',
  path: '/gallery',
})

const CATEGORIES = [
  'All',
  'Projects',
  'Competitions',
  'Workshops',
  'Lab Workbench',
]

interface GalleryItem {
  id: string
  title: string
  category: string
  caption: string
  date: string
  driveUrl: string
  type: 'album' | 'video'
}

const GALLERY_ITEMS: GalleryItem[] = [
  {
    id: 'gal-robo-soccer',
    title: 'Robo Soccer Ignite Tournament & Arena Shoot',
    category: 'Competitions',
    caption: 'Official photo and video capture from the Robo Soccer matches during the Ignite tournament showcase.',
    date: 'September 2026',
    driveUrl: 'https://drive.google.com/drive/folders/1-q426Z-Jg61gmAh5BOufhORnx-S3Yu0h',
    type: 'album',
  },
  {
    id: 'gal-yuvaan-shoot',
    title: 'YUVAAN Rover Field Deployment & Studio Shoot',
    category: 'Projects',
    caption: 'High-resolution media demonstrating autonomous obstacle traversal, suspension articulation, and field testing.',
    date: 'September 2026',
    driveUrl: 'https://drive.google.com/drive/folders/1QsGqOYEl74GQf6-7QUabIin1JUmXwNi4',
    type: 'album',
  },
  {
    id: 'gal-yuvaan-video',
    title: 'YUVAAN Autonomous Rover Demonstration (Footage)',
    category: 'Projects',
    caption: 'Video recording (IMG_1550.MOV) capturing waypoint navigation and real-time obstacle avoidance on rough ground.',
    date: 'September 2026',
    driveUrl: 'https://drive.google.com/file/d/1r5rKUX6gWxMVRjp5J95fIx2z4eJ0jB_q/view?usp=drivesdk',
    type: 'video',
  },
  {
    id: 'gal-yuvaan-pics',
    title: 'YUVAAN Complete Prototyping & Fabrication Archives',
    category: 'Projects',
    caption: 'Comprehensive photo archives documenting the mechanical fabrication, rocker-bogie assembly, and custom PCB wiring.',
    date: 'August 2026',
    driveUrl: 'https://drive.google.com/drive/folders/144vtl7deSoZVAXahZVVJ3mtEGDgLXdTS',
    type: 'album',
  },
  {
    id: 'gal-arduino-workshop',
    title: 'Arduino Robotics & Microcontrollers Workshop 2026',
    category: 'Workshops',
    caption: 'Hands-on laboratory training, sensor interfacing, and motor control workshops conducted with student inductees.',
    date: 'August 2026',
    driveUrl: 'https://drive.google.com/drive/folders/18BG_Ux6AUhkzdO3hkphNTnHninjbJlpU',
    type: 'album',
  },
  {
    id: 'gal-lab-workbench',
    title: 'Robotics Laboratory & Hardware Prototyping Sessions',
    category: 'Lab Workbench',
    caption: 'Workbench soldering, oscilloscope sensor diagnostics, 3D printing runs, and firmware flash sessions inside the KRS lab.',
    date: 'July 2026',
    driveUrl: 'https://drive.google.com/drive/folders/1kSf19bTtn0jfwrAyg81ZBgPOqtuBOQ1x',
    type: 'album',
  },
  {
    id: 'gal-workshops-archive',
    title: 'Technical Workshops & Hackathon Project Archives',
    category: 'Workshops',
    caption: 'Archival media from student project presentations, robotics ideathons, and mentorship sessions.',
    date: 'June 2026',
    driveUrl: 'https://drive.google.com/drive/folders/1X2Z8WaqNmAqcB0M8Gvy64ZNhgYYcu8Pp',
    type: 'album',
  },
]

export default function GalleryPage() {
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
          Visual Archives // Laboratory & Field
        </span>
        <h1 className="text-3xl sm:text-5xl font-display font-extrabold text-white tracking-tight">
          Engineering in Motion
        </h1>
        <p className="text-slate-400 text-sm sm:text-base max-w-2xl leading-relaxed">
          Authoritative visual documentation of prototypes, laboratory experimentation, tournament competitions, and workshops conducted by Kalam Robotics Society.
        </p>
      </div>

      {/* Category Pills */}
      <div className="flex flex-wrap gap-2 pt-2 border-b border-krs-border pb-6">
        {CATEGORIES.map((cat, idx) => (
          <button
            key={cat}
            type="button"
            className={`px-3.5 py-1.5 rounded-full text-xs font-mono transition-colors ${
              idx === 0
                ? 'bg-krs-cyan text-black font-semibold shadow-sm'
                : 'bg-krs-surface border border-krs-border text-slate-300 hover:text-white hover:border-slate-600'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Gallery Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {GALLERY_ITEMS.map((item) => (
          <div
            key={item.id}
            className="tech-card rounded-xl overflow-hidden group flex flex-col justify-between"
          >
            {/* Visual Canvas Representation */}
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
