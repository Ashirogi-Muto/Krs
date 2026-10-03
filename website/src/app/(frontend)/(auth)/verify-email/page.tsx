import Link from 'next/link'
import { CheckCircle2, XCircle } from 'lucide-react'
import { getPayload } from 'payload'
import config from '@payload-config'
import { AuthCard } from '@/components/auth/AuthCard'
import { confirmEmail } from '@/lib/auth/participant'
import { getFormTexts } from '@/lib/form-texts'

export const dynamic = 'force-dynamic'
export const metadata = { title: 'Confirm email | AURIX', robots: { index: false, follow: false } }

/** Opened from the confirmation email: confirms the address (single-use link) and links earlier registrations. */
export default async function VerifyEmailPage({ searchParams }: { searchParams: Promise<{ token?: string }> }) {
  const { token } = await searchParams
  const t = (await getFormTexts()).account
  const result = token ? await confirmEmail(await getPayload({ config }), String(token)) : ({ ok: false, reason: 'invalid' } as const)
  const btn =
    'inline-flex items-center justify-center gap-2 px-6 py-3 rounded-lg bg-aurix-orange text-black font-semibold text-xs font-mono uppercase hover:bg-orange-400 transition-colors'
  return (
    <AuthCard title={result.ok ? t.verifiedTitle : t.gateTitle}>
      {result.ok ? (
        <div className="space-y-5 text-center">
          <CheckCircle2 className="w-12 h-12 text-green-400 mx-auto" />
          <p className="text-slate-300 text-sm">{t.verifiedText}</p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link href="/aurix/register" className={btn}>
              {t.verifiedButton}
            </Link>
            <Link href="/aurix/portal" className="text-xs font-mono text-slate-300 hover:text-white self-center">
              {t.portalButton}
            </Link>
          </div>
        </div>
      ) : (
        <div className="space-y-5 text-center">
          <XCircle className="w-12 h-12 text-red-400 mx-auto" />
          <p className="text-slate-300 text-sm">{result.reason === 'expired' ? t.verifyExpired : t.verifyInvalid}</p>
          <Link href="/login?next=/aurix/portal" className={btn}>
            {t.loginButton}
          </Link>
        </div>
      )}
    </AuthCard>
  )
}
