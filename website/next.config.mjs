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
  // Payload's own "forgot password" screen would only replace a valid emailed reset link (the API refuses it):
  // staff use the site's page, which sends the email
  async redirects() {
    return [{ source: '/admin/forgot', destination: '/forgot-password', permanent: false }]
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
              // challenges.cloudflare.com: Turnstile bot check (only loaded when its keys are set; lib/turnstile.ts)
              `script-src 'self' 'unsafe-inline' https://static.cloudflareinsights.com https://challenges.cloudflare.com${process.env.NODE_ENV === 'production' ? '' : " 'unsafe-eval'"}`,
              "style-src 'self' 'unsafe-inline'",
              "img-src 'self' data: blob: https:",
              "font-src 'self' data:",
              "connect-src 'self' https://cloudflareinsights.com",
              "frame-src 'self' https://challenges.cloudflare.com",
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
      // Never cached by browsers or Cloudflare: API answers and the CMS can carry personal data (security fix,
      // 7 Oct 2026). Excluded: /api/media/file/* (public website images, meant to be cached). Routes that set their own
      // Cache-Control (/api/health, admin APIs, ID-card files) already send no-store; /og and /go are outside /api.
      {
        source: '/api/:path((?!media/file/).*)',
        headers: [{ key: 'Cache-Control', value: 'private, no-store' }],
      },
      {
        source: '/admin/:path*',
        headers: [{ key: 'Cache-Control', value: 'private, no-store' }],
      },
      {
        source: '/admin',
        headers: [{ key: 'Cache-Control', value: 'private, no-store' }],
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

