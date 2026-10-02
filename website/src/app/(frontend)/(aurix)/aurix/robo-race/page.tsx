import React from 'react'
import { notFound } from 'next/navigation'
import { getEventBySlug } from '@/lib/data/events'
import { EventPage } from '@/components/aurix/EventPage'
import { constructMetadata } from '@/lib/seo/metadata'

// Re-read event data from the CMS at most once a minute
export const revalidate = 60

export async function generateMetadata() {
  const event = await getEventBySlug('robo-race')
  if (!event) return {}

  return constructMetadata({
    title: 'AURIX Robo Race | Obstacle Time-Trial Racing',
    description:
      event.shortDescription,
    path: '/aurix/robo-race',
    ogImage: '/og?event=robo-race',
  })
}

export default async function RoboRacePage() {
  const event = await getEventBySlug('robo-race')
  if (!event) notFound()

  return <EventPage event={event} />
}
