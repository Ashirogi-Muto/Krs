import { CmsPage } from '@/components/blocks/CmsPage'
import { pageMetadata } from '@/lib/pages'

// Content comes from the CMS (Website → Pages → "/blogs"); re-read at most once a minute
export const revalidate = 60

export const generateMetadata = () => pageMetadata('/blogs')

export default function BlogsPage() {
  return <CmsPage path="/blogs" />
}
