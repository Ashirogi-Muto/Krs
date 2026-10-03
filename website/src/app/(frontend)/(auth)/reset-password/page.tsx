import { AuthCard } from '@/components/auth/AuthCard'
import { getFormTexts } from '@/lib/form-texts'
import { ResetForm } from './ResetForm'

export const dynamic = 'force-dynamic'
export const metadata = { title: 'Choose a new password | AURIX', robots: { index: false, follow: false } }

/** The token is only used when the form is submitted (never on page load), so link scanners cannot use it up. */
export default async function ResetPasswordPage({ searchParams }: { searchParams: Promise<{ token?: string }> }) {
  const { token } = await searchParams
  const t = (await getFormTexts()).account
  return (
    <AuthCard title={t.resetTitle}>
      <ResetForm token={typeof token === 'string' ? token.slice(0, 200) : ''} t={t} />
    </AuthCard>
  )
}
