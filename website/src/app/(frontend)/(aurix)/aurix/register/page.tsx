import { CmsPage } from '@/components/blocks/CmsPage'
import { pageMetadata } from '@/lib/pages'

// Content comes from the CMS (Website → Pages → "/aurix/register"); the form itself reads the URL query
export const dynamic = 'force-dynamic'

export const generateMetadata = () => pageMetadata('/aurix/register')

export default async function AurixRegisterPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  return <CmsPage path="/aurix/register" query={await searchParams} />
}
