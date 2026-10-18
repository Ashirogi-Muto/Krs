import { SiteOfferTicker } from '@/components/aurix/SiteOfferTicker'
import { CmsPage } from '@/components/blocks/CmsPage'
import { pageMetadata } from '@/lib/pages'

// Content comes from the CMS (Website → Pages → "/aurix/competitions"); re-read at most once a minute
export const revalidate = 60

export const generateMetadata = () => pageMetadata('/aurix/competitions')

export default async function AurixCompetitionsPage() {
  return (
    <>
      <SiteOfferTicker />
      <CmsPage path="/aurix/competitions" />
    </>
  )
}
