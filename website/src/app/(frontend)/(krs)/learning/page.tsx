import { CmsPage } from '@/components/blocks/CmsPage'
import { pageMetadata } from '@/lib/pages'

// Content comes from the CMS (Website → Pages → "/learning"); re-read at most once a minute
export const revalidate = 60

export const generateMetadata = () => pageMetadata('/learning')

export default function LearningPage() {
  return <CmsPage path="/learning" />
}
