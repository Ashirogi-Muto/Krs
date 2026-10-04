import { getFormTexts } from '@/lib/form-texts'
import { getNavigation } from '@/lib/navigation'
import { safeNext } from '@/lib/auth/participant'
import { RegisterForm } from './RegisterForm'

// Wording from the CMS (Labels & messages); `next` = where to return after register (site paths only)
export const dynamic = 'force-dynamic'

export default async function RegisterPage({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  const [texts, nav] = await Promise.all([getFormTexts(), getNavigation()])
  const { next } = await searchParams
  return <RegisterForm t={texts.signIn} a={texts.account} next={safeNext(next)} logo={nav.aurix.logo} />
}
