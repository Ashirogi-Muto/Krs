import React from 'react'
import { notFound } from 'next/navigation'
import { getEventBySlug } from '@/lib/data/events'
import { EventPage } from '@/components/aurix/EventPage'
import { constructMetadata } from '@/lib/seo/metadata'

export async function generateMetadata() {
  const event = await getEventBySlug('robo-ideathon')
  if (!event) return {}

  return constructMetadata({
    title: 'AURIX Robo Ideathon 2026 | Robotics Ideation & Architecture',
    description:
      'Structured 6-stage ideation and architectural design challenge. ₹499 per team, up to 5 members. Hardware optional. Evaluated on solution rigor, feasibility, and real-world impact.',
    path: '/aurix/robo-ideathon',
  })
}

export default async function RoboIdeathonPage() {
  const event = await getEventBySlug('robo-ideathon')
  if (!event) notFound()

  return <EventPage event={event} />
}
