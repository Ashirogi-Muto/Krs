import { CmsPage } from '@/components/blocks/CmsPage'
import { pageMetadata } from '@/lib/pages'

// Content comes from the CMS (Website → Pages → "/gallery"); re-read at most once a minute
export const revalidate = 60

export const generateMetadata = () => pageMetadata('/gallery')

export default async function GalleryPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  return <CmsPage path="/gallery" query={await searchParams} />
}
