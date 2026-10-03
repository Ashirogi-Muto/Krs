import { CmsPage } from '@/components/blocks/CmsPage'
import { pageMetadata } from '@/lib/pages'

// Pages created in the CMS (Website → Pages) at any free path outside /aurix; re-read at most once a minute
export const revalidate = 60

type Props = { params: Promise<{ slug: string[] }> }
const toPath = async (params: Props['params']) => '/' + (await params).slug.join('/')

export async function generateMetadata({ params }: Props) {
  return pageMetadata(await toPath(params))
}

export default async function CmsCatchAllPage({ params }: Props) {
  return <CmsPage path={await toPath(params)} />
}
