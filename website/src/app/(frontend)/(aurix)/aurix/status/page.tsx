import React from 'react'
import Link from 'next/link'
import { constructMetadata } from '@/lib/seo/metadata'
import { StatusLookup } from '@/components/aurix/StatusLookup'

export const dynamic = 'force-dynamic'

export const metadata = constructMetadata({
  title: 'Registration Status | AURIX 2026',
  description: 'Check the status of your AURIX 2026 team registration, payment and ID verification.',
  path: '/aurix/status',
  noIndex: true,
})

export default async function StatusPage({ searchParams }: { searchParams: Promise<{ code?: string }> }) {
  const { code } = await searchParams
  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-20 space-y-10">
      <div className="space-y-4 text-center">
        <span className="text-xs font-mono text-aurix-orange uppercase tracking-wider">AURIX 2026 // Registration status</span>
        <h1 className="text-3xl sm:text-5xl font-display font-extrabold text-white tracking-tight">Check Your Registration</h1>
        <p className="text-slate-300 text-sm sm:text-base max-w-2xl mx-auto leading-relaxed">
          Enter the registration code you received and the team leader&apos;s email. Not registered yet?{' '}
          <Link href="/aurix/register" className="text-aurix-orange hover:underline">
            Register your team
          </Link>
          .
        </p>
      </div>
      <StatusLookup initialCode={typeof code === 'string' ? code.slice(0, 20) : undefined} />
    </div>
  )
}
