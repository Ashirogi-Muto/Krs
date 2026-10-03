import { getFormTexts } from '@/lib/form-texts'
import { safeNext } from '@/lib/auth/participant'
import { RegisterForm } from './RegisterForm'

// Wording from the CMS (Labels & messages); `next` = where to return after register (site paths only)
export const dynamic = 'force-dynamic'

export default async function RegisterPage({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  const texts = await getFormTexts()
  const { next } = await searchParams
  return <RegisterForm t={texts.signIn} a={texts.account} next={safeNext(next)} />
}
