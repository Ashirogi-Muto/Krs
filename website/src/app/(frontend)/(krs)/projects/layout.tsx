import React from 'react'
import { requireVisibleRoute } from '@/lib/visibility-guard'

// Can be hidden from the CMS (Site settings → Hidden pages)
export default async function HiddenRouteGate({ children }: { children: React.ReactNode }) {
  await requireVisibleRoute('/projects')
  return <>{children}</>
}
