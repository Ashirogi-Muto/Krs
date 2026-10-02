import { headers } from 'next/headers'
import { redirect } from 'next/navigation'
import { getPayload } from 'payload'
import config from '@payload-config'
import type { Metadata } from 'next'
import { isSuperAdmin } from '@/payload/access/roles'
import { RETENTION_DAYS } from '@/lib/retention'
import RetentionPanel from './RetentionPanel'

export const dynamic = 'force-dynamic'
export const metadata: Metadata = { title: 'Data retention', robots: { index: false, follow: false } }

export default async function RetentionPage() {
  const payload = await getPayload({ config })
  const { user } = await payload.auth({ headers: await headers() })
  if (!user) redirect('/admin/login?redirect=%2Fretention')
  return (
    <main className="min-h-screen bg-aurix-dark text-slate-200 px-4 py-6">
      <div className="max-w-3xl mx-auto space-y-6">
        <header className="flex items-center justify-between gap-3">
          <div>
            <p className="text-xs font-mono uppercase tracking-wider text-aurix-orange">Privacy</p>
            <h1 className="text-2xl font-display font-bold text-white">Data retention</h1>
          </div>
          <a href="/admin" className="text-xs font-mono text-slate-400 hover:text-white">
            CMS →
          </a>
        </header>
        <p className="text-sm text-slate-400">
          Participants are told their data is kept for {RETENTION_DAYS} days after their event. Events listed here are past that date. Deleting
          removes the event&apos;s registrations, student ID files and confirmation emails permanently (copies in server backups age out within 7
          days). Download an export first if you need one.
        </p>
        {isSuperAdmin(user) ? <RetentionPanel /> : <p className="text-sm text-slate-400">Only the Super Admin can delete participant data.</p>}
      </div>
    </main>
  )
}
