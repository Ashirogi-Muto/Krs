import type { Metadata } from 'next'
import { getFormTexts } from '@/lib/form-texts'

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://kalamroboticssociety.com'

interface ConstructMetadataParams {
  title: string
  description: string
  path: string
  ogImage?: string
  noIndex?: boolean
}

/** Page metadata; the site name after titles and in link previews comes from CMS → Labels & messages → Search & browser tabs. */
export async function constructMetadata({
  title,
  description,
  path,
  ogImage = '/og',
  noIndex = false,
}: ConstructMetadataParams): Promise<Metadata> {
  const canonicalUrl = `${BASE_URL}${path}`
  const { siteName, shareSiteName } = (await getFormTexts()).seo
  const fullTitle = !siteName || title.includes(siteName) ? title : `${title} | ${siteName}`

  return {
    // Absolute title so the layout's "%s | <site name>" template doesn't append the name again
    title: {
      absolute: fullTitle,
    },
    description,
    alternates: {
      canonical: canonicalUrl,
    },
    robots: noIndex
      ? {
          index: false,
          follow: false,
          nocache: true,
          googleBot: {
            index: false,
            follow: false,
            noimageindex: true,
          },
        }
      : {
          index: true,
          follow: true,
          googleBot: {
            index: true,
            follow: true,
            'max-video-preview': -1,
            'max-image-preview': 'large',
            'max-snippet': -1,
          },
        },
    openGraph: {
      title: fullTitle,
      description,
      url: canonicalUrl,
      siteName: shareSiteName,
      images: [
        {
          url: ogImage.startsWith('http') ? ogImage : `${BASE_URL}${ogImage}`,
          width: 1200,
          height: 630,
          alt: title,
        },
      ],
      locale: 'en_IN',
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title: fullTitle,
      description,
      images: [ogImage.startsWith('http') ? ogImage : `${BASE_URL}${ogImage}`],
    },
  }
}
