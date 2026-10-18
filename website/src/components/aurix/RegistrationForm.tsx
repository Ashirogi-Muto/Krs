'use client'

import React, { useMemo, useState } from 'react'
import { MAX_UPLOAD_BYTES, prepareIdFile } from './id-file'
import { AlertCircle, CheckCircle2, Loader2, Plus, Trash2, Upload } from 'lucide-react'
import { DEFAULT_FORM_TEXTS, fill, type FormTexts } from '@/lib/form-texts-defaults'
import { YEAR_VALUES, cleanBranch } from '@/lib/member-details'
import { isSchoolYear } from '@/lib/school-entry'
import { DEFAULT_SCHOOL_TEXTS, type SchoolTexts } from '@/lib/school-texts-defaults'
import { DEFAULT_EVENT_LABELS } from '@/lib/event-labels-defaults'

export interface RegistrationEventOption {
  slug: string
  title: string
  fee: number | null
  /** e.g. " / player" (empty = " / team") */
  feeSuffix?: string
  minTeam: number
  maxTeam: number
  /** Team size in words when it reads oddly as a number (e.g. "Solo (1 player)") */
  sizeText?: string
  /** Extra questions for every player (CMS → Events → Registration & fee) */
  questions?: { label: string; help?: string | null; required?: boolean | null; format?: string | null; maxLength?: number | null }[]
  /** Entry options (CMS → Events → Entry options, e.g. Solo / Squad): fee and team size per option */
  options?: { name: string; fee: number; feeSuffix?: string; minTeam: number; maxTeam: number }[]
}

/** Wording of the entry choice (CMS: Website → Event pages → Entry options) */
export type EntryTexts = { title: string; errChoose: string; onePlayer: string; players: string; exact: string }
const DEFAULT_ENTRY_TEXTS: EntryTexts = {
  title: DEFAULT_EVENT_LABELS.entryTitle,
  errChoose: DEFAULT_EVENT_LABELS.entryErrChoose,
  onePlayer: DEFAULT_EVENT_LABELS.entryOnePlayer,
  players: DEFAULT_EVENT_LABELS.entryPlayers,
  exact: DEFAULT_EVENT_LABELS.entryExact,
}

interface MemberInput {
  name: string
  email: string
  phone: string
  college: string
  branch: string
  year: string
  /** Answers to the competition's extra questions, in order */
  answers: string[]
  file: File | null
}

interface SuccessResult {
  registrationCode: string
  eventTitle: string
  amountDue: number | null
  feeSuffix?: string
  paymentUrl: string | null
  /** Free school entry (the server decided): no payment step */
  schoolEntry?: boolean
}

const emptyMember = (college = ''): MemberInput => ({ name: '', email: '', phone: '', college, branch: '', year: '', answers: [], file: null })

// Wording comes from the CMS (Forms & messages) via the server; defaults are today's text
const inputClass =
  'w-full px-3 py-2.5 rounded-lg bg-aurix-dark border border-aurix-border text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-aurix-orange'

