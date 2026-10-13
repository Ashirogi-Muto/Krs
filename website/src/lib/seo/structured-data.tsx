import React from 'react'
import { GenericEvent, BlogPost } from '@/lib/data/types'
import { getSiteSettings } from '@/lib/site-settings'
import { getFormTexts } from '@/lib/form-texts'
import { getBrandImages } from '@/lib/brand-images'

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://kalamroboticssociety.com'


/** JSON for <script type="application/ld+json">, with '<' escaped so content can never close the tag. */
function safeJson(value: unknown): string {
  return JSON.stringify(value).replace(/</g, '\\u003c')
}

/** Society facts for search engines: CMS → Site settings (name, short name, institution, address) and
 * Labels & messages → Whole site ("Search engines: what the society is") and the logo from Site settings → Logos & icons. */
export async function OrganizationJsonLd() {
  const [site, texts, brand] = await Promise.all([getSiteSettings(), getFormTexts(), getBrandImages()])
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: site.name,
    alternateName: site.shortName,
    url: BASE_URL,
    // Site settings → Logos & icons → "Logo for search engines" (empty = the built-in KRS logo)
    logo: brand.searchLogo ? `${BASE_URL}${brand.searchLogo.url}` : `${BASE_URL}/logo.png`,
    description: texts.general.orgDescription,
    ...(site.location ? { address: site.location } : {}),
    parentOrganization: {
      '@type': 'EducationalOrganization',
      name: site.institution,
    },
    ...(site.contactEmail ? { email: site.contactEmail } : {}),
    ...(site.socialLinks.length ? { sameAs: site.socialLinks.map((l) => l.url).filter((u) => /^https?:\/\//.test(u)) } : {}),
  }

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: safeJson(jsonLd) }}
    />
  )
}

export async function EventJsonLd({ event }: { event: GenericEvent }) {
  const site = await getSiteSettings()
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
      // Address text from the event (Events → location), else Site settings → location
      address: event.location || site.location || undefined,
    },
    organizer: {
      '@type': 'Organization',
      name: site.name,
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

export async function BlogPostingJsonLd({ post }: { post: BlogPost }) {
  const site = await getSiteSettings()
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
      name: site.name,
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
