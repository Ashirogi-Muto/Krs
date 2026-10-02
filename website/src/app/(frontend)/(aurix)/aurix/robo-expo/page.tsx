import React from 'react'
import { notFound } from 'next/navigation'
import { getEventBySlug } from '@/lib/data/events'
import { EventPage } from '@/components/aurix/EventPage'
import { constructMetadata } from '@/lib/seo/metadata'

// Re-read event data from the CMS at most once a minute
export const revalidate = 60

export async function generateMetadata() {
  const event = await getEventBySlug('robo-expo')
  if (!event) return {}

  return constructMetadata({
    title: 'AURIX Robo Expo | Robotics & Embedded Systems Exhibition',
    description:
      event.shortDescription,
    path: '/aurix/robo-expo',
    ogImage: '/og?event=robo-expo',
  })
}

export default async function RoboExpoPage() {
  const event = await getEventBySlug('robo-expo')
  if (!event) notFound()

  return <EventPage event={event} />
}
