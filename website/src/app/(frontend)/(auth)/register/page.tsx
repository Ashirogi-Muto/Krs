import { getFormTexts } from '@/lib/form-texts'
import { getNavigation } from '@/lib/navigation'
import { safeNext } from '@/lib/auth/participant'
import { isRouteVisibleOnServer } from '@/lib/visibility-guard'
import { RegisterForm } from './RegisterForm'

// Wording from the CMS (Labels & messages); `next` = where to return after register (site paths only)
export const dynamic = 'force-dynamic'

export default async function RegisterPage({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  const [texts, nav] = await Promise.all([getFormTexts(), getNavigation()])
  const { next } = await searchParams
  // Where to go afterwards; a hidden page (e.g. the participant portal while it is off) would be a 404, so the status page
  const target = safeNext(next)
  const after = (await isRouteVisibleOnServer(target.split('?')[0])) ? target : '/aurix/status'
  return <RegisterForm t={texts.signIn} a={{ ...texts.account, errEmail: texts.general.errEmail }} next={after} logo={nav.aurix.logo} />
}
