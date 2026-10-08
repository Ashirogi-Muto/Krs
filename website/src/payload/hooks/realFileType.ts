import fs from 'node:fs/promises'
import { APIError, type CollectionBeforeValidateHook } from 'payload'
import { sniffUpload } from '../../lib/id-files'

/**
 * Uploads through the CMS (or its API) must really be one of `allowed`, judged from the file's first bytes, not from
 * its name or the browser's type (a renamed .html / .svg is refused). The stored MIME type is the detected one.
 */
export const requireRealFileType =
  (allowed: string[]): CollectionBeforeValidateHook =>
  async ({ req, data }) => {
    const file = (req as any).file as { data?: Buffer; tempFilePath?: string; mimetype?: string } | undefined
    if (!file) return data
    let head = file.data && file.data.length ? file.data.subarray(0, 64) : null
    if (!head && file.tempFilePath) {
      const fh = await fs.open(file.tempFilePath, 'r')
      try {
        const buf = Buffer.alloc(64)
        const { bytesRead } = await fh.read(buf, 0, 64, 0)
        head = buf.subarray(0, bytesRead)
      } finally {
        await fh.close()
      }
    }
    const real = head ? sniffUpload(head) : null
    if (!real || !allowed.includes(real)) {
      throw new APIError(`This file type is not allowed. Upload one of: ${allowed.map((m) => m.split('/')[1].toUpperCase()).join(', ')}.`, 400, undefined, true)
    }
    file.mimetype = real
    return data
  }
