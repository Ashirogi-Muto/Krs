'use client'

import React from 'react'
import { useDocumentInfo, useFormFields } from '@payloadcms/ui'

/** "Download receipt" on a registration (signed 5-minute link from /api/admin/registrations/<id>/receipt). */
export function ReceiptDownload() {
  const { id } = useDocumentInfo()
  const filename = useFormFields(([fields]) => fields['receiptFilename']?.value as string | undefined)
  if (!id || !filename) return null
  return (
    <div style={{ margin: '8px 0 20px' }}>
      <a className="btn btn--style-primary btn--size-medium" style={{ margin: 0 }} href={`/api/admin/registrations/${id}/receipt`} target="_blank" rel="noopener">
        ⬇ {filename}
      </a>
    </div>
  )
}
