import React from 'react'
import { constructMetadata } from '@/lib/seo/metadata'
import { BreadcrumbsJsonLd } from '@/lib/seo/structured-data'

export const metadata = constructMetadata({
  title: 'Privacy Policy | Kalam Robotics Society',
  description:
    'Data protection policies and participant privacy standards enforced by Kalam Robotics Society and AURIX at IILM University Greater Noida.',
  path: '/privacy',
})

export default function PrivacyPolicyPage() {
  return (
    <article className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16 space-y-8">
      <BreadcrumbsJsonLd
        items={[
          { name: 'Home', url: '/' },
          { name: 'Privacy Policy', url: '/privacy' },
        ]}
      />

      <header className="space-y-2 border-b border-krs-border pb-6">
        <span className="text-xs font-mono text-krs-cyan uppercase tracking-wider">
          Compliance & Protection // Legal
        </span>
        <h1 className="text-3xl sm:text-4xl font-display font-extrabold text-white tracking-tight">
          Privacy Policy
        </h1>
        <p className="text-slate-400 text-xs font-mono">
          Last Updated: 24 September 2026 // Effective Version 1.0
        </p>
      </header>

      <div className="space-y-6 text-slate-300 text-sm leading-relaxed">
        <section className="space-y-2">
          <h2 className="text-lg font-display font-bold text-white">
            1. Scope & Commitment
          </h2>
          <p>
            Kalam Robotics Society (KRS) at IILM University, Greater Noida, operates this web platform and the AURIX competition ecosystem. We are committed to strict data minimization, collecting only information necessary to administer competition registrations, verify collegiate enrollment, and deliver participant notifications.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-lg font-display font-bold text-white">
            2. Information Collected
          </h2>
          <p>
            We collect participant names, institutional email addresses, student identification numbers, and contact telephone numbers exclusively for event logistics. We never sell, monetize, or publicly distribute participant contact information.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-lg font-display font-bold text-white">
            3. Submission & Intellectual Property Protection
          </h2>
          <p>
            Technical proposals, code repositories, circuit schematics, and presentation files submitted to AURIX competitions are restricted to assigned evaluation judges and faculty organizers. Submissions are never made public without explicit team authorization.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-lg font-display font-bold text-white">
            4. Cookies & Session Storage
          </h2>
          <p>
            We use secure HTTP-only cookies strictly for authenticated sessions (Participant Portal, Judge Portal, CMS Admin). We do not deploy cross-site tracking or third-party advertising cookies.
          </p>
        </section>
      </div>
    </article>
  )
}
