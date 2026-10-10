import { cache } from 'react'
import { draftMode, headers } from 'next/headers'
import { getPayload } from 'payload'
import config from '@payload-config'
import { canFor } from '../payload/access/permissions'
import { canPreviewAnything } from './preview-targets'

/**
 * The CMS editor looking at a preview, or null.
 * Next's draft-mode cookie is the same for everyone on a build, so it is never enough: the Payload session must belong to a
 * CMS editor too. Headers are read only when draft mode is on, so visitors' pages stay static/cached (draftMode() itself
 * does not make a page dynamic and reports "off" while pages are pre-rendered).
 */
export const getPreviewUser = cache(async (): Promise<Record<string, unknown> | null> => {
  try {
    if (!(await draftMode()).isEnabled) return null
    const payload = await getPayload({ config })
    const { user } = await payload.auth({ headers: await headers() })
    return user && canPreviewAnything(user) ? (user as any) : null
  } catch {
    return null
  }
})

export const isPreview = async () => (await getPreviewUser()) !== null

/** Unsaved/unpublished draft of this page: the preview user must hold "View drafts" or "Edit" for this page. */
export const canSeePageDraft = (user: Record<string, unknown> | null, pageId: unknown) =>
  Boolean(user) && (canFor(user as any, 'pages.view', pageId) || canFor(user as any, 'pages.edit', pageId))
