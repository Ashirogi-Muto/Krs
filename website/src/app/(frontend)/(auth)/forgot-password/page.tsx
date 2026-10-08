import { requireVisibleRoute } from '@/lib/visibility-guard'
import { AuthCard } from '@/components/auth/AuthCard'
import { getFormTexts } from '@/lib/form-texts'
import { ForgotForm } from './ForgotForm'

export const dynamic = 'force-dynamic'
export async function generateMetadata() {
  return { title: (await getFormTexts()).seo.tabForgot, robots: { index: false, follow: false } }
}

export default async function ForgotPasswordPage() {
  await requireVisibleRoute('/forgot-password')
  const texts = await getFormTexts()
  const t = { ...texts.account, errTryLater: texts.general.errTryLater }
  return (
    <AuthCard title={t.forgotTitle}>
      <ForgotForm t={t} />
    </AuthCard>
  )
}
