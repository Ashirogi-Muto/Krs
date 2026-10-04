import React from 'react'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { getPayload } from 'payload'
import config from '@payload-config'
import { getSessionUser } from '@/lib/auth/session'
import { requireVisibleRoute } from '@/lib/visibility-guard'
import { getPortalTexts } from '@/lib/portal-texts'
import { fill } from '@/lib/form-texts-defaults'
import { Users, KeyRound, ShieldCheck, ArrowRight } from 'lucide-react'

export const dynamic = 'force-dynamic'

export const metadata = {
  title: 'Teams | AURIX Participant Portal',
  robots: {
    index: false,
    follow: false,
    nocache: true,
  },
}

export default async function PortalTeamsPage() {
  await requireVisibleRoute('/aurix/portal')
  const user = await getSessionUser()
  if (!user) {
    redirect('/login')
  }

  const payload = await getPayload({ config })
  const regResult = await payload.find({
    collection: 'event-registrations',
    where: {
      participants: {
        contains: user.id,
      },
    },
    depth: 2,
    overrideAccess: true,
  })

  const registrations = (regResult.docs || []) as Record<string, any>[]
  const t = (await getPortalTexts()).teams

  return (
    <div className="space-y-8 max-w-4xl">
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

      {registrations.length === 0 ? (
        <div className="aurix-card rounded-2xl p-8 sm:p-12 text-center space-y-5 border-aurix-border">
          <div className="w-14 h-14 rounded-2xl bg-aurix-dark border border-aurix-border flex items-center justify-center text-aurix-orange mx-auto">
            <Users className="w-7 h-7" />
          </div>
          <div className="space-y-1 max-w-md mx-auto">
            <h2 className="text-xl font-display font-bold text-white">
              {t.emptyTitle}
            </h2>
            <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
              {t.emptyText}
            </p>
          </div>
          <div className="pt-2">
            <Link
              href="/aurix/portal/claim"
              className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-lg bg-aurix-orange text-black font-semibold text-xs font-mono uppercase tracking-wider hover:bg-orange-400 transition-colors"
            >
              <KeyRound className="w-4 h-4" /> {t.emptyButton}
            </Link>
          </div>
        </div>
      ) : (
        <div className="space-y-8">
          {registrations.map((reg) => {
            const event = typeof reg.event === 'object' && reg.event !== null ? reg.event : null
            const eventTitle = event?.title || 'AURIX Competition'
            const members = Array.isArray(reg.members) ? reg.members : []

            return (
              <section key={reg.id} className="aurix-card rounded-2xl p-6 sm:p-8 space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-aurix-border/60 pb-4">
                  <div>
                    <span className="text-xs font-mono text-slate-400">{eventTitle}</span>
                    <h2 className="text-xl font-display font-bold text-white mt-0.5">
                      {reg.teamName}
                    </h2>
                  </div>

                  <div className="text-xs font-mono">
                    <span className="text-slate-400">{t.codeLabel} </span>
                    <strong className="text-aurix-orange font-bold">{reg.registrationCode}</strong>
                  </div>
                </div>

                {/* Member Table */}
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs font-mono">
                    <thead className="bg-aurix-dark border-b border-aurix-border text-slate-400 uppercase">
                      <tr>
                        <th className="p-3">{t.colName}</th>
                        <th className="p-3">{t.colCollege}</th>
                        <th className="p-3">{t.colRole}</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-aurix-border/60 text-slate-300">
                      {members.map((m: any, i: number) => (
                        <tr key={i}>
                          <td className="p-3 font-bold text-white flex items-center gap-2">
                            <ShieldCheck className="w-3.5 h-3.5 text-aurix-orange" />
                            {m.name}
                          </td>
                          <td className="p-3 text-slate-300">{m.college}</td>
                          <td className="p-3">
                            <span
                              className={`px-2 py-0.5 rounded text-[10px] ${
                                i === 0
                                  ? 'bg-orange-950/60 border border-orange-800 text-aurix-orange font-bold'
                                  : 'bg-aurix-dark border border-aurix-border text-slate-400'
                              }`}
                            >
                              {i === 0 ? t.leader : t.teammate}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="p-3.5 rounded-xl bg-aurix-dark/40 border border-aurix-border/40 text-xs font-mono text-slate-400 flex items-center justify-between">
                  <span>{members.length === 1 ? t.sizeOne : fill(t.sizeMany, { n: members.length })}</span>
                  <span className="text-slate-500">{t.statusLabel} {reg.status}</span>
                </div>
              </section>
            )
          })}
        </div>
      )}
    </div>
  )
}
