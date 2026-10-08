'use client'

import React from 'react'
import { useDocumentInfo, useFormFields } from '@payloadcms/ui'

/** "Download file" on a submission (signed 5-minute link from /api/admin/submissions/<id>/file). */
export function SubmissionDownload() {
  const { id } = useDocumentInfo()
  const filename = useFormFields(([fields]) => fields['file.filename']?.value as string | undefined)
  if (!id || !filename) return null
  return (
    <div style={{ margin: '8px 0 20px' }}>
      <a className="btn btn--style-primary btn--size-medium" style={{ margin: 0 }} href={`/api/admin/submissions/${id}/file`} target="_blank" rel="noopener">
        ⬇ {filename}
      </a>
    </div>
  )
}
