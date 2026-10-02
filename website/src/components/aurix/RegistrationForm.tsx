'use client'

import React, { useMemo, useState } from 'react'
import { AlertCircle, CheckCircle2, ExternalLink, Loader2, Plus, Trash2, Upload } from 'lucide-react'

export interface RegistrationEventOption {
  slug: string
  title: string
  fee: number | null
  minTeam: number
  maxTeam: number
}

interface MemberInput {
  name: string
  email: string
  phone: string
  college: string
  file: File | null
}

interface SuccessResult {
  registrationCode: string
  eventTitle: string
  amountDue: number | null
  paymentUrl: string
}

const MAX_UPLOAD_BYTES = 2 * 1024 * 1024
const emptyMember = (college = ''): MemberInput => ({ name: '', email: '', phone: '', college, file: null })

/** Shrinks photos in the browser (max 1600 px, JPEG) so uploads stay small; PDFs are sent as-is. */
async function prepareIdFile(file: File): Promise<File> {
  if (file.type === 'application/pdf' || !file.type.startsWith('image/')) return file
  try {
    const bitmap = await createImageBitmap(file)
    const scale = Math.min(1, 1600 / Math.max(bitmap.width, bitmap.height))
    const canvas = document.createElement('canvas')
    canvas.width = Math.round(bitmap.width * scale)
    canvas.height = Math.round(bitmap.height * scale)
    canvas.getContext('2d')?.drawImage(bitmap, 0, 0, canvas.width, canvas.height)
    for (const quality of [0.82, 0.7, 0.55]) {
      const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/jpeg', quality))
      if (blob && blob.size <= MAX_UPLOAD_BYTES) {
        return new File([blob], file.name.replace(/\.[^.]+$/, '') + '.jpg', { type: 'image/jpeg' })
      }
    }
  } catch {
    // Fall back to the original file; the size check below still applies
  }
  return file
}

const inputClass =
  'w-full px-3 py-2.5 rounded-lg bg-aurix-dark border border-aurix-border text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-aurix-orange'

