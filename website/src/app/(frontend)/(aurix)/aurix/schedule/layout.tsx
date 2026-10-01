import React from 'react'
import { requireVisibleRoute } from '@/lib/visibility-guard'

export default function HiddenRouteGate({ children }: { children: React.ReactNode }) {
  requireVisibleRoute('/aurix/schedule')
  return <>{children}</>
}
