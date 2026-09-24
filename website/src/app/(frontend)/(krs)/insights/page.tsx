import React from 'react'
import { constructMetadata } from '@/lib/seo/metadata'
import { BreadcrumbsJsonLd } from '@/lib/seo/structured-data'
import { getGeneralInfo } from '@/lib/data/content'
import { ShieldCheck, Compass, Lightbulb, Users, Target, Milestone } from 'lucide-react'

export const metadata = constructMetadata({
  title: 'Society Insights & Philosophy | Kalam Robotics Society',
  description:
    'The engineering ethos, laboratory culture, competition philosophy, and milestones of Kalam Robotics Society at IILM University, Greater Noida.',
  path: '/insights',
})

const TIMELINE = [
  {
    year: '2024',
    title: 'Foundational Charter & Laboratory Commissioning',
    description:
      'Established under the School of Engineering & Technology at IILM University Greater Noida, formalizing multi-disciplinary student hardware labs.',
  },
  {
    year: '2025',
    title: 'Flagship Mobile Robotics & IoT Initiative',
    description:
      'Kickstarted the YUVAAN semi-autonomous rover platform and deployed IoT micro-grid sensor prototypes across campus grounds.',
  },
  {
    year: '2026',
    title: 'Launch of AURIX National Competition Series',
    description:
      'Architected the national AURIX robotics platform, including the 24-Hour Robotics & AI Hackathon and collegiate arena competitions.',
  },
]

export default async function InsightsPage() {
  const info = await getGeneralInfo()

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 space-y-16">
      <BreadcrumbsJsonLd
        items={[
          { name: 'Home', url: '/' },
          { name: 'Insights', url: '/insights' },
        ]}
      />

      <div className="max-w-3xl space-y-4">
        <span className="text-xs font-mono text-krs-cyan uppercase tracking-wider">
          Manifesto & Culture // Society Insights
        </span>
        <h1 className="text-3xl sm:text-5xl font-display font-extrabold text-white tracking-tight">
          Inside Kalam Robotics Society
        </h1>
        <p className="text-slate-400 text-sm sm:text-base leading-relaxed">
          Understanding the mission, engineering philosophy, and pedagogical culture that drive innovation at IILM University Greater Noida.
        </p>
      </div>

      {/* Mission & Philosophy */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="tech-card rounded-xl p-6 space-y-3">
          <div className="w-10 h-10 rounded-lg bg-krs-surface border border-krs-border flex items-center justify-center text-krs-cyan">
            <Lightbulb className="w-5 h-5" />
          </div>
          <h2 className="font-display font-bold text-white text-lg">
            Learning Culture
          </h2>
          <p className="text-slate-400 text-xs leading-relaxed">
            We reject passive lectures in favor of hardware breadboarding, circuit soldering, oscilloscope debugging, and writing low-level drivers from scratch.
          </p>
        </div>

        <div className="tech-card rounded-xl p-6 space-y-3">
          <div className="w-10 h-10 rounded-lg bg-krs-surface border border-krs-border flex items-center justify-center text-krs-cyan">
            <Target className="w-5 h-5" />
          </div>
          <h2 className="font-display font-bold text-white text-lg">
            Project Culture
          </h2>
          <p className="text-slate-400 text-xs leading-relaxed">
            Every project undergoes rigorous system architecture reviews, component budgeting, schematic verification, and systematic field benchmarks.
          </p>
        </div>

        <div className="tech-card rounded-xl p-6 space-y-3">
          <div className="w-10 h-10 rounded-lg bg-krs-surface border border-krs-border flex items-center justify-center text-krs-cyan">
            <Compass className="w-5 h-5" />
          </div>
          <h2 className="font-display font-bold text-white text-lg">
            Competition Culture
          </h2>
          <p className="text-slate-400 text-xs leading-relaxed">
            Pressure tests engineering designs. We build reliable, tournament-ready machines engineered to withstand dynamic arena conditions and stringent time trials.
          </p>
        </div>
      </section>

      {/* Timeline Section */}
      <section className="space-y-8">
        <div>
          <span className="text-xs font-mono text-krs-cyan uppercase tracking-wider">
            Chronology // Milestones
          </span>
          <h2 className="text-2xl sm:text-3xl font-display font-bold text-white tracking-tight mt-1">
            Society Evolution & Milestones
          </h2>
        </div>

        <div className="relative border-l-2 border-krs-border ml-4 sm:ml-6 space-y-10 pl-6 sm:pl-8">
          {TIMELINE.map((item) => (
            <div key={item.year} className="relative group">
              {/* Dot */}
              <div className="absolute -left-[31px] sm:-left-[39px] top-1 w-4 h-4 rounded-full bg-krs-dark border-2 border-krs-cyan" />
              <div className="space-y-1">
                <span className="text-xs font-mono text-krs-cyan font-semibold">
                  {item.year}
                </span>
                <h3 className="font-display font-bold text-white text-lg">
                  {item.title}
                </h3>
                <p className="text-slate-400 text-xs sm:text-sm max-w-2xl leading-relaxed">
                  {item.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Verified Institutional Statement */}
      <section className="p-8 rounded-2xl bg-krs-surface border border-krs-border space-y-4">
        <div className="flex items-center gap-2 text-krs-cyan font-mono text-xs uppercase">
          <ShieldCheck className="w-4 h-4" />
          Verified Institutional Affiliation
        </div>
        <h2 className="text-xl font-display font-bold text-white">
          IILM University, Greater Noida
        </h2>
        <p className="text-slate-300 text-xs sm:text-sm leading-relaxed max-w-3xl">
          Operating under academic oversight, Kalam Robotics Society bridges classroom theoretical mechanics and electromagnetics with real-world robotics development, autonomous vehicles, and international competition readiness.
        </p>
      </section>
    </div>
  )
}
