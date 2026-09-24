import React from 'react'
import { notFound } from 'next/navigation'
import { getEventBySlug } from '@/lib/data/events'
import { EventPage } from '@/components/aurix/EventPage'
import { constructMetadata } from '@/lib/seo/metadata'

export async function generateMetadata() {
  const event = await getEventBySlug('robo-soccer')
  if (!event) return {}

  return constructMetadata({
    title: 'AURIX Robo Soccer | Remote Controlled Robot Football',
    description:
      'Compete in AURIX Robo Soccer at IILM University Greater Noida. ₹699 per team, 1–3 participants, max 30x30x20 cm, max 5 kg. Exact arena layout revealed on-site.',
    path: '/aurix/robo-soccer',
  })
}

export default async function RoboSoccerPage() {
  const event = await getEventBySlug('robo-soccer')
  if (!event) notFound()

  return <EventPage event={event} />
}
