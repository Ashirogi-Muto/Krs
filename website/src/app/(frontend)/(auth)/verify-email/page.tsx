import Link from 'next/link'
import { XCircle } from 'lucide-react'
import { getPayload } from 'payload'
import config from '@payload-config'
import { AuthCard } from '@/components/auth/AuthCard'
import { findVerifyToken } from '@/lib/auth/participant'
import { getFormTexts } from '@/lib/form-texts'
import { VerifyForm } from './VerifyForm'
import { isRouteVisibleOnServer } from '@/lib/visibility-guard'

export const dynamic = 'force-dynamic'
export async function generateMetadata() {
  return { title: (await getFormTexts()).seo.tabConfirm, robots: { index: false, follow: false } }
}

/**
 * Opened from the confirmation email. Opening the link only checks it (mail scanners that open links no longer use
 * it up); the account password confirms the address (VerifyForm → /api/auth/verify-email).
 */
export default async function VerifyEmailPage({ searchParams }: { searchParams: Promise<{ token?: string }> }) {
  const { token } = await searchParams
  const texts = await getFormTexts()
  const t = { ...texts.account, errTryAgain: texts.general.errTryAgain }
  const check = token ? await findVerifyToken(await getPayload({ config }), String(token)) : ({ ok: false, reason: 'invalid' } as const)
  const btn =
    'inline-flex items-center justify-center gap-2 px-6 py-3 rounded-lg bg-aurix-orange text-black font-semibold text-xs font-mono uppercase hover:bg-orange-400 transition-colors'
  return (
    <AuthCard title={t.gateTitle}>
      {check.ok ? (
        <VerifyForm token={String(token)} t={t} portal={await isRouteVisibleOnServer('/aurix/portal')} />
      ) : (
        <div className="space-y-5 text-center">
          <XCircle className="w-12 h-12 text-red-400 mx-auto" />
          <p className="text-slate-300 text-sm">{check.reason === 'expired' ? t.verifyExpired : t.verifyInvalid}</p>
          <Link href="/login?next=/aurix/portal" className={btn}>
            {t.loginButton}
          </Link>
        </div>
      )}
    </AuthCard>
  )
}
