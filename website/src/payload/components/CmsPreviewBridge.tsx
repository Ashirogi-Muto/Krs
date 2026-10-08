import React from 'react'
import { getStaffTexts } from '../../lib/staff-texts'
import { CmsPreviewBridgeClient } from './CmsPreviewBridgeClient'

/** Live preview link between CMS fields and the preview panel (admin provider). Wording: Staff & admin texts → Live preview. */
export default async function CmsPreviewBridge({ children }: { children?: React.ReactNode }) {
  const T = (await getStaffTexts()).preview
  return <CmsPreviewBridgeClient t={{ sharedNote: T.sharedNote, noField: T.noField }}>{children}</CmsPreviewBridgeClient>
}
