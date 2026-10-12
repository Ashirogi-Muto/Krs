import type { Metadata, Viewport } from 'next'
import { Inter, Space_Grotesk, JetBrains_Mono, Cinzel } from 'next/font/google'
import '../globals.css'
import { OrganizationJsonLd } from '@/lib/seo/structured-data'
import { getFormTexts } from '@/lib/form-texts'
import { isPreview } from '@/lib/preview'
import { PreviewChrome } from '@/components/preview/PreviewChrome'
import { ScrollReveal } from '@/components/ui/ScrollReveal'
import { ScrollToTop } from '@/components/ui/ScrollToTop'

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  themeColor: '#070a12',
}

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
})

const spaceGrotesk = Space_Grotesk({
  subsets: ['latin'],
  variable: '--font-space-grotesk',
  display: 'swap',
})

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-jetbrains-mono',
  display: 'swap',
})

const cinzel = Cinzel({
  subsets: ['latin'],
  variable: '--font-cinzel',
  display: 'swap',
  weight: ['400', '700', '900'],
})

// Site name, default title/description and keywords: CMS → Labels & messages → Search & browser tabs
export async function generateMetadata(): Promise<Metadata> {
  const seo = (await getFormTexts()).seo
  return {
    metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || 'https://kalamroboticssociety.com'),
    title: {
      template: seo.siteName ? `%s | ${seo.siteName}` : '%s',
      default: seo.defaultTitle,
    },
    description: seo.defaultDescription,
    keywords: seo.keywords
      .split(',')
      .map((k) => k.trim())
      .filter(Boolean),
    // Live preview pages (CMS editors only, never cached) must never be indexed
    ...((await isPreview()) ? { robots: { index: false, follow: false } } : {}),
  }
}

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const general = (await getFormTexts()).general
  return (
    <html
      lang="en"
      className={`${inter.variable} ${spaceGrotesk.variable} ${jetbrainsMono.variable} ${cinzel.variable} dark`}
    >
      <body className="min-h-screen bg-krs-dark text-slate-100 font-sans antialiased selection:bg-krs-cyan selection:text-black overflow-x-hidden w-full max-w-full">
        {/* WCAG Skip to Main Content Link */}
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-krs-cyan focus:text-black focus:font-semibold focus:rounded shadow-lg"
        >
          {general.skipLink}
        </a>
        <OrganizationJsonLd />
        {children}
        {/* Scroll-in animations start hidden; without JavaScript they stay visible */}
        <noscript>
          <style>{'.reveal,.reveal-left,.reveal-right,.reveal-scale{opacity:1!important;transform:none!important}'}</style>
        </noscript>
        <ScrollReveal />
        <ScrollToTop label={general.scrollTopButton} />
        <PreviewChrome />
      </body>
    </html>
  )
}
