import React from 'react'
import { constructMetadata } from '@/lib/seo/metadata'
import { BreadcrumbsJsonLd } from '@/lib/seo/structured-data'
import { getGeneralInfo } from '@/lib/data/content'
import { ShieldCheck, Compass, Lightbulb, Users, Target, Milestone } from 'lucide-react'
import { getPageTexts } from '@/lib/page-texts'

export const metadata = constructMetadata({
  title: 'Society Insights & Philosophy | Kalam Robotics Society',
  description:
    'The engineering ethos, laboratory culture, competition philosophy, and milestones of Kalam Robotics Society at IILM University, Greater Noida.',
  path: '/insights',
})

// Text comes from the CMS (Website → Page texts → Insights)
export const revalidate = 60

const CULTURE_ICONS = [Lightbulb, Target, Compass]

export default async function InsightsPage() {
  const t = await getPageTexts()
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
          {t.insights.eyebrow}
        </span>
        <h1 className="text-3xl sm:text-5xl font-display font-extrabold text-white tracking-tight">
          {t.insights.title}
        </h1>
        <p className="text-slate-400 text-sm sm:text-base leading-relaxed">
          {t.insights.intro}
        </p>
      </div>

      {/* Mission & Philosophy */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {t.insights.cultures.map((c, i) => {
          const Icon = CULTURE_ICONS[i % CULTURE_ICONS.length]
          return (
            <div key={`${c.title}-${i}`} className="tech-card rounded-xl p-6 space-y-3">
              <div className="w-10 h-10 rounded-lg bg-krs-surface border border-krs-border flex items-center justify-center text-krs-cyan">
                <Icon className="w-5 h-5" />
              </div>
              <h2 className="font-display font-bold text-white text-lg">{c.title}</h2>
              <p className="text-slate-400 text-xs leading-relaxed">{c.text}</p>
            </div>
          )
        })}
      </section>

      {/* Timeline Section */}
      <section className="space-y-8">
        <div>
          <span className="text-xs font-mono text-krs-cyan uppercase tracking-wider">
            {t.insights.timelineEyebrow}
          </span>
          <h2 className="text-2xl sm:text-3xl font-display font-bold text-white tracking-tight mt-1">
            {t.insights.timelineTitle}
          </h2>
        </div>

        <div className="relative border-l-2 border-krs-border ml-4 sm:ml-6 space-y-10 pl-6 sm:pl-8">
          {t.insights.timeline.map((item, i) => (
            <div key={`${item.year}-${i}`} className="relative group">
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
          {t.insights.affiliationLabel}
        </div>
        <h2 className="text-xl font-display font-bold text-white">
          {t.insights.affiliationTitle}
        </h2>
        <p className="text-slate-300 text-xs sm:text-sm leading-relaxed max-w-3xl">
          {t.insights.affiliationText}
        </p>
      </section>
    </div>
  )
}
