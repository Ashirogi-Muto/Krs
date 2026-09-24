import React from 'react'
import { notFound } from 'next/navigation'
import { getEventBySlug } from '@/lib/data/events'
import { EventPage } from '@/components/aurix/EventPage'
import { constructMetadata } from '@/lib/seo/metadata'

export async function generateMetadata() {
  const event = await getEventBySlug('hackathon')
  if (!event) return {}

  return constructMetadata({
    title: 'KRS Robotics & AI Hackathon 2026 | AURIX Arena',
    description:
      '24-Hour National Robotics & AI Hackathon on 29–30 October 2026 at IILM University Greater Noida. 9 advanced challenge tracks, ₹1,00,000 prize pool, exactly 5 participants per team.',
    path: '/aurix/hackathon',
  })
}

export default async function HackathonPage() {
  const event = await getEventBySlug('hackathon')
  if (!event) notFound()

  return <EventPage event={event} />
}
