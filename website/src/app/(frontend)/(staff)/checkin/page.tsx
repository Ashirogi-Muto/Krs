import { headers } from 'next/headers'
import { redirect } from 'next/navigation'
import { getPayload } from 'payload'
import config from '@payload-config'
import type { Metadata } from 'next'
import { checkInScope } from '@/payload/access/permissions'
import CheckInDesk from './CheckInDesk'
import { getStaffTexts } from '@/lib/staff-texts'

export const dynamic = 'force-dynamic'
export async function generateMetadata(): Promise<Metadata> {
  return { title: (await getStaffTexts()).checkin.tabTitle, robots: { index: false, follow: false } }
}

/** Event-day check-in for staff (sign in at /admin first). Who may use it: "Check-in desk" in the access roles (all events or only theirs; access/permissions.ts). */
export default async function CheckInPage() {
  const payload = await getPayload({ config })
  const { user } = await payload.auth({ headers: await headers() })
  if (!user) redirect('/admin/login?redirect=%2Fcheckin')
  const scope = checkInScope(user)
  const t = (await getStaffTexts(payload)).checkin // wording: CMS → Admin tools → Staff & admin texts

  return (
    <main className="min-h-screen bg-aurix-dark text-slate-200 px-4 py-6">
      <div className="max-w-2xl mx-auto space-y-6">
        <header className="flex items-center justify-between gap-3">
          <div>
            <p className="text-xs font-mono uppercase tracking-wider text-aurix-orange">{t.eyebrow}</p>
            <h1 className="text-2xl font-display font-bold text-white">{t.title}</h1>
          </div>
          <a href="/admin" className="text-xs font-mono text-slate-400 hover:text-white">
            {t.cmsLink}
          </a>
        </header>
        {scope ? (
          <CheckInDesk limited={scope !== 'all'} t={t} />
        ) : (
          <p className="text-sm text-slate-400">
            {t.noAccess}
          </p>
        )}
      </div>
    </main>
  )
}
