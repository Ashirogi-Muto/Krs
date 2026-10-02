import type { MetadataRoute } from 'next'

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://kalamroboticssociety.com'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: [
          '/admin/',
          '/aurix/portal/',
          '/judge/',
          '/api/',
          '/private/',
          '/go/',
          '/aurix/status',
        ],
      },
    ],
    sitemap: `${BASE_URL}/sitemap.xml`,
  }
}
