import React from 'react'
import { notFound } from 'next/navigation'
import { getEventForPage } from '@/lib/data/events'
import { EventPage } from '@/components/aurix/EventPage'
import { constructMetadata } from '@/lib/seo/metadata'

// Re-read event data from the CMS at most once a minute
export const revalidate = 60

export async function generateMetadata() {
  const event = await getEventForPage('hackathon')
  if (!event) return {}

  return constructMetadata({
    title: event.seoTitle || 'KRS Robotics & AI Hackathon 2026 | AURIX Arena',
    description: event.seoDescription || event.shortDescription,
    path: '/aurix/hackathon',
    ogImage: '/og?event=hackathon',
  })
}

export default async function HackathonPage() {
  const event = await getEventForPage('hackathon')
  if (!event) notFound()

  return <EventPage event={event} />
}
