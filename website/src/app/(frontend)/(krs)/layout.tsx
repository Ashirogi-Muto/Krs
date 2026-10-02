import React from 'react'
import { getHiddenRoutes } from '@/lib/site-settings'
import { KRSNavbar } from '@/components/krs/Navbar'
import { KRSFooter } from '@/components/krs/Footer'

// Menus follow the CMS (Site settings → Hidden pages); re-read at most once a minute
export const revalidate = 60

export default async function KRSLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const hidden = await getHiddenRoutes()
  return (
    <div className="min-h-screen flex flex-col bg-krs-dark text-slate-100">
      <KRSNavbar hidden={hidden} />
      <main id="main-content" className="flex-1">
        {children}
      </main>
      <KRSFooter />
    </div>
  )
}
