import React from 'react'
import { redirect } from 'next/navigation'
import { getSessionUser } from '@/lib/auth/session'
import { requireVisibleRoute } from '@/lib/visibility-guard'
import { ProfileForm } from '@/components/aurix/portal/ProfileForm'

export const dynamic = 'force-dynamic'

export const metadata = {
  title: 'Profile Settings | AURIX Participant Portal',
  robots: {
    index: false,
    follow: false,
    nocache: true,
  },
}

export default async function ProfilePage() {
  await requireVisibleRoute('/aurix/portal')
  const user = await getSessionUser()
  if (!user) {
    redirect('/login')
  }

  return (
    <div className="space-y-8 max-w-4xl">
      {/* Header */}
      <div className="space-y-2 border-b border-aurix-border pb-6">
        <span className="text-xs font-mono text-aurix-orange uppercase tracking-wider">
          Account Administration // Profile
        </span>
        <h1 className="text-2xl sm:text-4xl font-display font-extrabold text-white">
          Participant Profile & Security
        </h1>
        <p className="text-slate-400 text-xs sm:text-sm font-mono">
          Manage your personal details and authentication credentials.
        </p>
      </div>

      <ProfileForm
        initialUser={{
          name: user.name,
          email: user.email,
          role: user.role,
          phone: user.phone,
          institution: user.institution,
        }}
      />
    </div>
  )
}
