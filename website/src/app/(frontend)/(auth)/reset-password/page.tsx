import { AuthCard } from '@/components/auth/AuthCard'
import { getFormTexts } from '@/lib/form-texts'
import { ResetForm } from './ResetForm'

export const dynamic = 'force-dynamic'
export async function generateMetadata() {
  return { title: (await getFormTexts()).seo.tabReset, robots: { index: false, follow: false } }
}

/** The token is only used when the form is submitted (never on page load), so link scanners cannot use it up. */
export default async function ResetPasswordPage({ searchParams }: { searchParams: Promise<{ token?: string }> }) {
  const { token } = await searchParams
  const texts = await getFormTexts()
  const t = { ...texts.account, errTryAgain: texts.general.errTryAgain }
  return (
    <AuthCard title={t.resetTitle}>
      <ResetForm token={typeof token === 'string' ? token.slice(0, 200) : ''} t={t} />
    </AuthCard>
  )
}