export function RegistrationForm({
  events,
  initialEvent,
}: {
  events: RegistrationEventOption[]
  initialEvent?: string
}) {
  const [eventSlug, setEventSlug] = useState(
    events.some((e) => e.slug === initialEvent) ? (initialEvent as string) : events[0]?.slug || ''
  )
  const event = useMemo(() => events.find((e) => e.slug === eventSlug), [events, eventSlug])
  const [teamName, setTeamName] = useState('')
  const [members, setMembers] = useState<MemberInput[]>(() =>
    Array.from({ length: Math.max(1, event?.minTeam || 1) }, () => emptyMember())
  )
  const [consent, setConsent] = useState(false)
  const [website, setWebsite] = useState('') // honeypot
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<SuccessResult | null>(null)

  const minTeam = event?.minTeam || 1
  const maxTeam = event?.maxTeam || 5

  const changeEvent = (slug: string) => {
    setEventSlug(slug)
    const next = events.find((e) => e.slug === slug)
    if (!next) return
    setMembers((prev) => {
      const sized = prev.slice(0, next.maxTeam)
      while (sized.length < next.minTeam) sized.push(emptyMember(sized[0]?.college || ''))
      return sized
    })
  }

  const updateMember = (index: number, patch: Partial<MemberInput>) =>
    setMembers((prev) => prev.map((m, i) => (i === index ? { ...m, ...patch } : m)))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    if (!event) return setError('Please choose a competition.')
    if (members.length < minTeam || members.length > maxTeam) {
      return setError(`This competition needs ${minTeam === maxTeam ? minTeam : `${minTeam}–${maxTeam}`} team members.`)
    }
    if (members.some((m) => m.college.trim().length < 2)) return setError('Please enter the university / college for every team member.')
    if (members.some((m) => !m.file)) return setError('Please upload a student ID card for every team member.')
    if (!consent) return setError('Please accept the declaration to continue.')

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
          members: members.map(({ name, email, phone, college }) => ({ name, email, phone, college })),
        })
      )
      for (let i = 0; i < members.length; i++) {
        const prepared = await prepareIdFile(members[i].file as File)
        if (prepared.size > MAX_UPLOAD_BYTES) {
          throw new Error(`The ID file for ${members[i].name || `member ${i + 1}`} is larger than 2 MB. Please use a smaller photo.`)
        }
        data.append(`id_${i}`, prepared, prepared.name)
      }

      const res = await fetch('/api/aurix/register', { method: 'POST', body: data })
      const body = await res.json().catch(() => ({}))
      if (!res.ok || !body.success) {
        throw new Error(body.message || 'Registration failed. Please try again.')
      }
      setResult(body as SuccessResult)
      window.scrollTo({ top: 0, behavior: 'smooth' })
    } catch (err: any) {
      setError(err.message || 'Registration failed. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  if (result) {
    return (
      <div className="aurix-card rounded-2xl p-6 sm:p-10 space-y-6 text-center max-w-2xl mx-auto">
        <CheckCircle2 className="w-12 h-12 text-green-400 mx-auto" />
        <div className="space-y-2">
          <h2 className="text-2xl sm:text-3xl font-display font-bold text-white">Registration received</h2>
          <p className="text-slate-300 text-sm">{result.eventTitle}</p>
        </div>
        <div className="rounded-xl bg-aurix-dark border border-aurix-border p-4 space-y-1">
          <div className="text-xs font-mono uppercase text-slate-400">Your registration code</div>
          <div className="text-2xl font-mono font-bold text-aurix-orange tracking-wider">{result.registrationCode}</div>
          <div className="text-xs text-slate-400">Save this code — you will need it if you contact the organizers.</div>
        </div>
        <div className="text-left text-sm text-slate-300 space-y-2">
          <p className="font-semibold text-white">Next step: pay the registration fee</p>
          <ul className="list-disc pl-5 space-y-1">
            <li>
              Amount: <strong>{result.amountDue ? `₹${result.amountDue}` : 'as shown on the payment page'}</strong> per team.
            </li>
            <li>Your details are pre-filled on the payment page. Please keep the same email and phone so we can match your payment.</li>
            <li>Your registration is confirmed only after your payment and student IDs are verified. You will receive an email once it is confirmed.</li>
          </ul>
        </div>
        <a
          href={result.paymentUrl}
          className="inline-flex items-center gap-2 px-8 py-3.5 rounded-lg bg-aurix-orange text-black font-semibold text-xs font-mono uppercase tracking-wider hover:bg-orange-400 transition-colors"
        >
          Proceed to payment <ExternalLink className="w-4 h-4" />
        </a>
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
          Website
          <input tabIndex={-1} autoComplete="off" value={website} onChange={(e) => setWebsite(e.target.value)} />
        </label>
      </div>

      <section className="space-y-4">
        <h2 className="text-lg font-display font-bold text-white">1. Competition &amp; team</h2>
        <label className="block space-y-1.5">
          <span className="text-xs font-mono uppercase text-slate-400">Competition</span>
          <select className={inputClass} value={eventSlug} onChange={(e) => changeEvent(e.target.value)} required>
            {events.map((ev) => (
              <option key={ev.slug} value={ev.slug}>
                {ev.title} {ev.fee !== null ? `— ₹${ev.fee}/team` : ''} ({ev.minTeam === ev.maxTeam ? ev.minTeam : `${ev.minTeam}–${ev.maxTeam}`} members)
              </option>
            ))}
          </select>
        </label>
        <label className="block space-y-1.5">
          <span className="text-xs font-mono uppercase text-slate-400">Team name</span>
          <input className={inputClass} value={teamName} onChange={(e) => setTeamName(e.target.value)} required minLength={2} maxLength={120} />
        </label>
      </section>

      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-display font-bold text-white">2. Team members</h2>
          <span className="text-xs font-mono text-slate-400">
            {members.length} / {maxTeam} {minTeam > 1 ? `(min ${minTeam})` : ''}
          </span>
        </div>
        <p className="text-xs text-slate-400">
          Every member must upload a clear photo or PDF of their student ID card (max 2 MB; photos are resized automatically).
        </p>

        {members.map((member, i) => (
          <div key={i} className="rounded-xl border border-aurix-border p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono uppercase text-aurix-orange font-bold">
                {i === 0 ? 'Team leader' : `Member ${i + 1}`}
              </span>
              {i > 0 && members.length > minTeam && (
                <button
                  type="button"
                  onClick={() => setMembers((prev) => prev.filter((_, j) => j !== i))}
                  className="inline-flex items-center gap-1 text-xs text-slate-400 hover:text-red-400"
                >
                  <Trash2 className="w-3.5 h-3.5" /> Remove
                </button>
              )}
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <input
                className={inputClass}
                placeholder="Full name"
                value={member.name}
                onChange={(e) => updateMember(i, { name: e.target.value })}
                required
              />
              <input
                className={inputClass}
                type="email"
                placeholder={i === 0 ? 'Email' : 'Email (optional)'}
                value={member.email}
                onChange={(e) => updateMember(i, { email: e.target.value })}
                required={i === 0}
              />
              <input
                className={inputClass}
                type="tel"
                placeholder={i === 0 ? 'Phone' : 'Phone (optional)'}
                value={member.phone}
                onChange={(e) => updateMember(i, { phone: e.target.value })}
                required={i === 0}
              />
            </div>
            <input
              className={inputClass}
              placeholder="University / college"
              value={member.college}
              onChange={(e) => updateMember(i, { college: e.target.value })}
              required
              minLength={2}
              maxLength={200}
            />
            <label className="flex items-center gap-3 text-xs text-slate-300 cursor-pointer">
              <span className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-aurix-dark border border-aurix-border hover:border-aurix-orange">
                <Upload className="w-3.5 h-3.5 text-aurix-orange" /> Student ID
              </span>
              <span className="truncate">{member.file ? member.file.name : 'No file chosen'}</span>
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
            <Plus className="w-3.5 h-3.5" /> Add member
          </button>
        )}
      </section>

      <section className="space-y-4">
        <h2 className="text-lg font-display font-bold text-white">3. Declaration</h2>
        <label className="flex items-start gap-3 text-sm text-slate-300">
          <input type="checkbox" className="mt-1" checked={consent} onChange={(e) => setConsent(e.target.checked)} />
          <span>
            I confirm the details above are correct, all members are currently enrolled students, and we agree to the
            competition rules. I understand our student ID cards are collected only to verify eligibility, are visible
            only to the organizers, and will be deleted after the event.
          </span>
        </label>
      </section>

      <button
        type="submit"
        disabled={submitting || !event}
        className="w-full inline-flex items-center justify-center gap-2 px-8 py-3.5 rounded-lg bg-aurix-orange text-black font-semibold text-sm font-mono uppercase tracking-wider hover:bg-orange-400 transition-colors disabled:opacity-60"
      >
        {submitting ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" /> Submitting…
          </>
        ) : (
          <>Register &amp; continue to payment</>
        )}
      </button>
    </form>
  )
}
