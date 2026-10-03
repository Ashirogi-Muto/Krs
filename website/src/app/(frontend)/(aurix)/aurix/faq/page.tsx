import { CmsPage } from '@/components/blocks/CmsPage'
import { pageMetadata } from '@/lib/pages'

// Content comes from the CMS (Website → Pages → "/aurix/faq"); re-read at most once a minute
export const revalidate = 60

export const generateMetadata = () => pageMetadata('/aurix/faq')

export default function AurixFaqPage() {
  return <CmsPage path="/aurix/faq" />
}
