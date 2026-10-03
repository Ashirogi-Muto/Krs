import { CmsPage } from '@/components/blocks/CmsPage'
import { pageMetadata } from '@/lib/pages'

// Content comes from the CMS (Website → Pages → "/aurix/rules"); re-read at most once a minute
export const revalidate = 60

export const generateMetadata = () => pageMetadata('/aurix/rules')

export default function AurixRulesPage() {
  return <CmsPage path="/aurix/rules" />
}
