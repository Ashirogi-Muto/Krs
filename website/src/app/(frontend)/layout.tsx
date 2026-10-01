import type { Metadata } from 'next'
import { Inter, Space_Grotesk, JetBrains_Mono } from 'next/font/google'
import '../globals.css'
import { OrganizationJsonLd } from '@/lib/seo/structured-data'

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

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || 'https://kalamroboticssociety.com'),
  title: {
    template: '%s | Kalam Robotics Society',
    default: 'Kalam Robotics Society (KRS) | IILM University, Greater Noida',
  },
  description:
    'Official digital platform and engineering lab for Kalam Robotics Society (KRS) and the flagship AURIX robotics competition series at IILM University, Greater Noida.',
  keywords: [
    'Kalam Robotics Society',
    'KRS IILM',
    'AURIX 2026',
    'Robotics Society Greater Noida',
    'Robotics & AI Hackathon',
    'Robo Soccer',
    'Robo Race',
    'Robo Expo',
    'Robo Ideathon',
    'IILM University Engineering',
  ],
}

export default function RootLayout({
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
          Skip to main content
        </a>
        <OrganizationJsonLd />
        {children}
      </body>
    </html>
  )
}
