import { headers } from 'next/headers'
import { redirect } from 'next/navigation'
import { getPayload } from 'payload'
import config from '@payload-config'
import type { Metadata } from 'next'
import { checkInScope } from '@/payload/access/roles'
import CheckInDesk from './CheckInDesk'

export const dynamic = 'force-dynamic'
export const metadata: Metadata = { title: 'Check-in desk', robots: { index: false, follow: false } }

/** Event-day check-in for staff (sign in at /admin first). Who may use it: checkInScope() in access/roles.ts. */
export default async function CheckInPage() {
  const payload = await getPayload({ config })
  const { user } = await payload.auth({ headers: await headers() })
  if (!user) redirect('/admin/login?redirect=%2Fcheckin')
  const scope = checkInScope(user)

  return (
    <main className="min-h-screen bg-aurix-dark text-slate-200 px-4 py-6">
      <div className="max-w-2xl mx-auto space-y-6">
        <header className="flex items-center justify-between gap-3">
          <div>
            <p className="text-xs font-mono uppercase tracking-wider text-aurix-orange">AURIX 2026</p>
            <h1 className="text-2xl font-display font-bold text-white">Check-in desk</h1>
          </div>
          <a href="/admin" className="text-xs font-mono text-slate-400 hover:text-white">
            CMS →
          </a>
        </header>
        {scope ? (
          <CheckInDesk limited={scope !== 'all'} />
        ) : (
          <p className="text-sm text-slate-400">
            Your account has no check-in access. Ask an admin to give you the Registration, Logistics or Technical event role.
          </p>
        )}
      </div>
    </main>
  )
}
