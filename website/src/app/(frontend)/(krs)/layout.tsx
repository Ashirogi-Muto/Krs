import React from 'react'
import { getNavigation } from '@/lib/navigation'
import { getFormTexts } from '@/lib/form-texts'
import { getSiteSettings } from '@/lib/site-settings'
import { SiteNavbar } from '@/components/site/SiteNavbar'
import { SiteFooter } from '@/components/site/SiteFooter'

// Menus and footer follow the CMS (Navigation & footer, Site settings); re-read at most once a minute
export const revalidate = 60

export default async function KRSLayout({ children }: { children: React.ReactNode }) {
  const [nav, site] = await Promise.all([getNavigation(), getSiteSettings()])
  return (
    <div className="min-h-screen flex flex-col bg-krs-dark text-slate-100">
      <SiteNavbar nav={nav.krs} theme="krs" menuLabel={(await getFormTexts()).general.menuButton} />
      <main id="main-content" className="flex-1">
        {children}
      </main>
      <SiteFooter nav={nav.krs} site={site} theme="krs" />
    </div>
  )
}
