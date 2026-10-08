import React from 'react'
import Link from 'next/link'
import { Calendar, CheckCircle2, Clock, HelpCircle, MapPin } from 'lucide-react'
import { getAllEvents, getEventsBySeries, withoutHiddenEvents } from '@/lib/data/events'
import { getHiddenRoutes } from '@/lib/site-settings'
import { isVisibleIn } from '@/lib/visibility'
import { getAurixSchedule } from '@/lib/data/schedule'
import { formatDateRange, formatFee, formatINR, formatTeamSize } from '@/lib/format'
import { StatusLookup } from '@/components/aurix/StatusLookup'
import { RegistrationForm, type RegistrationEventOption } from '@/components/aurix/RegistrationForm'
import { getFormTexts } from '@/lib/form-texts'
import { headers } from 'next/headers'
import { getPayload } from 'payload'
import config from '@payload-config'
import { VerifyGate } from '@/components/auth/VerifyGate'
import { CmsLink, SectionHeader, accentText, container } from './shared'
import { accountRequired } from '@/lib/auth/participant'

type Ctx = { b: any; query?: Record<string, any> }
type Btn = { label: string; href: string; style?: string }

/** AURIX festival dates ("27–28 October 2026") from the earliest start to the latest end in Events. */
export async function aurixDates(month: 'short' | 'long' = 'long'): Promise<string> {
  const aurix = (await getAllEvents()).filter((e) => e.series === 'AURIX')
  const start = aurix.map((e) => e.startDate).filter(Boolean).sort()[0]
  const end = aurix.map((e) => e.endDate).filter(Boolean).sort().slice(-1)[0]
  return start ? formatDateRange(start, end, month) : (await getFormTexts()).general.datesTbaInText
}

export async function aurixPrizePool(): Promise<number> {
  return (await getAllEvents()).filter((e) => e.series === 'AURIX').reduce((sum, e) => sum + (e.prizePool || 0), 0)
}

const teamText = (e: any, prefix = '', fallback = 'Team') =>
  e.minTeamSize && e.maxTeamSize
    ? e.minTeamSize === e.maxTeamSize
      ? `${prefix}${e.minTeamSize} Members`
      : `${prefix}${e.minTeamSize}–${e.maxTeamSize} Members`
    : e.operatorCount
    ? `${e.operatorCount} Operator`
    : fallback

/** Numbered steps (AURIX "How to compete"). */
export async function StepsBlock({ b }: Ctx) {
  const steps = (b.steps || []).filter((s: any) => s?.title)
  const needsDates = steps.some((s: any) => String(s.text || '').includes('{dates}'))
  const dates = needsDates ? await aurixDates() : ''
  const aurix = b.theme !== 'krs'
  return (
    <section id={b.anchor || undefined} className={`${container} space-y-8`}>
      <SectionHeader eyebrow={b.eyebrow} title={b.title} intro={b.intro} theme={aurix ? 'aurix' : 'krs'} />
      <div className={`grid grid-cols-1 gap-6 ${steps.length >= 4 ? 'md:grid-cols-4' : steps.length === 3 ? 'md:grid-cols-3' : 'md:grid-cols-2'}`}>
        {steps.map((step: any, i: number) => (
          <div key={i} className={`${aurix ? 'aurix-card' : 'tech-card'} rounded-xl p-6 space-y-3`}>
            <span
              className={`w-8 h-8 rounded border font-mono text-xs font-bold flex items-center justify-center ${
                aurix ? 'bg-aurix-dark border-aurix-border text-aurix-orange' : 'bg-krs-dark border-krs-border text-krs-cyan'
              }`}
            >
              {String(i + 1).padStart(2, '0')}
            </span>
            <h3 className="font-display font-bold text-white text-base">{step.title}</h3>
            {step.text && <p className="text-slate-400 text-xs leading-relaxed">{String(step.text).replace(/\{dates\}/g, dates)}</p>}
          </div>
        ))}
      </div>
    </section>
  )
}

