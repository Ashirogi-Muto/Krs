import { withPayload } from '@payloadcms/next/withPayload'

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Self-contained server bundle with only the files it needs (much smaller Docker image)
  output: 'standalone',
  poweredByHeader: false,
  productionBrowserSourceMaps: false,
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'kalamroboticssociety.com',
      },
      {
        protocol: 'https',
        hostname: '*.kalamroboticssociety.com',
      },
    ],
  },
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'SAMEORIGIN',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=()',
          },
          // Full policy, enforced since 4 Oct 2026 (owner) after report-only from 3 Oct: the only violations were the
          // Cloudflare Web Analytics beacon (now allowed) and one browser-extension eval. Violations still go to
          // /api/csp-report. Next.js and the Payload admin need inline scripts/styles; dev mode also needs eval.
          {
            key: 'Content-Security-Policy',
            value: [
              "default-src 'self'",
              `script-src 'self' 'unsafe-inline' https://static.cloudflareinsights.com${process.env.NODE_ENV === 'production' ? '' : " 'unsafe-eval'"}`,
              "style-src 'self' 'unsafe-inline'",
              "img-src 'self' data: blob: https:",
              "font-src 'self' data:",
              "connect-src 'self' https://cloudflareinsights.com",
              "frame-src 'self'",
              "worker-src 'self' blob:",
              "media-src 'self' https:",
              "frame-ancestors 'self'",
              "object-src 'none'",
              "base-uri 'self'",
              "form-action 'self'",
              'upgrade-insecure-requests',
              'report-uri /api/csp-report',
            ].join('; '),
          },
          { key: 'Cross-Origin-Opener-Policy', value: 'same-origin' },
          { key: 'Cross-Origin-Resource-Policy', value: 'same-site' },
          { key: 'X-Permitted-Cross-Domain-Policies', value: 'none' },
          { key: 'Origin-Agent-Cluster', value: '?1' },
        ],
      },
      {
        source: '/admin/:path*',
        headers: [
          {
            key: 'X-Robots-Tag',
            value: 'noindex, nofollow',
          },
        ],
      },
      {
        source: '/api/:path*',
        headers: [
          {
            key: 'X-Robots-Tag',
            value: 'noindex, nofollow',
          },
        ],
      },
      {
        source: '/aurix/portal/:path*',
        headers: [
          {
            key: 'X-Robots-Tag',
            value: 'noindex, nofollow',
          },
        ],
      },
      {
        source: '/judge/:path*',
        headers: [
          {
            key: 'X-Robots-Tag',
            value: 'noindex, nofollow',
          },
        ],
      },
    ]
  },
}

export default withPayload(nextConfig)

