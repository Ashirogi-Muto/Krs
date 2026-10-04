import React from 'react'
import { redirect } from 'next/navigation'
import { getSessionUser } from '@/lib/auth/session'
import { requireVisibleRoute } from '@/lib/visibility-guard'
import { getPortalTexts } from '@/lib/portal-texts'
import { ClaimForm } from '@/components/aurix/portal/ClaimForm'
import { ShieldCheck, Info } from 'lucide-react'

export const dynamic = 'force-dynamic'

export const metadata = {
  title: 'Claim Registration | AURIX Portal',
  robots: {
    index: false,
    follow: false,
    nocache: true,
  },
}

export default async function ClaimPage() {
  await requireVisibleRoute('/aurix/portal')
  const user = await getSessionUser()
  if (!user) {
    redirect('/login')
  }
  const t = (await getPortalTexts()).claim

  return (
    <div className="space-y-8 max-w-3xl">
      {/* Header */}
      <div className="space-y-2 border-b border-aurix-border pb-6">
        <span className="text-xs font-mono text-aurix-orange uppercase tracking-wider">
          {t.eyebrow}
        </span>
        <h1 className="text-2xl sm:text-4xl font-display font-extrabold text-white">
          {t.title}
        </h1>
        <p className="text-slate-400 text-xs sm:text-sm font-mono">
          {t.intro}
        </p>
      </div>

      <div className="p-4 rounded-xl bg-aurix-dark/60 border border-aurix-border/70 flex items-start gap-3 text-xs text-slate-300">
        <Info className="w-4 h-4 text-aurix-orange shrink-0 mt-0.5" />
        <div className="space-y-1">
          <span className="font-bold text-white">{t.howTitle}</span>
          <p className="text-slate-400 leading-relaxed whitespace-pre-line">{t.howText}</p>
        </div>
      </div>

      <ClaimForm userEmail={user.email} t={t} />
    </div>
  )
}
