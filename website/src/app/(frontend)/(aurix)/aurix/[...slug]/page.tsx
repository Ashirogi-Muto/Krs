import { CmsPage } from '@/components/blocks/CmsPage'
import { EventPage } from '@/components/aurix/EventPage'
import { getEventForPage } from '@/lib/data/events'
import { pageMetadata } from '@/lib/pages'
import { constructMetadata } from '@/lib/seo/metadata'

// Pages created in the CMS under /aurix/… (AURIX look); re-read at most once a minute
export const revalidate = 60

type Props = { params: Promise<{ slug: string[] }> }
const toPath = async (params: Props['params']) => '/aurix/' + (await params).slug.join('/')

// A competition added later in CMS → Events gets its page here (/aurix/<event slug>), with no code change; the five
// original competitions keep their own route files. An AURIX event wins over a CMS page at the same address.
async function eventFor(params: Props['params']) {
  const { slug } = await params
  if (slug.length !== 1 || !/^[a-z0-9-]+$/.test(slug[0])) return null
  const event = await getEventForPage(slug[0])
  return event?.series === 'AURIX' ? event : null
}

export async function generateMetadata({ params }: Props) {
  const event = await eventFor(params)
  if (event)
    return constructMetadata({
      title: event.seoTitle || event.title,
      description: event.seoDescription || event.shortDescription,
      path: `/aurix/${event.slug}`,
      ogImage: `/og?event=${event.slug}`,
    })
  return pageMetadata(await toPath(params))
}

export default async function AurixCmsPage({ params }: Props) {
  const event = await eventFor(params)
  if (event) return <EventPage event={event} />
  return <CmsPage path={await toPath(params)} />
}
