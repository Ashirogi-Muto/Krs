import React from 'react'
import { constructMetadata } from '@/lib/seo/metadata'
import { BreadcrumbsJsonLd } from '@/lib/seo/structured-data'

export const metadata = constructMetadata({
  title: 'Terms of Service & Rules | Kalam Robotics Society',
  description:
    'Official code of conduct, competition regulations, originality requirements, and terms of service for Kalam Robotics Society and AURIX.',
  path: '/terms',
})

export default function TermsPage() {
  return (
    <article className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16 space-y-8">
      <BreadcrumbsJsonLd
        items={[
          { name: 'Home', url: '/' },
          { name: 'Terms of Service', url: '/terms' },
        ]}
      />

      <header className="space-y-2 border-b border-krs-border pb-6">
        <span className="text-xs font-mono text-krs-cyan uppercase tracking-wider">
          Regulations & Code of Conduct // Legal
        </span>
        <h1 className="text-3xl sm:text-4xl font-display font-extrabold text-white tracking-tight">
          Terms of Service & Competition Rules
        </h1>
        <p className="text-slate-400 text-xs font-mono">
          Last Updated: 24 September 2026 // Effective Version 1.0
        </p>
      </header>

      <div className="space-y-6 text-slate-300 text-sm leading-relaxed">
        <section className="space-y-2">
          <h2 className="text-lg font-display font-bold text-white">
            1. Eligibility & Conduct
          </h2>
          <p>
            Participation in KRS and AURIX events is open to bona fide college and university students. Participants must uphold collegiate ethics, laboratory safety standards, and respectful conduct toward peers, mentors, and judges.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-lg font-display font-bold text-white">
            2. Originality & Disqualification
          </h2>
          <p>
            All prototypes, software repositories, and design schematics submitted to AURIX competitions must be original student work. Pre-completed solutions, commercial off-the-shelf clones, or direct plagiarism will result in immediate disqualification.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-lg font-display font-bold text-white">
            3. Generative AI Policy
          </h2>
          <p>
            Generative AI tools (LLMs, code generation assistants) are permitted as modern productivity amplifiers. However, substantial AI assistance must be explicitly disclosed in the project dossier. Undisclosed generative automation may incur scoring penalties.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-lg font-display font-bold text-white">
            4. Judging Authority
          </h2>
          <p>
            The scoring decisions of the official AURIX evaluation panel and faculty committee are final and binding in all technical disputes.
          </p>
        </section>
      </div>
    </article>
  )
}
