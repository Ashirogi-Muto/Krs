import { getFormTexts } from '@/lib/form-texts'
import { getNavigation } from '@/lib/navigation'
import { safeNext } from '@/lib/auth/participant'
import { LoginForm } from './LoginForm'

// Wording from the CMS (Labels & messages); `next` = where to return after login (site paths only)
export const dynamic = 'force-dynamic'

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  const [texts, nav] = await Promise.all([getFormTexts(), getNavigation()])
  const { next } = await searchParams
  return <LoginForm t={texts.signIn} next={safeNext(next)} logo={nav.aurix.logo} />
}
