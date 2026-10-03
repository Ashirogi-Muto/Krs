import { CmsPage } from '@/components/blocks/CmsPage'
import { pageMetadata } from '@/lib/pages'

// Content comes from the CMS (Website → Pages → "/team"); re-read at most once a minute
export const revalidate = 60

export const generateMetadata = () => pageMetadata('/team')

export default function TeamPage() {
  return <CmsPage path="/team" />
}
