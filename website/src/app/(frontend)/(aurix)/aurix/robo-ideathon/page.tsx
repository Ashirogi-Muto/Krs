import React from 'react'
import { notFound } from 'next/navigation'
import { getEventBySlug } from '@/lib/data/events'
import { EventPage } from '@/components/aurix/EventPage'
import { constructMetadata } from '@/lib/seo/metadata'

// Re-read event data from the CMS at most once a minute
export const revalidate = 60

export async function generateMetadata() {
  const event = await getEventBySlug('robo-ideathon')
  if (!event) return {}

  return constructMetadata({
    title: event.seoTitle || 'AURIX Robo Ideathon 2026 | Robotics Ideation & Architecture',
    description: event.seoDescription || event.shortDescription,
    path: '/aurix/robo-ideathon',
    ogImage: '/og?event=robo-ideathon',
  })
}

export default async function RoboIdeathonPage() {
  const event = await getEventBySlug('robo-ideathon')
  if (!event) notFound()

  return <EventPage event={event} />
}
