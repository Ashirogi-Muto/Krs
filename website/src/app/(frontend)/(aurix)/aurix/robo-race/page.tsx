import React from 'react'
import { notFound } from 'next/navigation'
import { getEventBySlug } from '@/lib/data/events'
import { EventPage } from '@/components/aurix/EventPage'
import { constructMetadata } from '@/lib/seo/metadata'

export async function generateMetadata() {
  const event = await getEventBySlug('robo-race')
  if (!event) return {}

  return constructMetadata({
    title: 'AURIX Robo Race | Obstacle Time-Trial Racing',
    description:
      'Compete in AURIX Robo Race at IILM University Greater Noida. ₹699 per team, 1 operator, max 30x25x20 cm, max 5 kg. Track and obstacle arrangements undisclosed beforehand.',
    path: '/aurix/robo-race',
  })
}

export default async function RoboRacePage() {
  const event = await getEventBySlug('robo-race')
  if (!event) notFound()

  return <EventPage event={event} />
}
