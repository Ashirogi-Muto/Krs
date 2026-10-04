import { requireVisibleRoute } from '@/lib/visibility-guard'
import React from 'react'
import { constructMetadata } from '@/lib/seo/metadata'
import { BreadcrumbsJsonLd } from '@/lib/seo/structured-data'
import { LegalPageView } from '@/components/krs/LegalPageView'
import { getLegalPage } from '@/lib/data/legal'

// Search title/description: CMS → Privacy & terms (empty = these built-in ones)
export async function generateMetadata() {
  const page = await getLegalPage('privacy')
  return constructMetadata({
    title: page.seoTitle || 'Privacy Policy | Kalam Robotics Society',
    description:
      page.seoDescription ||
      'Data protection policies and participant privacy standards enforced by Kalam Robotics Society and AURIX at IILM University Greater Noida.',
    path: '/privacy',
  })
}

// Text comes from the CMS (Website → Privacy & terms); re-read at most once a minute
export const revalidate = 60

export default async function PrivacyPolicyPage() {
  await requireVisibleRoute('/privacy')
  return (
    <article className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16 space-y-8">
      <BreadcrumbsJsonLd
        items={[
          { name: 'Home', url: '/' },
          { name: 'Privacy Policy', url: '/privacy' },
        ]}
      />

      <LegalPageView page={await getLegalPage('privacy')} />
    </article>
  )
}
