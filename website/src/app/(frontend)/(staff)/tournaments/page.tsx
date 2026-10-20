import { headers } from 'next/headers'
import { redirect } from 'next/navigation'
import { getPayload } from 'payload'
import config from '@payload-config'
import type { Metadata } from 'next'
import { can } from '@/payload/access/permissions'
import { getTournamentTexts } from '@/lib/tournament-texts'
import TournamentDesk from './TournamentDesk'

export const dynamic = 'force-dynamic'
export async function generateMetadata(): Promise<Metadata> {
  return { title: (await getTournamentTexts()).desk.tabTitle, robots: { index: false, follow: false } }
}

/** Sports tournaments (owner, 20 Oct 2026): "Run tournaments" / "Enter results only" in the access roles. */
export default async function TournamentsPage() {
  const payload = await getPayload({ config })
  const { user } = await payload.auth({ headers: await headers() })
  if (!user) redirect('/admin/login?redirect=%2Ftournaments')
  const T = await getTournamentTexts() // wording: CMS → Website → Tournament texts
  const ok = can(user as any, 'tournaments.manage') || can(user as any, 'tournaments.score')

  return (
    <main className="min-h-screen bg-aurix-dark text-slate-200 px-4 py-6">
      <div className="max-w-7xl mx-auto space-y-6">
        <header className="flex items-center justify-between gap-3">
          <div>
            <p className="text-xs font-mono uppercase tracking-wider text-aurix-orange">{T.desk.eyebrow}</p>
            <h1 className="text-2xl font-display font-bold text-white">{T.desk.title}</h1>
          </div>
          <a href="/admin" className="text-xs font-mono text-slate-400 hover:text-white">
            {T.desk.cmsLink}
          </a>
        </header>
        {ok ? <TournamentDesk t={T.desk} v={T.view} /> : <p className="text-sm text-slate-400">{T.desk.noAccess}</p>}
      </div>
    </main>
  )
}
