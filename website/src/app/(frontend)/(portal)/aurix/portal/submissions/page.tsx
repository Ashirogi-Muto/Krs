import React from 'react'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { getPayload } from 'payload'
import config from '@payload-config'
import { getSessionUser } from '@/lib/auth/session'
import { requireVisibleRoute } from '@/lib/visibility-guard'
import { getPortalTexts } from '@/lib/portal-texts'
import { FileCheck2, Clock, ArrowRight, Info, Download, Presentation } from 'lucide-react'
import { findTemplate, formatSize } from '@/lib/templates'
import { fill } from '@/lib/form-texts-defaults'
import { leaderRegistrations, submissionsOf, submittableRounds } from '@/lib/submissions'
import { eligible, roundOpen, shownDeadline } from '@/lib/submission-rules'
import { SubmissionForm } from '@/components/aurix/portal/SubmissionForm'

export const dynamic = 'force-dynamic'

// Tab title: CMS → Participant portal → submissions ("Browser-tab title")
export async function generateMetadata() {
  return {
    title: (await getPortalTexts()).submissions.tabTitle,
    robots: { index: false, follow: false, nocache: true },
  }
}

export default async function PortalSubmissionsPage() {
  await requireVisibleRoute('/aurix/portal')
  const user = await getSessionUser()
  if (!user) {
    redirect('/login')
  }

  const payload = await getPayload({ config })
  // Teams this account leads (only the leader's account is linked to a registration)
  const registrations = (await leaderRegistrations(payload, { id: Number(user.id), email: user.email })) as Record<string, any>[]
  const subs = await submissionsOf(payload, registrations.map((r) => r.id))
  const t = (await getPortalTexts()).submissions
  const now = new Date()
  const ist = (d: string) => new Date(d).toLocaleString('en-IN', { day: 'numeric', month: 'long', year: 'numeric', hour: 'numeric', minute: '2-digit', timeZone: 'Asia/Kolkata' })
  const mb = (n: number) => `${(n / 1024 / 1024).toFixed(1)} MB`
  const statusText: Record<string, string> = { SUBMITTED: t.stSubmitted, UNDER_REVIEW: t.stReview, QUALIFIED: t.stQualified, NOT_QUALIFIED: t.stNotQualified }
  const withRounds = registrations
    .map((reg) => ({ reg, event: typeof reg.event === 'object' ? reg.event : null }))
    .map((x) => ({ ...x, rounds: submittableRounds(x.event) }))
    .filter((x) => x.rounds.length > 0)
  // Official templates per event + round (R2 templates/<slug>/round-<n>/), looked up once per page
  const templates = new Map<string, Awaited<ReturnType<typeof findTemplate>>>()
  for (const { event, rounds } of withRounds) {
    for (const r of rounds) {
      const k = `${event?.slug}#${r.number}`
      if (event?.slug && !templates.has(k)) templates.set(k, await findTemplate(String(event.slug), r.number))
    }
  }

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

      {withRounds.length === 0 ? (
        <div className="aurix-card rounded-2xl p-8 sm:p-12 text-center space-y-5 border-aurix-border">
        <div className="w-14 h-14 rounded-2xl bg-aurix-dark border border-aurix-border flex items-center justify-center text-aurix-orange mx-auto">
          <Clock className="w-7 h-7" />
        </div>

        <div className="space-y-2 max-w-md mx-auto">
          <h2 className="text-xl font-display font-bold text-white">
            {t.closedTitle}
          </h2>
          <p className="text-slate-400 text-xs sm:text-sm leading-relaxed">
            {t.closedText}
          </p>
        </div>

        <div className="p-4 rounded-xl bg-aurix-dark/60 border border-aurix-border/60 text-left text-xs text-slate-300 max-w-lg mx-auto flex items-start gap-3">
          <Info className="w-4 h-4 text-aurix-orange shrink-0 mt-0.5" />
          <div className="space-y-1">
            <span className="font-bold text-white">{t.nowTitle}</span>
            <p className="text-slate-400 leading-relaxed">
              {t.nowText}
            </p>
          </div>
        </div>

        <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link
            href="/aurix/portal/announcements"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-lg bg-aurix-orange text-black font-semibold text-xs font-mono uppercase tracking-wider hover:bg-orange-400 transition-colors"
          >
            {t.bulletinsButton} <ArrowRight className="w-4 h-4" />
          </Link>
          <Link
            href="/aurix/portal"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-lg bg-aurix-dark border border-aurix-border text-slate-300 text-xs font-mono uppercase hover:text-white transition-colors"
          >
            {t.dashboardButton}
          </Link>
        </div>
      </div>
      ) : (
        withRounds.map(({ reg, event, rounds }) => (
          <section key={reg.id} className="aurix-card rounded-2xl p-5 sm:p-8 space-y-6 border-aurix-border">
            <div className="space-y-1">
              <div className="text-xs font-mono uppercase text-aurix-orange">{reg.registrationCode}</div>
              <h2 className="text-xl font-display font-bold text-white">{reg.teamName}</h2>
              <p className="text-sm text-slate-400">{event?.title || t.fallbackEvent}</p>
            </div>
            {rounds.map((round) => {
              const mine = subs.find((s) => s.registration === reg.id && s.roundNumber === round.number)
              const previous = subs.find((s) => s.registration === reg.id && s.roundNumber === round.number - 1)
              const ok = eligible(reg, round.number, previous)
              const open = roundOpen(round, now)
              const notYet = round.startDate && new Date(round.startDate).getTime() > now.getTime()
              const template = templates.get(`${event?.slug}#${round.number}`) || null
              return (
                <div key={round.number} className="rounded-xl border border-aurix-border p-4 sm:p-5 space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <h3 className="font-display font-bold text-white">{round.name}</h3>
                    {round.endDate && (
                      <span className="text-xs font-mono text-yellow-300">
                        {notYet && round.startDate ? fill(t.roundOpens, { date: ist(round.startDate) }) : fill(t.roundDeadline, { deadline: ist(shownDeadline(round, now) || round.endDate) })}
                      </span>
                    )}
                  </div>
                  {template && (
                    // Official template (owner, 11 Oct 2026): logged-in download from the private R2 bucket
                    <div className="relative overflow-hidden rounded-xl border-2 border-aurix-orange/70 bg-gradient-to-br from-aurix-orange/20 via-aurix-orange/5 to-transparent p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center gap-4 shadow-lg shadow-aurix-orange/10">
                      <div className="flex items-start gap-3 flex-1 min-w-0">
                        <div className="shrink-0 rounded-lg bg-aurix-orange/20 p-2.5">
                          <Presentation className="w-6 h-6 text-aurix-orange" />
                        </div>
                        <div className="min-w-0 space-y-1">
                          <div className="font-display font-bold text-white">{t.templateTitle}</div>
                          <p className="text-xs text-slate-300 leading-relaxed">{t.templateText}</p>
                          <p className="text-[11px] font-mono text-slate-400 truncate">{fill(t.templateMeta, { name: template.name, size: formatSize(template.size) })}</p>
                        </div>
                      </div>
                      <a
                        href={`/api/aurix/templates/${event?.slug}/${round.number}`}
                        className="shrink-0 inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-lg bg-aurix-orange text-black font-bold text-xs font-mono uppercase tracking-wider hover:bg-orange-400 transition-colors shadow-lg shadow-aurix-orange/30 animate-[pulse_2.5s_ease-in-out_3]"
                      >
                        <Download className="w-4 h-4" /> {t.templateButton}
                      </a>
                    </div>
                  )}
                  {mine && (
                    <div className="text-xs text-slate-300 space-y-1 p-3 rounded-lg bg-aurix-dark/60 border border-aurix-border/60">
                      <div className="flex items-center gap-2">
                        <FileCheck2 className="w-4 h-4 text-green-400" />
                        {mine.file?.filename
                          ? fill(t.current, { file: mine.file.filename, size: mb(mine.file.size || 0), date: ist(mine.submittedAt) })
                          : fill(t.currentNoFile, { date: ist(mine.submittedAt) })}
                      </div>
                      <div className="text-slate-400">{statusText[mine.status] || mine.status}</div>
                    </div>
                  )}
                  {!ok.ok ? (
                    <p className="text-sm text-slate-400">{ok.reason === 'notQualified' ? fill(t.notQualified, { n: round.number - 1 }) : t.inactive}</p>
                  ) : open ? (
                    <SubmissionForm
                      code={reg.registrationCode}
                      round={round.number}
                      kind={round.submissionType === 'CODE_AND_DEMO' ? 'CODE_AND_DEMO' : 'PROPOSAL'}
                      tracks={((event?.tracks || []) as any[]).map((tr) => String(tr.name))}
                      hasFile={Boolean(mine?.file?.key)}
                      initial={{ title: mine?.projectTitle || '', track: mine?.track || '', repositoryUrl: mine?.repositoryUrl || '', demoUrl: mine?.demoUrl || '' }}
                      t={t}
                    />
                  ) : !notYet ? (
                    <p className="text-sm text-slate-400">{t.roundClosed}</p>
                  ) : null}
                </div>
              )
            })}
          </section>
        ))
      )}
    </div>
  )
}
