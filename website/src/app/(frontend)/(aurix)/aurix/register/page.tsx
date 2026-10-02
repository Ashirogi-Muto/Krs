import React from 'react'
import { getEventsBySeries } from '@/lib/data/events'
import { constructMetadata } from '@/lib/seo/metadata'
import { RegistrationForm, type RegistrationEventOption } from '@/components/aurix/RegistrationForm'

export const dynamic = 'force-dynamic'

export const metadata = constructMetadata({
  title: 'Register | AURIX 2026',
  description: 'Register your team for AURIX 2026 competitions at IILM University, Greater Noida.',
  path: '/aurix/register',
})

export default async function RegisterPage({
  searchParams,
}: {
  searchParams: Promise<{ event?: string }>
}) {
  const { event: initialEvent } = await searchParams
  const now = Date.now()
  const events: RegistrationEventOption[] = (await getEventsBySeries('AURIX'))
    .filter(
      (e) =>
        !e.comingSoon &&
        e.status === 'REGISTRATION_OPEN' &&
        (!e.registrationClose || new Date(e.registrationClose).getTime() > now)
    )
    .map((e) => ({
      slug: e.slug,
      title: e.title,
      fee: e.registrationFee,
      minTeam: e.minTeamSize ?? 1,
      maxTeam: e.maxTeamSize ?? 5,
    }))

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-20 space-y-10">
      <div className="space-y-4 text-center">
        <span className="text-xs font-mono text-aurix-orange uppercase tracking-wider">AURIX 2026 // Registration</span>
        <h1 className="text-3xl sm:text-5xl font-display font-extrabold text-white tracking-tight">Register Your Team</h1>
        <p className="text-slate-300 text-sm sm:text-base max-w-2xl mx-auto leading-relaxed">
          Fill in your team details and upload each member&apos;s student ID. You&apos;ll then be taken to the payment
          page with your details already filled in. Already registered?{' '}
          <a href="/aurix/status" className="text-aurix-orange hover:underline">
            Check your status
          </a>
          .
        </p>
      </div>

      {events.length > 0 ? (
        <RegistrationForm events={events} initialEvent={initialEvent} />
      ) : (
        <div className="aurix-card rounded-2xl p-8 text-center text-slate-300 max-w-2xl mx-auto">
          Registration is not open right now. Please check back soon.
        </div>
      )}
    </div>
  )
}
