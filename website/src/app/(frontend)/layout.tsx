import type { Metadata } from 'next'
import { Inter, Space_Grotesk, JetBrains_Mono } from 'next/font/google'
import '../globals.css'
import { OrganizationJsonLd } from '@/lib/seo/structured-data'
import { getFormTexts } from '@/lib/form-texts'

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
  }
}

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${spaceGrotesk.variable} ${jetbrainsMono.variable} dark`}
    >
      <body className="min-h-screen bg-krs-dark text-slate-100 font-sans antialiased selection:bg-krs-cyan selection:text-black">
        {/* WCAG Skip to Main Content Link */}
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-krs-cyan focus:text-black focus:font-semibold focus:rounded shadow-lg"
        >
          {(await getFormTexts()).general.skipLink}
        </a>
        <OrganizationJsonLd />
        {children}
      </body>
    </html>
  )
}
