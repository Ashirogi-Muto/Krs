import React from 'react'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { getPayload } from 'payload'
import config from '@payload-config'
import type { Metadata } from 'next'
import { getSessionUser } from '@/lib/auth/session'
import { getFormTexts } from '@/lib/form-texts'
import { fill } from '@/lib/form-texts-defaults'
import { formatDeadline, reuploadableFor } from '@/lib/id-reupload'
import { IdReuploadForm } from '@/components/aurix/IdReuploadForm'

// Personal page (a logged-in team leader's registrations): never cached or indexed
export const dynamic = 'force-dynamic'

export async function generateMetadata(): Promise<Metadata> {
  return { title: (await getFormTexts()).idUpdate.tabTitle, robots: { index: false, follow: false, nocache: true } }
}

/**
 * Student ID re-upload (owner, 8 Oct 2026): only teams whose ID check was rejected see the upload form; everyone else
 * sees "nothing to update". Works while the participant portal is hidden. Wording: Labels & messages → Student ID re-upload page.
 */
export default async function UpdateIdPage() {
  const user = await getSessionUser()
  if (!user) redirect('/login?next=/aurix/update-id')
  const T = (await getFormTexts()).idUpdate
  const regs = user.emailVerified ? await reuploadableFor(await getPayload({ config }), { id: Number(user.id), email: user.email }) : []
  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-16 space-y-8">
      <div className="space-y-3">
        <span className="text-xs font-mono uppercase tracking-wider text-aurix-orange">{T.eyebrow}</span>
        <h1 className="text-3xl sm:text-4xl font-display font-extrabold text-white tracking-tight">{T.title}</h1>
        {regs.length > 0 && <p className="text-slate-400 text-sm leading-relaxed">{T.intro}</p>}
      </div>
      {regs.length === 0 ? (
        <div className="aurix-card rounded-2xl p-6 space-y-4">
          <p className="text-slate-300 text-sm">{T.none}</p>
          <Link href="/aurix/status" className="text-sm text-aurix-orange hover:underline">
            {T.statusLink}
          </Link>
        </div>
      ) : (
        regs.map((r) => (
          <IdReuploadForm
            key={r.id}
            t={T}
            reg={{
              code: r.registrationCode,
              team: r.teamName,
              event: r.event && typeof r.event === 'object' ? r.event.title : '',
              reason: r.idRejectReason || '',
              deadline: r.idReuploadDeadline ? fill(T.deadline, { deadline: formatDeadline(r.idReuploadDeadline) }) : '',
              members: (r.members || []).map((m: any) => ({ name: m.name, hasCard: Boolean(m.idDocument) })),
            }}
          />
        ))
      )}
    </div>
  )
}
