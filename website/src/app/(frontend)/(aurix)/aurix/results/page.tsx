import { CmsPage } from '@/components/blocks/CmsPage'
import { pageMetadata } from '@/lib/pages'

// Content comes from the CMS (Website → Pages → "/aurix/results"); re-read at most once a minute
export const revalidate = 60

export const generateMetadata = () => pageMetadata('/aurix/results')

export default function AurixResultsPage() {
  return <CmsPage path="/aurix/results" />
}
