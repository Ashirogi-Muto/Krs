import type { Metadata } from 'next'

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://kalamroboticssociety.com'

interface ConstructMetadataParams {
  title: string
  description: string
  path: string
  ogImage?: string
  noIndex?: boolean
}

export function constructMetadata({
  title,
  description,
  path,
  ogImage = '/og',
  noIndex = false,
}: ConstructMetadataParams): Metadata {
  const canonicalUrl = `${BASE_URL}${path}`

  return {
    // Absolute title so the layout's "%s | Kalam Robotics Society" template doesn't append the name again
    title: {
      absolute: title.includes('Kalam Robotics Society') ? title : `${title} | Kalam Robotics Society`,
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
      title: title.includes('Kalam Robotics Society') ? title : `${title} | Kalam Robotics Society`,
      description,
      url: canonicalUrl,
      siteName: 'Kalam Robotics Society (KRS)',
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
      title: title.includes('Kalam Robotics Society') ? title : `${title} | Kalam Robotics Society`,
      description,
      images: [ogImage.startsWith('http') ? ogImage : `${BASE_URL}${ogImage}`],
    },
  }
}
