import { headers } from 'next/headers'
import { redirect } from 'next/navigation'
import { getPayload } from 'payload'
import config from '@payload-config'
import type { Metadata } from 'next'
import { can } from '@/payload/access/permissions'
import { RETENTION_DAYS } from '@/lib/retention'
import RetentionPanel from './RetentionPanel'
import { getStaffTexts } from '@/lib/staff-texts'
import { fill } from '@/lib/form-texts-defaults'

export const dynamic = 'force-dynamic'
export async function generateMetadata(): Promise<Metadata> {
  return { title: (await getStaffTexts()).retention.tabTitle, robots: { index: false, follow: false } }
}

export default async function RetentionPage() {
  const payload = await getPayload({ config })
  const { user } = await payload.auth({ headers: await headers() })
  if (!user) redirect('/admin/login?redirect=%2Fretention')
  const staff = await getStaffTexts(payload)
  const t = staff.retention // wording: CMS → Admin tools → Staff & admin texts
  return (
    <main className="min-h-screen bg-aurix-dark text-slate-200 px-4 py-6">
      <div className="max-w-3xl mx-auto space-y-6">
        <header className="flex items-center justify-between gap-3">
          <div>
            <p className="text-xs font-mono uppercase tracking-wider text-aurix-orange">{t.eyebrow}</p>
            <h1 className="text-2xl font-display font-bold text-white">{t.title}</h1>
          </div>
          <a href="/admin" className="text-xs font-mono text-slate-400 hover:text-white">
            {staff.checkin.cmsLink}
          </a>
        </header>
        <p className="text-sm text-slate-400">
          {fill(t.intro, { days: RETENTION_DAYS })}
        </p>
        {can(user as any, 'admin.retention') ? <RetentionPanel t={t} /> : <p className="text-sm text-slate-400">{t.noAccess}</p>}
      </div>
    </main>
  )
}
