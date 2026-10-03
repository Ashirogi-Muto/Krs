import { getFormTexts } from '@/lib/form-texts'
import { LoginForm } from './LoginForm'

// Wording from the CMS (Forms & messages → Sign-in pages)
export const dynamic = 'force-dynamic'

export default async function LoginPage() {
  const t = (await getFormTexts()).signIn
  return <LoginForm t={t} />
}
