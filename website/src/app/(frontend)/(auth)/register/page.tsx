import { getFormTexts } from '@/lib/form-texts'
import { RegisterForm } from './RegisterForm'

// Wording from the CMS (Forms & messages → Sign-in pages)
export const dynamic = 'force-dynamic'

export default async function RegisterPage() {
  const t = (await getFormTexts()).signIn
  return <RegisterForm t={t} />
}
