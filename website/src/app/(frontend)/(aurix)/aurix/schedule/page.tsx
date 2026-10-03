import { CmsPage } from '@/components/blocks/CmsPage'
import { pageMetadata } from '@/lib/pages'

// Content comes from the CMS (Website → Pages → "/aurix/schedule"); re-read at most once a minute
export const revalidate = 60

export const generateMetadata = () => pageMetadata('/aurix/schedule')

export default function AurixSchedulePage() {
  return <CmsPage path="/aurix/schedule" />
}
