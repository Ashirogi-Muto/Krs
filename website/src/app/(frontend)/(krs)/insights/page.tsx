import { CmsPage } from '@/components/blocks/CmsPage'
import { pageMetadata } from '@/lib/pages'

// Content comes from the CMS (Website → Pages → "/insights"); re-read at most once a minute
export const revalidate = 60

export const generateMetadata = () => pageMetadata('/insights')

export default function InsightsPage() {
  return <CmsPage path="/insights" />
}
