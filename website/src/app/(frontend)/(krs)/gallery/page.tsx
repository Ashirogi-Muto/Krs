import React from 'react'
import { constructMetadata } from '@/lib/seo/metadata'
import { BreadcrumbsJsonLd } from '@/lib/seo/structured-data'
import { Camera, Image as ImageIcon } from 'lucide-react'

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
  'Team',
]

const GALLERY_ITEMS = [
  {
    id: 'gal-1',
    title: 'YUVAAN Rover Field Testing',
    category: 'Projects',
    caption: 'Outdoor terrain navigation and obstacle avoidance testing on rough gravel.',
    date: 'August 2026',
  },
  {
    id: 'gal-2',
    title: 'Custom Dual-Rail Power PCB Assembly',
    category: 'Lab Workbench',
    caption: 'Surface-mount soldering and power rail verification in the hardware laboratory.',
    date: 'July 2026',
  },
  {
    id: 'gal-3',
    title: 'ROS2 Node Telemetry Verification',
    category: 'Lab Workbench',
    caption: 'Real-time LiDAR point cloud monitoring and odometry calibration.',
    date: 'September 2026',
  },
  {
    id: 'gal-4',
    title: 'AURIX Arena Prototyping',
    category: 'Competitions',
    caption: 'Testing modular arena boundary barriers for Robo Soccer matches.',
    date: 'September 2026',
  },
  {
    id: 'gal-5',
    title: 'Hexapod Inverse Kinematics Gait Calibration',
    category: 'Projects',
    caption: 'Servo pulse tuning for tripod walking sequences on inclined surfaces.',
    date: 'June 2026',
  },
  {
    id: 'gal-6',
    title: 'Embedded Systems Workshop',
    category: 'Workshops',
    caption: 'Hands-on ESP32 firmware training with first-year robotics inductees.',
    date: 'May 2026',
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
          A visual record of prototypes, laboratory experimentation, printed circuit assemblies, and competition operations conducted by Kalam Robotics Society.
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
                <Camera className="w-6 h-6" />
              </div>
              <span className="text-[10px] font-mono text-slate-400 uppercase tracking-widest">
                {item.category}
              </span>
            </div>

            <div className="p-5 space-y-2">
              <div className="flex items-center justify-between text-[11px] font-mono text-slate-400">
                <span className="text-krs-cyan uppercase">{item.category}</span>
                <span>{item.date}</span>
              </div>
              <h3 className="font-display font-semibold text-white text-base">
                {item.title}
              </h3>
              <p className="text-slate-400 text-xs leading-relaxed">
                {item.caption}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
