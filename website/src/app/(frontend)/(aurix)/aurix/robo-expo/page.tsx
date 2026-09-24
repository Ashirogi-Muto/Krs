import React from 'react'
import { notFound } from 'next/navigation'
import { getEventBySlug } from '@/lib/data/events'
import { EventPage } from '@/components/aurix/EventPage'
import { constructMetadata } from '@/lib/seo/metadata'

export async function generateMetadata() {
  const event = await getEventBySlug('robo-expo')
  if (!event) return {}

  return constructMetadata({
    title: 'AURIX Robo Expo | Robotics & Embedded Systems Exhibition',
    description:
      'Hardware project exhibition and technical judging at IILM University Greater Noida. ₹500 per team, 1–4 participants. Working demonstrations evaluated across 7 structured criteria.',
    path: '/aurix/robo-expo',
  })
}

export default async function RoboExpoPage() {
  const event = await getEventBySlug('robo-expo')
  if (!event) notFound()

  return <EventPage event={event} />
}
