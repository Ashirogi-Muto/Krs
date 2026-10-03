import { CmsPage } from '@/components/blocks/CmsPage'
import { pageMetadata } from '@/lib/pages'

// Content comes from the CMS (Website → Pages → "/aurix/status"); the form itself reads the URL query
export const dynamic = 'force-dynamic'

export const generateMetadata = () => pageMetadata('/aurix/status')

export default async function AurixStatusPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  return <CmsPage path="/aurix/status" query={await searchParams} />
}
