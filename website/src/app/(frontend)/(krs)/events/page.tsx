import { CmsPage } from '@/components/blocks/CmsPage'
import { pageMetadata } from '@/lib/pages'

// Content comes from the CMS (Website → Pages → "/events"); re-read at most once a minute
export const revalidate = 60

export const generateMetadata = () => pageMetadata('/events')

export default function EventsPage() {
  return <CmsPage path="/events" />
}
