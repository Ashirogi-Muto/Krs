import { CmsPage } from '@/components/blocks/CmsPage'
import { pageMetadata } from '@/lib/pages'

// Pages created in the CMS under /aurix/… (AURIX look); re-read at most once a minute
export const revalidate = 60

type Props = { params: Promise<{ slug: string[] }> }
const toPath = async (params: Props['params']) => '/aurix/' + (await params).slug.join('/')

export async function generateMetadata({ params }: Props) {
  return pageMetadata(await toPath(params))
}

export default async function AurixCmsPage({ params }: Props) {
  return <CmsPage path={await toPath(params)} />
}
