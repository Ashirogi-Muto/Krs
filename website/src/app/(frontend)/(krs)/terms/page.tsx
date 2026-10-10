import { requireVisibleRoute } from '@/lib/visibility-guard'
import React from 'react'
import { constructMetadata } from '@/lib/seo/metadata'
import { BreadcrumbsJsonLd } from '@/lib/seo/structured-data'
import { LegalPageView } from '@/components/krs/LegalPageView'
import { getLegalPage } from '@/lib/data/legal'
import { getFormTexts } from '@/lib/form-texts'

// Search title/description: CMS → Privacy & terms
export async function generateMetadata() {
  const page = await getLegalPage('terms')
  return constructMetadata({
    title: page.seoTitle,
    description: page.seoDescription,
    path: '/terms',
  })
}

// Text comes from the CMS (Website → Privacy & terms); re-read at most once a minute
export const revalidate = 60

export default async function TermsPage() {
  await requireVisibleRoute('/terms')
  const g = (await getFormTexts()).general
  return (
    <article className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16 space-y-8">
      <BreadcrumbsJsonLd
        items={[
          { name: g.crumbHome, url: '/' },
          { name: g.crumbTerms, url: '/terms' },
        ]}
      />

      <LegalPageView page={await getLegalPage('terms')} />
    </article>
  )
}
