import React from 'react'
import { getPreviewUser } from '@/lib/preview'
import { getStaffTexts } from '@/lib/staff-texts'
import { PreviewClient } from './PreviewClient'

/** Renders nothing for visitors (their HTML is unchanged); for a CMS editor in live preview: refresh-on-save + badge. */
export async function PreviewChrome() {
  if (!(await getPreviewUser())) return null
  const T = (await getStaffTexts()).preview
  return <PreviewClient t={{ badge: T.badge, badgeNote: T.badgeNote, exit: T.exit, clickOn: T.clickOn, clickOff: T.clickOff, clickHint: T.clickHint }} />
}