/** Table comparing all AURIX competitions (live from Events). */
export async function ComparisonTableBlock({ b }: Ctx) {
  const events = await withoutHiddenEvents((await getAllEvents()).filter((e) => e.series === 'AURIX'))
  const g = (await getFormTexts()).general
  const cols = [b.colName || 'Competition', b.colTeam || 'Team Composition', b.colFee || 'Registration Fee', b.colPrize || 'Prize Pool', b.colSpecs || 'Robot Constraints', b.colDates || 'Dates']
  return (
    <section id={b.anchor || undefined} className={`${container} space-y-6`}>
      <SectionHeader eyebrow={b.eyebrow} title={b.title} intro={b.intro} theme="aurix" />
      <div className="aurix-card rounded-2xl overflow-x-auto border-aurix-border">
        <table className="w-full text-left text-xs font-mono">
          <thead className="bg-aurix-dark border-b border-aurix-border text-slate-400 uppercase">
            <tr>
              {cols.map((c) => (
                <th key={c} className="p-4">
                  {c}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-aurix-border/60 text-slate-300">
            {events.map((ev) => (
              <tr key={ev.id}>
                <td className="p-4 font-bold text-white">{ev.title}</td>
                <td className="p-4">{ev.comingSoon ? g.comingSoon : formatTeamSize(ev.minTeamSize, ev.maxTeamSize, g)}</td>
                <td className="p-4">{formatFee(ev.registrationFee, ev.comingSoon, g)}</td>
                <td className="p-4 text-aurix-orange font-bold">{ev.prizePool ? formatINR(ev.prizePool) : '—'}</td>
                <td className="p-4">{ev.comingSoon ? '—' : ev.specsSummary || '—'}</td>
                <td className="p-4">{formatDateRange(ev.startDate, ev.endDate, 'short', g)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  )
}

/** Every competition's FAQ (edited per event in Events → FAQs). */
export async function EventFaqsBlock({ b }: Ctx) {
  const events = await withoutHiddenEvents((await getAllEvents()).filter((e) => e.series === 'AURIX' && e.faqs?.length))
  return (
    <section id={b.anchor || undefined} className={`${container} space-y-12`}>
      <SectionHeader eyebrow={b.eyebrow} title={b.title} intro={b.intro} theme="aurix" />
      {events.map((ev) => (
        <div key={ev.id} className="space-y-4">
          <h2 className="text-xl sm:text-2xl font-display font-bold text-white border-b border-aurix-border pb-2">
            {ev.title}
            {b.titleSuffix ?? ' FAQ'}
          </h2>
          <div className="space-y-3">
            {(ev.faqs || []).map((faq) => (
              <div key={faq.question} className="aurix-card rounded-xl p-5 space-y-2">
                <div className="flex items-start gap-2.5">
                  <HelpCircle className="w-4 h-4 text-aurix-orange shrink-0 mt-0.5" />
                  <h3 className="font-display font-bold text-white text-base">{faq.question}</h3>
                </div>
                <p className="text-slate-300 text-xs sm:text-sm leading-relaxed pl-6">{faq.answer}</p>
              </div>
            ))}
          </div>
        </div>
      ))}
    </section>
  )
}

/** Every competition's rulebook (edited per event in Events → Rules). */
export async function EventRulebooksBlock({ b }: Ctx) {
  const events = await withoutHiddenEvents((await getAllEvents()).filter((e) => e.series === 'AURIX'))
  const g = (await getFormTexts()).general
  return (
    <section id={b.anchor || undefined} className={`${container} space-y-16`}>
      <SectionHeader eyebrow={b.eyebrow} title={b.title} intro={b.intro} theme="aurix" />
      {events.map((ev) => (
        <div key={ev.id} id={ev.slug} className="aurix-card rounded-2xl p-6 sm:p-10 space-y-8 scroll-mt-24">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-aurix-border/60 pb-6">
            <div>
              <span className="text-xs font-mono text-aurix-orange uppercase font-bold tracking-wider">
                {b.badgePrefix ?? 'Rulebook // '}
                {ev.eventType}
              </span>
              <h2 className="text-2xl sm:text-3xl font-display font-bold text-white tracking-tight mt-1">{ev.title}</h2>
            </div>
            <Link
              href={`/aurix/${ev.slug}`}
              className="self-start sm:self-auto px-4 py-2 rounded bg-aurix-dark border border-aurix-border text-aurix-orange text-xs font-mono uppercase font-semibold hover:border-aurix-orange transition-colors"
            >
              {b.buttonLabel || 'View Full Event Page'}
            </Link>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs font-mono">
            {[
              [b.feeLabel || 'Fee', ev.registrationFee !== null ? `₹${ev.registrationFee}` : b.unpricedLabel || 'Unpriced', 'text-white'],
              [b.teamLabel || 'Team Size', teamText(ev, '', b.teamFallback || 'Team Entry'), 'text-white'],
              [b.datesLabel || 'Dates', formatDateRange(ev.startDate, ev.endDate, 'short', g), 'text-white'],
              [b.versionLabel || 'Version', b.versionValue || 'v1.0 (Official)', 'text-aurix-orange'],
            ].map(([label, value, cls]) => (
              <div key={label} className="p-3 rounded bg-aurix-dark border border-aurix-border">
                <span className="text-slate-500 block uppercase">{label}</span>
                <span className={`${cls} font-bold`}>{value}</span>
              </div>
            ))}
          </div>
          {ev.specialNotice && (
            <div className="p-4 rounded-xl bg-orange-950/30 border border-aurix-orange/50 text-xs text-slate-300">
              <strong className="text-aurix-orange font-mono uppercase mr-2">{b.noticeLabel || 'Notice:'}</strong>
              {ev.specialNotice}
            </div>
          )}
          {(ev.rulesSections || []).length > 0 && (
            <div className="space-y-6">
              {(ev.rulesSections || []).map((sec) => (
                <div key={sec.title} className="space-y-3">
                  <h3 className="font-display font-semibold text-white text-base">{sec.title}</h3>
                  <ul className="space-y-2 text-xs sm:text-sm text-slate-300">
                    {sec.rules.map((rule) => (
                      <li key={rule} className="flex items-start gap-2.5">
                        <CheckCircle2 className="w-4 h-4 text-aurix-orange shrink-0 mt-0.5" />
                        <span>{rule}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          )}
        </div>
      ))}
    </section>
  )
}

const dayLabel = (iso: string) =>
  new Date(iso).toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric', timeZone: 'Asia/Kolkata' })
const dateRange = (start: string, end: string, tba = 'Dates to be announced') => {
  const f = (iso: string) => new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'Asia/Kolkata' })
  if (!start) return tba
  return end && f(end) !== f(start) ? `${f(start)} – ${f(end)}` : f(start)
}

/** Event-day timetable (CMS: AURIX schedule); until filled in, the official dates of each competition. */
export async function ScheduleBlock({ b }: Ctx) {
  const [{ days }, events, hidden, texts] = await Promise.all([getAurixSchedule(), getEventsBySeries('AURIX').then(withoutHiddenEvents), getHiddenRoutes(), getFormTexts()])
  return (
    <section id={b.anchor || undefined} className={`${container} space-y-12`}>
      <SectionHeader eyebrow={b.eyebrow} title={b.title} intro={b.intro} theme="aurix" />
      {days.length === 0 && (
        <div className="space-y-4">
          {b.emptyText && <p className="text-slate-400 text-sm">{b.emptyText}</p>}
          <div className="grid gap-4 sm:grid-cols-2">
            {events.map((ev) => (
              <Link key={ev.id} href={`/aurix/${ev.slug}`} className="aurix-card rounded-xl p-5 space-y-1.5 hover:border-aurix-orange transition-colors">
                <h2 className="font-display font-bold text-white text-base">{ev.title}</h2>
                <p className="text-xs font-mono text-slate-400 flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-aurix-orange" />
                  {dateRange(ev.startDate, ev.endDate, texts.general.datesTba)}
                </p>
                {ev.venue && (
                  <p className="text-xs font-mono text-slate-400 flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-slate-500" />
                    {ev.venue}
                  </p>
                )}
              </Link>
            ))}
          </div>
        </div>
      )}
      {days.map((day) => (
        <div key={day.date} className="space-y-6">
          <div className="border-b border-aurix-border pb-3 flex flex-col sm:flex-row sm:items-baseline justify-between gap-1">
            <h2 className="text-xl sm:text-2xl font-display font-bold text-white">{dayLabel(day.date)}</h2>
            {day.title && <span className="text-xs font-mono text-aurix-orange">{day.title}</span>}
          </div>
          <div className="space-y-4">
            {day.items.map((ev, idx) => (
              <div key={`${ev.time}-${idx}`} className="aurix-card rounded-xl p-5 flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                <div className="space-y-1.5 flex-1">
                  {(ev.tag || ev.location) && (
                    <div className="flex flex-wrap items-center gap-2 text-xs font-mono">
                      {ev.tag &&
                        (ev.eventSlug && isVisibleIn(hidden, `/aurix/${ev.eventSlug}`) ? (
                          <Link href={`/aurix/${ev.eventSlug}`} className="px-2 py-0.5 rounded bg-aurix-dark text-aurix-orange border border-aurix-border font-bold hover:border-aurix-orange">
                            {ev.tag}
                          </Link>
                        ) : (
                          <span className="px-2 py-0.5 rounded bg-aurix-dark text-aurix-orange border border-aurix-border font-bold">{ev.tag}</span>
                        ))}
                      {ev.location && (
                        <span className="text-slate-400 flex items-center gap-1">
                          <MapPin className="w-3 h-3 text-slate-500" />
                          {ev.location}
                        </span>
                      )}
                    </div>
                  )}
                  <h3 className="font-display font-bold text-white text-base">{ev.title}</h3>
                  {ev.description && <p className="text-slate-400 text-xs leading-relaxed">{ev.description}</p>}
                </div>
                <div className="shrink-0 text-left sm:text-right">
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded bg-aurix-dark border border-aurix-border text-xs font-mono font-bold text-white">
                    <Clock className="w-3.5 h-3.5 text-aurix-orange" />
                    {ev.time}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </section>
  )
}

/** Results area. Zero fictional results: until results are published, a pending notice is shown. */
export function ResultsBlock({ b }: Ctx) {
  return (
    <section id={b.anchor || undefined} className={`${container} space-y-6`}>
      <SectionHeader eyebrow={b.eyebrow} title={b.title} intro={b.intro} theme="aurix" />
      <div className="aurix-card rounded-2xl p-8 sm:p-12 text-center space-y-5 bg-aurix-grid border-aurix-border">
        <div className="w-14 h-14 rounded-2xl bg-aurix-surface border border-aurix-border flex items-center justify-center text-aurix-orange mx-auto shadow-lg shadow-aurix-orange/10">
          <Clock className="w-7 h-7" />
        </div>
        <div className="space-y-2 max-w-md mx-auto">
          {b.pendingBadge && <span className="text-xs font-mono text-aurix-orange uppercase tracking-widest font-semibold">{b.pendingBadge}</span>}
          {b.pendingTitle && <h2 className="text-2xl font-display font-bold text-white">{b.pendingTitle}</h2>}
          {b.pendingText && <p className="text-slate-400 text-xs sm:text-sm leading-relaxed">{b.pendingText}</p>}
        </div>
        {(b.pendingButtons || []).length > 0 && (
          <div className="pt-2 flex flex-wrap justify-center gap-4 text-xs font-mono">
            {(b.pendingButtons as Btn[]).map((btn) => (
              <CmsLink
                key={btn.href + btn.label}
                href={btn.href}
                className={
                  (btn.style || 'primary') === 'primary'
                    ? 'px-5 py-2.5 rounded bg-aurix-orange text-black font-bold uppercase hover:bg-orange-400 transition-colors'
                    : 'px-5 py-2.5 rounded bg-aurix-dark border border-aurix-border text-slate-300 hover:text-white hover:border-aurix-orange transition-colors'
                }
              >
                {btn.label}
              </CmsLink>
            ))}
          </div>
        )}
      </div>
    </section>
  )
}

export async function StatusLookupBlock({ b, query = {} }: Ctx) {
  const code = typeof query.code === 'string' ? query.code.slice(0, 20) : undefined
  const t = await getFormTexts()
  return (
    <section id={b.anchor || undefined} className={container}>
      <StatusLookup initialCode={code} t={{ ...t.status, errLookup: t.general.errLookup }} />
    </section>
  )
}

/**
 * AURIX team registration. Needs a logged-in account with a confirmed email (the team leader); the server API
 * enforces the same. Only competitions open for registration and not past their closing date are listed.
 */
export async function RegistrationFormBlock({ b, query = {} }: Ctx) {
  const now = Date.now()
  const events: RegistrationEventOption[] = (await getEventsBySeries('AURIX'))
    .filter((e) => !e.comingSoon && e.status === 'REGISTRATION_OPEN' && (!e.registrationClose || new Date(e.registrationClose).getTime() > now))
    .map((e) => ({ slug: e.slug, title: e.title, fee: e.registrationFee, minTeam: e.minTeamSize ?? 1, maxTeam: e.maxTeamSize ?? 5 }))
  const initialEvent = typeof query.event === 'string' && /^[a-z0-9-]{1,80}$/.test(query.event) ? query.event : undefined
  const t = await getFormTexts()
  if (!events.length)
    return (
      <section id={b.anchor || undefined} className={container}>
        <div className="aurix-card rounded-2xl p-8 text-center text-slate-300 max-w-2xl mx-auto">
          {b.closedText || 'Registration is not open right now. Please check back soon.'}
        </div>
      </section>
    )

  const payload = await getPayload({ config })
  const { user } = await payload.auth({ headers: await headers() })
  const back = `/aurix/register${initialEvent ? `?event=${initialEvent}` : ''}`
  const requireAccount = accountRequired() // on unless explicitly switched off (see register API)
  const verified = Boolean(user && (user as any).emailVerified)
  let content: React.ReactNode
  if (!requireAccount && !verified) {
    content = <RegistrationForm events={events} initialEvent={initialEvent} t={t.registration} />
  } else if (!user) {
    const btn = 'inline-flex items-center justify-center gap-2 px-6 py-3 rounded-lg font-semibold text-xs font-mono uppercase transition-colors'
    content = (
      <div className="max-w-xl mx-auto aurix-card rounded-2xl p-6 sm:p-8 space-y-4 text-center">
        <h2 className="text-xl font-display font-bold text-white">{t.account.loginToRegister}</h2>
        <p className="text-slate-300 text-sm leading-relaxed">{t.account.loginToRegisterText}</p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
          <Link href={`/register?next=${encodeURIComponent(back)}`} className={`${btn} bg-aurix-orange text-black hover:bg-orange-400`}>
            {t.account.signupButton}
          </Link>
          <Link href={`/login?next=${encodeURIComponent(back)}`} className={`${btn} border border-aurix-border text-white hover:border-aurix-orange`}>
            {t.account.loginButton}
          </Link>
        </div>
      </div>
    )
  } else if (!(user as any).emailVerified) {
    content = <VerifyGate user={user as any} />
  } else {
    const u = user as any
    content = (
      <RegistrationForm
        events={events}
        initialEvent={initialEvent}
        t={t.registration}
        account={{ name: u.name || '', email: u.email, phone: u.phone || '', college: u.institution || '', note: t.account.leaderFromAccount }}
      />
    )
  }
  return (
    <section id={b.anchor || undefined} className={container}>
      {content}
    </section>
  )
}

export { accentText, teamText }
