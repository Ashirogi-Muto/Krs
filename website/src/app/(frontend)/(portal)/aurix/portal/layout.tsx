import React from 'react'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { getSessionUser } from '@/lib/auth/session'
import { requireVisibleRoute } from '@/lib/visibility-guard'
import {
  Flame,
  LayoutDashboard,
  Calendar,
  Users,
  FileCheck2,
  Bell,
  Trophy,
  LogOut,
  ExternalLink,
  ShieldAlert,
  KeyRound,
  User,
} from 'lucide-react'

export const metadata = {
  robots: {
    index: false,
    follow: false,
    nocache: true,
  },
}

const PORTAL_NAV = [
  { name: 'Dashboard', href: '/aurix/portal', icon: LayoutDashboard },
  { name: 'Claim Registration', href: '/aurix/portal/claim', icon: KeyRound },
  { name: 'My Events', href: '/aurix/portal/events', icon: Calendar },
  { name: 'Team Rosters', href: '/aurix/portal/teams', icon: Users },
  { name: 'Submissions', href: '/aurix/portal/submissions', icon: FileCheck2 },
  { name: 'Announcements', href: '/aurix/portal/announcements', icon: Bell },
  { name: 'My Results', href: '/aurix/portal/results', icon: Trophy },
  { name: 'Profile & Security', href: '/aurix/portal/profile', icon: User },
]

export default async function PortalLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // Server-side authentication gate (Domain 01 / Domain 02)
  requireVisibleRoute('/aurix/portal')
  const user = await getSessionUser()
  if (!user) {
    redirect('/login')
  }

  return (
    <div className="min-h-screen bg-aurix-dark text-slate-100 flex flex-col md:flex-row">
      {/* Sidebar Navigation */}
      <aside className="w-full md:w-64 border-b md:border-b-0 md:border-r border-aurix-border bg-aurix-surface/90 flex flex-col justify-between shrink-0">
        <div>
          {/* Header Identity */}
          <div className="p-5 border-b border-aurix-border flex items-center justify-between">
            <Link href="/aurix" className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded bg-aurix-dark border border-aurix-border flex items-center justify-center text-aurix-orange">
                <Flame className="w-4 h-4" />
              </div>
              <span className="font-display font-extrabold text-white text-sm uppercase tracking-wider">
                AURIX PORTAL
              </span>
            </Link>
          </div>

          {/* User Profile Strip */}
          <div className="p-4 border-b border-aurix-border/60 bg-aurix-dark/40">
            <div className="text-xs font-mono text-white font-semibold truncate">
              {user ? user.name : 'Participant Session'}
            </div>
            <div className="text-[10px] font-mono text-slate-400 truncate">
              {user ? user.email : 'Local Authenticated'}
            </div>
            <div className="inline-block mt-2 px-2 py-0.5 rounded text-[9px] font-mono uppercase bg-aurix-surface border border-aurix-border text-aurix-orange font-bold">
              {user ? user.role : 'PARTICIPANT'}
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="p-3 space-y-1">
            {PORTAL_NAV.map((item) => {
              const Icon = item.icon
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className="flex items-center gap-3 px-3 py-2 text-xs font-mono rounded-lg text-slate-300 hover:text-white hover:bg-aurix-dark transition-colors"
                >
                  <Icon className="w-4 h-4 text-aurix-orange" />
                  <span>{item.name}</span>
                </Link>
              )
            })}
          </nav>
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-aurix-border space-y-2">
          <Link
            href="/aurix"
            className="flex items-center justify-between text-xs font-mono text-slate-400 hover:text-white p-2 rounded hover:bg-aurix-dark"
          >
            <span>Public Arena</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </Link>
          <form action="/api/auth/logout" method="POST">
            <button
              type="submit"
              className="w-full flex items-center gap-2 text-xs font-mono text-red-400 hover:text-red-300 p-2 rounded hover:bg-red-950/20 text-left"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Sign Out</span>
            </button>
          </form>
        </div>
      </aside>

      {/* Main Portal Viewport */}
      <main className="flex-1 p-6 md:p-10 max-w-6xl overflow-y-auto">
        {children}
      </main>
    </div>
  )
}
