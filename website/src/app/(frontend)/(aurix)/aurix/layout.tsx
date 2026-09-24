import React from 'react'
import { AURIXNavbar } from '@/components/aurix/Navbar'
import { AURIXFooter } from '@/components/aurix/Footer'

export default function AURIXLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen flex flex-col bg-aurix-dark text-slate-100">
      <AURIXNavbar />
      <main id="main-content" className="flex-1">
        {children}
      </main>
      <AURIXFooter />
    </div>
  )
}
