import React from 'react'
import Link from 'next/link'
import { Flame } from 'lucide-react'

/** Centered card in the AURIX look, used by the account pages (confirm email, forgot / reset password). */
export function AuthCard({ title, subtitle, children }: { title: string; subtitle?: string; children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-aurix-dark flex flex-col justify-center items-center p-4 sm:p-6 bg-aurix-grid">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center space-y-2">
          <Link href="/aurix" className="inline-flex items-center gap-2 group">
            <div className="w-10 h-10 rounded-lg bg-aurix-surface border border-aurix-border flex items-center justify-center text-aurix-orange group-hover:scale-105 transition-transform">
              <Flame className="w-5 h-5" />
            </div>
          </Link>
          <h1 className="text-2xl sm:text-3xl font-display font-extrabold text-white uppercase tracking-tight">{title}</h1>
          {subtitle && <p className="text-slate-400 text-xs font-mono">{subtitle}</p>}
        </div>
        <div className="aurix-card rounded-2xl p-6 sm:p-8 space-y-5 border-aurix-border">{children}</div>
      </div>
    </div>
  )
}