export function RegistrationForm({
  events,
  initialEvent,
  t = DEFAULT_FORM_TEXTS.registration,
  rt = DEFAULT_FORM_TEXTS.receipt,
  st = DEFAULT_SCHOOL_TEXTS.form,
  et = DEFAULT_ENTRY_TEXTS,
  account,
}: {
  events: RegistrationEventOption[]
  initialEvent?: string
  t?: FormTexts['registration']
  /** Payment receipt wording (pop-up before paying, receipt step) */
  rt?: FormTexts['receipt']
  /** Free school entry wording (CMS: Website → School entry (free)) */
  st?: SchoolTexts['form']
  et?: EntryTexts
  /** The logged-in team leader: pre-filled, and the email is locked (the server uses the account email anyway) */
  account?: { name: string; email: string; phone: string; college: string; note?: string }
}) {
  const [eventSlug, setEventSlug] = useState(
    events.some((e) => e.slug === initialEvent) ? (initialEvent as string) : events[0]?.slug || ''
  )
  const event = useMemo(() => events.find((e) => e.slug === eventSlug), [events, eventSlug])
  const [teamName, setTeamName] = useState('')
  const [members, setMembers] = useState<MemberInput[]>(() =>
    Array.from({ length: Math.max(1, event?.minTeam || 1) }, (_, i) =>
      i === 0 && account
        ? { ...emptyMember(account.college), name: account.name, email: account.email, phone: account.phone }
        : emptyMember(account?.college || ''),
    )
  )
  const [consent, setConsent] = useState(false)
  // School entry (owner, 18 Oct 2026): the team leader is a school student → free; the server checks it again
  const [school, setSchool] = useState(false)
  const [website, setWebsite] = useState('') // honeypot
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<SuccessResult | null>(null)

  // Entry options (e.g. BGMI Solo / Squad): the chosen option's team size applies; the server checks it again
  const [entry, setEntry] = useState('')
  const options = event?.options || []
  const chosen = options.find((o) => o.name === entry) || null
  const minTeam = chosen ? chosen.minTeam : event?.minTeam || 1
  const maxTeam = chosen ? chosen.maxTeam : event?.maxTeam || 5
  const resize = (min: number, max: number) =>
    setMembers((prev) => {
      const sized = prev.slice(0, max)
      while (sized.length < min) sized.push(emptyMember(sized[0]?.college || ''))
      return sized
    })
  const optionSize = (o: { minTeam: number; maxTeam: number }) =>
    o.minTeam === o.maxTeam ? (o.minTeam === 1 ? et.onePlayer : fill(et.exact, { count: o.minTeam })) : fill(et.players, { min: o.minTeam, max: o.maxTeam })

  const changeEvent = (slug: string) => {
    setEventSlug(slug)
    setEntry('')
    const next = events.find((e) => e.slug === slug)
    if (!next) return
    resize(next.minTeam, next.maxTeam)
  }
  const chooseEntry = (name: string) => {
    setEntry(name)
    const o = options.find((x) => x.name === name)
    if (o) resize(o.minTeam, o.maxTeam)
  }

  const updateMember = (index: number, patch: Partial<MemberInput>) =>
    setMembers((prev) => prev.map((m, i) => (i === index ? { ...m, ...patch } : m)))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    if (!event) return setError(t.errChoose)
    if (options.length && !chosen) return setError(et.errChoose)
    if (members.length < minTeam || members.length > maxTeam) {
      return setError(fill(t.errMembers, { count: minTeam === maxTeam ? minTeam : `${minTeam}–${maxTeam}` }))
    }
    if (members.some((m) => m.college.trim().length < 2)) return setError(t.errCollege)
    if (members.some((m) => !m.email.trim() || !m.phone.trim())) return setError(t.errContact)
    const badBranch = members.find((m) => cleanBranch(m.branch) === false)
    if (badBranch) return setError(fill(t.errBranch, { name: badBranch.name || '—' }))
    if (school && !isSchoolYear(members[0]?.year)) return setError(st.errSchoolYear)
    if (!members[0]?.file) return setError(t.errId)
    if (!consent) return setError(t.errConsent)

    setSubmitting(true)
    try {
      const data = new FormData()
      data.append(
        'payload',
        JSON.stringify({
          eventSlug,
          teamName,
          consent: true,
          website,
          schoolStudent: school,
          entryOption: chosen ? chosen.name : '',
          members: members.map(({ name, email, phone, college, branch, year, answers }) => ({ name, email, phone, college, branch, year, answers: (event?.questions || []).map((_, q) => answers[q] || '') })),
        })
      )
      for (let i = 0; i < members.length; i++) {
        if (!members[i].file) continue // only the team leader's ID is required
        const prepared = await prepareIdFile(members[i].file as File)
        if (prepared.size > MAX_UPLOAD_BYTES) {
          throw new Error(fill(t.errFileSize, { name: members[i].name || `member ${i + 1}` }))
        }
        data.append(`id_${i}`, prepared, prepared.name)
      }

      const res = await fetch('/api/aurix/register', { method: 'POST', body: data })
      const body = await res.json().catch(() => ({}))
      if (!res.ok || !body.success) {
        throw new Error(body.message || t.errFailed)
      }
      setResult(body as SuccessResult)
      window.scrollTo({ top: 0, behavior: 'smooth' })
    } catch (err: any) {
      setError(err.message || t.errFailed)
    } finally {
      setSubmitting(false)
    }
  }

  if (result) {
    return (
      <div className="aurix-card rounded-2xl p-6 sm:p-10 space-y-6 text-center max-w-2xl mx-auto">
        <CheckCircle2 className="w-12 h-12 text-green-400 mx-auto" />
        <div className="space-y-2">
          <h2 className="text-2xl sm:text-3xl font-display font-bold text-white">{t.doneTitle}</h2>
          <p className="text-slate-300 text-sm">{result.eventTitle}</p>
        </div>
        <div className="rounded-xl bg-aurix-dark border border-aurix-border p-4 space-y-1">
          <div className="text-xs font-mono uppercase text-slate-400">{t.doneCode}</div>
          <div className="text-2xl font-mono font-bold text-aurix-orange tracking-wider">{result.registrationCode}</div>
          <div className="text-xs text-slate-400">
            {t.doneSave}{' '}
            <a href={`/aurix/status?code=${result.registrationCode}`} className="text-aurix-orange hover:underline">
              {t.doneStatusLink}
            </a>
            .
          </div>
        </div>
        {result.schoolEntry ? (
          <div className="text-left text-sm text-slate-300 space-y-2">
            <p className="font-semibold text-white">{st.doneFreeNext}</p>
            <p>{st.doneFreeConfirm}</p>
          </div>
        ) : (
        <div className="text-left text-sm text-slate-300 space-y-2">
          <p className="font-semibold text-white">{t.doneNext}</p>
          <ul className="list-disc pl-5 space-y-1">
            <li>
              {t.doneAmount} <strong>{result.amountDue ? `₹${result.amountDue}` : t.doneAmountUnknown}</strong> {result.feeSuffix ? result.feeSuffix.trim() : t.donePerTeam}
            </li>
            <li>{t.donePrefilled}</li>
            <li>{t.donePayCollege}</li>
            <li>
              {rt.doneStep.split('{link}')[0]}
              <a href="/aurix/payment-done" className="text-aurix-orange hover:underline">
                {rt.rowButton}
              </a>
              {rt.doneStep.split('{link}').slice(1).join('')}
            </li>
            <li>{t.doneConfirm}</li>
          </ul>
        </div>
        )}
        {result.paymentUrl && (
        <a href={result.paymentUrl} className="inline-flex items-center gap-2 px-8 py-3.5 rounded-lg bg-aurix-orange text-black font-semibold text-xs font-mono uppercase tracking-wider hover:bg-orange-400 transition-colors">
          {t.donePay}
        </a>
        )}
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="aurix-card rounded-2xl p-5 sm:p-8 space-y-8 max-w-3xl mx-auto" noValidate>
      {error && (
        <div className="p-3.5 rounded-lg bg-red-950/50 border border-red-800 text-red-300 text-sm flex items-start gap-2">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      {/* Honeypot: hidden from people, often filled in by bots */}
      <div aria-hidden="true" className="hidden">
        <label>
          {t.spamTrap}
          <input tabIndex={-1} autoComplete="off" value={website} onChange={(e) => setWebsite(e.target.value)} />
        </label>
      </div>

      <section className="space-y-4">
        <h2 className="text-lg font-display font-bold text-white">{t.step1}</h2>
        <label className="block space-y-1.5">
          <span className="text-xs font-mono uppercase text-slate-400">{t.competition}</span>
          <select className={inputClass} value={eventSlug} onChange={(e) => changeEvent(e.target.value)} required>
            {events.map((ev) => (
              <option key={ev.slug} value={ev.slug}>
                {`${ev.title} ${ev.fee !== null ? `— ₹${ev.fee}${ev.feeSuffix || '/team'}` : ''} (${ev.sizeText || `${ev.minTeam === ev.maxTeam ? ev.minTeam : `${ev.minTeam}–${ev.maxTeam}`} ${t.membersWord}`})`}
              </option>
            ))}
          </select>
        </label>
        {options.length > 0 && (
          // Entry options (e.g. Solo / Squad): one choice, required
          <fieldset className="space-y-2">
            <legend className="text-xs font-mono uppercase text-slate-400 mb-1.5">{et.title}</legend>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {options.map((o) => (
                <label
                  key={o.name}
                  className={`flex items-start gap-3 rounded-xl border p-4 cursor-pointer transition-colors ${entry === o.name ? 'border-aurix-orange bg-aurix-orange/10' : 'border-aurix-border hover:border-aurix-orange/60'}`}
                >
                  <input type="radio" name="entryOption" className="mt-1" checked={entry === o.name} onChange={() => chooseEntry(o.name)} />
                  <span className="space-y-0.5">
                    <span className="block font-display font-bold text-white">{o.name}</span>
                    <span className="block text-xs font-mono text-slate-300">{`₹${o.fee}${o.feeSuffix || ''} · ${optionSize(o)}`}</span>
                  </span>
                </label>
              ))}
            </div>
          </fieldset>
        )}
        <label className="block space-y-1.5">
          <span className="text-xs font-mono uppercase text-slate-400">{t.teamName}</span>
          <input className={inputClass} value={teamName} onChange={(e) => setTeamName(e.target.value)} required minLength={2} maxLength={120} />
        </label>
      </section>

      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-display font-bold text-white">{t.step2}</h2>
          <span className="text-xs font-mono text-slate-400">
            {members.length} / {maxTeam} {minTeam > 1 ? fill(t.minNote, { min: minTeam }) : ''}
          </span>
        </div>
        <p className="text-xs text-slate-400">
          {t.idHelp}
        </p>
        <div className={`rounded-xl border p-4 space-y-1.5 ${school ? 'border-emerald-500/70 bg-emerald-500/10' : 'border-aurix-border'}`}>
          <label className="flex items-start gap-3 text-sm text-white cursor-pointer">
            <input type="checkbox" className="mt-1" checked={school} onChange={(e) => setSchool(e.target.checked)} />
            <span className="font-semibold">{st.schoolCheck}</span>
          </label>
          {school && <p className="text-xs text-slate-300 pl-7">{st.schoolHelp}</p>}
        </div>

        {members.map((member, i) => (
          <div key={i} className="rounded-xl border border-aurix-border p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono uppercase text-aurix-orange font-bold">
                {i === 0 ? t.leader : fill(t.member, { n: i + 1 })}
              </span>
              {i > 0 && members.length > minTeam && (
                <button
                  type="button"
                  onClick={() => setMembers((prev) => prev.filter((_, j) => j !== i))}
                  className="inline-flex items-center gap-1 text-xs text-slate-400 hover:text-red-400"
                >
                  <Trash2 className="w-3.5 h-3.5" /> {t.remove}
                </button>
              )}
            </div>
            {i === 0 && account?.note && <p className="text-[11px] text-slate-400">{account.note}</p>}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <input
                className={inputClass}
                placeholder={t.fullName}
                value={member.name}
                onChange={(e) => updateMember(i, { name: e.target.value })}
                required
              />
              <input
                className={inputClass}
                type="email"
                placeholder={i === 0 ? t.email : t.emailOptional}
                value={member.email}
                onChange={(e) => updateMember(i, { email: e.target.value })}
                required
                readOnly={i === 0 && Boolean(account)}
                title={i === 0 && account ? account.note : undefined}
              />
              <input
                className={inputClass}
                type="tel"
                placeholder={i === 0 ? t.phone : t.phoneOptional}
                value={member.phone}
                onChange={(e) => updateMember(i, { phone: e.target.value })}
                required
              />
            </div>
            <input
              className={inputClass}
              placeholder={school && i === 0 ? st.schoolName : t.college}
              value={member.college}
              onChange={(e) => updateMember(i, { college: e.target.value })}
              required
              minLength={2}
              maxLength={200}
            />
            {/* Optional (owner, 11 Oct 2026): branch (letters only) and year / class, for college and school students */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <input
                className={inputClass}
                placeholder={t.branch}
                value={member.branch}
                onChange={(e) => updateMember(i, { branch: e.target.value })}
                maxLength={60}
                pattern="[A-Za-z ]*"
                title={fill(t.errBranch, { name: member.name || '—' })}
                autoComplete="off"
              />
              <select
                className={inputClass}
                value={member.year}
                onChange={(e) => updateMember(i, { year: e.target.value })}
                aria-label={t.year}
                required={school && i === 0}
              >
                <option value="">{school && i === 0 ? st.schoolClass : t.year}</option>
                {/* School entry: the leader chooses a school class only */}
                {!(school && i === 0) && (
                <optgroup label={t.yearCollegeGroup}>
                  {YEAR_VALUES.filter((v) => v.startsWith('Y')).map((v) => (
                    <option key={v} value={v}>
                      {(t as any)[`y${v}`]}
                    </option>
                  ))}
                </optgroup>
                )}
                <optgroup label={t.yearSchoolGroup}>
                  {YEAR_VALUES.filter((v) => v.startsWith('C')).map((v) => (
                    <option key={v} value={v}>
                      {(t as any)[`y${v}`]}
                    </option>
                  ))}
                </optgroup>
              </select>
            </div>
            {(event?.questions || []).length > 0 && (
              // The competition's own questions (e.g. BGMI: in-game name, player ID); checked again on the server
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {(event?.questions || []).map((q, qi) => (
                  <input
                    key={`${eventSlug}-${qi}`}
                    className={inputClass}
                    placeholder={q.help ? `${q.label} — ${q.help}` : q.label}
                    aria-label={q.label}
                    value={member.answers[qi] || ''}
                    onChange={(e) => {
                      const answers = [...member.answers]
                      answers[qi] = q.format === 'DIGITS' ? e.target.value.replace(/\D/g, '') : e.target.value
                      updateMember(i, { answers })
                    }}
                    required={q.required !== false}
                    maxLength={q.maxLength || 60}
                    inputMode={q.format === 'DIGITS' ? 'numeric' : undefined}
                    autoComplete="off"
                  />
                ))}
              </div>
            )}
            <label className="flex items-center gap-3 text-xs text-slate-300 cursor-pointer">
              <span className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-aurix-dark border border-aurix-border hover:border-aurix-orange">
                <Upload className="w-3.5 h-3.5 text-aurix-orange" /> {i === 0 ? (school ? st.schoolId : t.studentId) : t.studentIdOptional}
              </span>
              <span className="truncate">{member.file ? member.file.name : t.noFile}</span>
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp,application/pdf"
                className="sr-only"
                onChange={(e) => updateMember(i, { file: e.target.files?.[0] || null })}
              />
            </label>
          </div>
        ))}

        {members.length < maxTeam && (
          <button
            type="button"
            onClick={() => setMembers((prev) => [...prev, emptyMember(prev[0]?.college || '')])}
            className="inline-flex items-center gap-1.5 text-xs font-mono uppercase text-aurix-orange hover:underline"
          >
            <Plus className="w-3.5 h-3.5" /> {t.addMember}
          </button>
        )}
      </section>

      <section className="space-y-4">
        <h2 className="text-lg font-display font-bold text-white">{t.step3}</h2>
        <label className="flex items-start gap-3 text-sm text-slate-300">
          <input type="checkbox" className="mt-1" checked={consent} onChange={(e) => setConsent(e.target.checked)} />
          <span>{t.declaration}</span>
        </label>
      </section>

      <button
        type="submit"
        disabled={submitting || !event}
        className="w-full inline-flex items-center justify-center gap-2 px-8 py-3.5 rounded-lg bg-aurix-orange text-black font-semibold text-sm font-mono uppercase tracking-wider hover:bg-orange-400 transition-colors disabled:opacity-60"
      >
        {submitting ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" /> {t.submitting}
          </>
        ) : (
          <>{school ? st.submitFree : t.submit}</>
        )}
      </button>
    </form>
  )
}
