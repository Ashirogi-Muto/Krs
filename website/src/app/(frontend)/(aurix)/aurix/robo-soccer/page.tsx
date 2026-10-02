import React from 'react'
import { notFound } from 'next/navigation'
import { getEventBySlug } from '@/lib/data/events'
import { EventPage } from '@/components/aurix/EventPage'
import { constructMetadata } from '@/lib/seo/metadata'

// Re-read event data from the CMS at most once a minute
export const revalidate = 60

export async function generateMetadata() {
  const event = await getEventBySlug('robo-soccer')
  if (!event) return {}

  return constructMetadata({
    title: 'AURIX Robo Soccer | Remote Controlled Robot Football',
    description:
      event.shortDescription,
    path: '/aurix/robo-soccer',
    ogImage: '/og?event=robo-soccer',
  })
}

export default async function RoboSoccerPage() {
  const event = await getEventBySlug('robo-soccer')
  if (!event) notFound()

  return <EventPage event={event} />
}
