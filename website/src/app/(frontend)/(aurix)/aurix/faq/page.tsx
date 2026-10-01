import React from 'react'
import Link from 'next/link'
import { constructMetadata } from '@/lib/seo/metadata'
import { BreadcrumbsJsonLd } from '@/lib/seo/structured-data'
import { getAllEvents } from '@/lib/data/events'
import { HelpCircle } from 'lucide-react'

// Re-read event data from the CMS at most once a minute
export const revalidate = 60

export const metadata = constructMetadata({
  title: 'Tournament FAQ | AURIX 2026',
  description:
    'Frequently asked questions regarding team registration, hardware rules, eligibility, and the 24-Hour Hackathon at AURIX 2026 IILM University.',
  path: '/aurix/faq',
})

export default async function AURIXFAQPage() {
  const events = await getAllEvents()
  const aurixEvents = events.filter((e) => e.series === 'AURIX')

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-16 space-y-12">
      <BreadcrumbsJsonLd
        items={[
          { name: 'Home', url: '/' },
          { name: 'AURIX', url: '/aurix' },
          { name: 'FAQ', url: '/aurix/faq' },
        ]}
      />

      <div className="space-y-4">
        <span className="text-xs font-mono text-aurix-orange uppercase tracking-wider">
          Support & Guidance // AURIX FAQ
        </span>
        <h1 className="text-3xl sm:text-5xl font-display font-extrabold text-white tracking-tight">
          Frequently Asked Questions
        </h1>
        <p className="text-slate-400 text-sm sm:text-base leading-relaxed">
          Official answers covering eligibility, team size constraints, hardware policies, and judging procedures across all AURIX competitions.
        </p>
      </div>

      <div className="space-y-12">
        {aurixEvents.map((ev) => {
          if (!ev.faqs || ev.faqs.length === 0) return null

          return (
            <section key={ev.id} className="space-y-4">
              <h2 className="text-xl sm:text-2xl font-display font-bold text-white border-b border-aurix-border pb-2">
                {ev.title} FAQ
              </h2>

              <div className="space-y-3">
                {ev.faqs.map((faq) => (
                  <div
                    key={faq.question}
                    className="aurix-card rounded-xl p-5 space-y-2"
                  >
                    <div className="flex items-start gap-2.5">
                      <HelpCircle className="w-4 h-4 text-aurix-orange shrink-0 mt-0.5" />
                      <h3 className="font-display font-bold text-white text-base">
                        {faq.question}
                      </h3>
                    </div>
                    <p className="text-slate-300 text-xs sm:text-sm leading-relaxed pl-6">
                      {faq.answer}
                    </p>
                  </div>
                ))}
              </div>
            </section>
          )
        })}
      </div>
    </div>
  )
}
