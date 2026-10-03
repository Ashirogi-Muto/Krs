import { AuthCard } from '@/components/auth/AuthCard'
import { getFormTexts } from '@/lib/form-texts'
import { ForgotForm } from './ForgotForm'

export const dynamic = 'force-dynamic'
export const metadata = { title: 'Reset password | AURIX', robots: { index: false, follow: false } }

export default async function ForgotPasswordPage() {
  const t = (await getFormTexts()).account
  return (
    <AuthCard title={t.forgotTitle}>
      <ForgotForm t={t} />
    </AuthCard>
  )
}
