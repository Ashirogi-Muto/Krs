import React from 'react'
import { getNavigation } from '@/lib/navigation'

/** The AURIX logo (CMS → Navigation & footer → AURIX site → Logo) as a small inline mark; replaced the flame icon. */
export async function AurixMark({ className = 'w-4 h-4' }: { className?: string }) {
  const src = (await getNavigation()).aurix.logo
  // eslint-disable-next-line @next/next/no-img-element
  return <img src={src} alt="" aria-hidden="true" className={`${className} object-contain shrink-0`} />
}
