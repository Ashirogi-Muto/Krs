import React from 'react'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { headers } from 'next/headers'
import { getPayload } from 'payload'
import config from '@payload-config'
import { can } from '@/payload/access/permissions'
import { getJudgingTexts } from '@/lib/judging-texts'
import { fill } from '@/lib/form-texts-defaults'
import { ShieldCheck } from 'lucide-react'
import JudgeDesk from './JudgeDesk'

export const dynamic = 'force-dynamic'

// Judge portal (owner, 20 Oct 2026): judges score the rounds they are picked for (CMS → AURIX → Judging rounds).
// Every text: CMS → Website → Judging texts → Judge portal.
export async function generateMetadata() {
  return { title: (await getJudgingTexts()).judge.tabTitle, robots: { index: false, follow: false } }
}

export default async function JudgePortalPage() {
  const payload = await getPayload({ config })
  const { user } = await payload.auth({ headers: await headers() })
  if (!user) redirect('/login?next=%2Fjudge')
  const T = await getJudgingTexts()
  const t = T.judge
  const isJudge = (user as any).role === 'JUDGE'

  return (
    <div className="min-h-screen bg-aurix-dark text-slate-100 px-4 py-6 sm:p-10 max-w-6xl mx-auto space-y-6">
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-aurix-border pb-5">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono text-aurix-orange uppercase">
            <ShieldCheck className="w-4 h-4" />
            {t.eyebrow}
          </div>
          <h1 className="text-3xl sm:text-4xl font-display font-extrabold text-white mt-1">{t.title}</h1>
          <p className="text-slate-400 text-xs font-mono mt-1">{fill(t.hello, { name: String((user as any).name || (user as any).email) })}</p>
        </div>
        <Link href="/aurix" className="self-start sm:self-auto px-4 py-2 rounded bg-aurix-surface border border-aurix-border text-xs font-mono text-slate-300 hover:text-white">
          {t.exit}
        </Link>
      </header>
      {isJudge ? (
        <JudgeDesk t={t} />
      ) : (
        <div className="space-y-3 text-sm text-slate-300">
          <p>{t.noAccess}</p>
          {can(user as any, 'judging.results') ? (
            <Link href="/judging" className="inline-block px-4 py-2 rounded bg-aurix-orange text-black font-semibold text-xs font-mono uppercase">
              {t.staffLink}
            </Link>
          ) : null}
        </div>
      )}
    </div>
  )
}
