import { requireVisibleRoute } from '@/lib/visibility-guard'
import React from 'react'
import { constructMetadata } from '@/lib/seo/metadata'
import { BreadcrumbsJsonLd } from '@/lib/seo/structured-data'
import { LegalPageView } from '@/components/krs/LegalPageView'
import { getLegalPage } from '@/lib/data/legal'

export const metadata = constructMetadata({
  title: 'Terms of Service & Rules | Kalam Robotics Society',
  description:
    'Official code of conduct, competition regulations, originality requirements, and terms of service for Kalam Robotics Society and AURIX.',
  path: '/terms',
})

// Text comes from the CMS (Website → Privacy & terms); re-read at most once a minute
export const revalidate = 60

export default async function TermsPage() {
  await requireVisibleRoute('/terms')
  return (
    <article className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16 space-y-8">
      <BreadcrumbsJsonLd
        items={[
          { name: 'Home', url: '/' },
          { name: 'Terms of Service', url: '/terms' },
        ]}
      />

      <LegalPageView page={await getLegalPage('terms')} />
    </article>
  )
}
