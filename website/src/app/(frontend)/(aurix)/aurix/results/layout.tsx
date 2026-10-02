import React from 'react'
import { requireVisibleRoute } from '@/lib/visibility-guard'

export default async function HiddenRouteGate({ children }: { children: React.ReactNode }) {
  await requireVisibleRoute('/aurix/results')
  return <>{children}</>
}
