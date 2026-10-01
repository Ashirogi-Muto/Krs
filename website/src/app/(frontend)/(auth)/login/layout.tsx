import React from 'react'
import { requireVisibleRoute } from '@/lib/visibility-guard'

export default function HiddenRouteGate({ children }: { children: React.ReactNode }) {
  requireVisibleRoute('/login')
  return <>{children}</>
}
