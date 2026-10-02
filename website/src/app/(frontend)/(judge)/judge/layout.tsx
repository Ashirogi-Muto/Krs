import React from 'react'
import { requireVisibleRoute } from '@/lib/visibility-guard'

export default async function HiddenRouteGate({ children }: { children: React.ReactNode }) {
  await requireVisibleRoute('/judge')
  return <>{children}</>
}
