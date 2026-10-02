import React from 'react'
import { getHiddenRoutes } from '@/lib/site-settings'
import { AURIXNavbar } from '@/components/aurix/Navbar'
import { AURIXFooter } from '@/components/aurix/Footer'

// Menus follow the CMS (Site settings → Hidden pages); re-read at most once a minute
export const revalidate = 60

export default async function AURIXLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const hidden = await getHiddenRoutes()
  return (
    <div className="min-h-screen flex flex-col bg-aurix-dark text-slate-100">
      <AURIXNavbar hidden={hidden} />
      <main id="main-content" className="flex-1">
        {children}
      </main>
      <AURIXFooter />
    </div>
  )
}
