import React from 'react'
import { GenericEvent, BlogPost } from '@/lib/data/types'

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://kalamroboticssociety.com'


/** JSON for <script type="application/ld+json">, with '<' escaped so content can never close the tag. */
function safeJson(value: unknown): string {
  return JSON.stringify(value).replace(/</g, '\\u003c')
}

export function OrganizationJsonLd() {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'Kalam Robotics Society',
    alternateName: 'KRS',
    url: BASE_URL,
    logo: `${BASE_URL}/logo.png`,
    description:
      'Premier multidisciplinary student robotics society and research laboratory at IILM University, Greater Noida.',
    address: {
      '@type': 'PostalAddress',
      addressLocality: 'Greater Noida',
      addressRegion: 'Uttar Pradesh',
      addressCountry: 'IN',
    },
    parentOrganization: {
      '@type': 'EducationalOrganization',
      name: 'IILM University, Greater Noida',
    },
  }

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: safeJson(jsonLd) }}
    />
  )
}

export function EventJsonLd({ event }: { event: GenericEvent }) {
  const jsonLd: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': 'Event',
    name: event.title,
    description: event.shortDescription || event.description,
    startDate: event.startDate,
    endDate: event.endDate,
    eventStatus: 'https://schema.org/EventScheduled',
    image: [`${BASE_URL}/og?event=${event.slug}`],
    url: `${BASE_URL}/aurix/${event.slug}`,
    eventAttendanceMode: 'https://schema.org/OfflineEventAttendanceMode',
    location: {
      '@type': 'Place',
      name: event.venue,
      address: {
        '@type': 'PostalAddress',
        addressLocality: 'Greater Noida',
        addressRegion: 'Uttar Pradesh',
        addressCountry: 'IN',
      },
    },
    organizer: {
      '@type': 'Organization',
      name: 'Kalam Robotics Society',
      url: BASE_URL,
    },
  }

  if (!event.comingSoon && event.registrationFee !== null && event.registrationFee !== undefined) {
    jsonLd.offers = {
      '@type': 'Offer',
      price: event.registrationFee,
      priceCurrency: event.currency,
      availability:
        event.status === 'REGISTRATION_OPEN' ? 'https://schema.org/InStock' : 'https://schema.org/SoldOut',
      url: `${BASE_URL}/aurix/register?event=${event.slug}`,
      validFrom: event.registrationOpen,
    }
  }

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: safeJson(jsonLd) }}
    />
  )
}

export function BlogPostingJsonLd({ post }: { post: BlogPost }) {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: post.title,
    description: post.summary,
    author: {
      '@type': 'Person',
      name: post.author,
    },
    datePublished: post.publishedAt,
    dateModified: post.updatedAt || post.publishedAt,
    publisher: {
      '@type': 'Organization',
      name: 'Kalam Robotics Society',
      url: BASE_URL,
    },
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': `${BASE_URL}/blogs/${post.slug}`,
    },
  }

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: safeJson(jsonLd) }}
    />
  )
}

export function BreadcrumbsJsonLd({ items }: { items: { name: string; url: string }[] }) {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: item.url.startsWith('http') ? item.url : `${BASE_URL}${item.url}`,
    })),
  }

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: safeJson(jsonLd) }}
    />
  )
}
