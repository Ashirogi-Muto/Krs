import React from 'react'
import { KRSNavbar } from '@/components/krs/Navbar'
import { KRSFooter } from '@/components/krs/Footer'

export default function KRSLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen flex flex-col bg-krs-dark text-slate-100">
      <KRSNavbar />
      <main id="main-content" className="flex-1">
        {children}
      </main>
      <KRSFooter />
    </div>
  )
}
