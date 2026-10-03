import { CmsPage } from '@/components/blocks/CmsPage'
import { pageMetadata } from '@/lib/pages'

// Content comes from the CMS (Website → Pages → "/contact"); re-read at most once a minute
export const revalidate = 60

export const generateMetadata = () => pageMetadata('/contact')

export default function ContactPage() {
  return <CmsPage path="/contact" />
}
