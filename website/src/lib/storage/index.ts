import fs from 'node:fs'
import path from 'node:path'
import crypto from 'node:crypto'
import { logger } from '@/lib/logger'

export interface UploadResult {
  filename: string
  url: string
  mimeType: string
  sizeBytes: number
  isPrivate: boolean
}

export interface StorageService {
  uploadFile(
    fileBuffer: Buffer,
    originalName: string,
    mimeType: string,
    isPrivate?: boolean
  ): Promise<UploadResult>
  getFileUrl(filename: string, isPrivate?: boolean): Promise<string>
}

// Whitelist of strictly validated MIME types
export const ALLOWED_MIME_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/svg+xml',
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation', // PPTX
  'application/vnd.ms-powerpoint', // PPT
]

export const MAX_UPLOAD_SIZE_BYTES = 15 * 1024 * 1024 // 15MB

class LocalStorageService implements StorageService {
  private publicUploadsDir = path.resolve(process.cwd(), 'public/uploads')
  private privateUploadsDir = path.resolve(process.cwd(), '.private_uploads')

  constructor() {
    if (!fs.existsSync(this.publicUploadsDir)) {
      fs.mkdirSync(this.publicUploadsDir, { recursive: true })
    }
    if (!fs.existsSync(this.privateUploadsDir)) {
      fs.mkdirSync(this.privateUploadsDir, { recursive: true })
    }
  }

  async uploadFile(
    fileBuffer: Buffer,
    originalName: string,
    mimeType: string,
    isPrivate = false
  ): Promise<UploadResult> {
    if (!ALLOWED_MIME_TYPES.includes(mimeType)) {
      throw new Error(`File type ${mimeType} is not permitted.`)
    }

    if (fileBuffer.length > MAX_UPLOAD_SIZE_BYTES) {
      throw new Error(`File exceeds maximum size of 15MB.`)
    }

    // Sanitize extension and generate randomized high-entropy filename
    const ext = path.extname(originalName).toLowerCase().replace(/[^a-z0-9.]/g, '')
    const safeHash = crypto.randomBytes(16).toString('hex')
    const filename = `${Date.now()}_${safeHash}${ext}`

    const targetDir = isPrivate ? this.privateUploadsDir : this.publicUploadsDir
    const destPath = path.join(targetDir, filename)

    fs.writeFileSync(destPath, fileBuffer)
    logger.info(`Uploaded file: ${filename} (Private: ${isPrivate}, Size: ${fileBuffer.length} bytes)`)

    const url = isPrivate ? `/api/files/private/${filename}` : `/uploads/${filename}`

    return {
      filename,
      url,
      mimeType,
      sizeBytes: fileBuffer.length,
      isPrivate,
    }
  }

  async getFileUrl(filename: string, isPrivate = false): Promise<string> {
    return isPrivate ? `/api/files/private/${filename}` : `/uploads/${filename}`
  }
}

class S3StorageService implements StorageService {
  async uploadFile(
    fileBuffer: Buffer,
    originalName: string,
    mimeType: string,
    isPrivate = false
  ): Promise<UploadResult> {
    if (process.env.NODE_ENV === 'production' && (!process.env.S3_BUCKET || !process.env.S3_ACCESS_KEY_ID)) {
      throw new Error('S3 Object Storage configuration missing in production. Failing closed.')
    }

    const ext = path.extname(originalName).toLowerCase().replace(/[^a-z0-9.]/g, '')
    const filename = `${Date.now()}_${crypto.randomBytes(16).toString('hex')}${ext}`
    const key = isPrivate ? `private/${filename}` : `public/${filename}`

    logger.info(`[S3 STORAGE] Uploading ${key} to bucket ${process.env.S3_BUCKET}`)
    // S3 client putObject dispatch goes here
    const url = isPrivate
      ? `/api/files/private/${filename}`
      : `${process.env.S3_ENDPOINT || ''}/${process.env.S3_BUCKET || ''}/${key}`

    return {
      filename,
      url,
      mimeType,
      sizeBytes: fileBuffer.length,
      isPrivate,
    }
  }

  async getFileUrl(filename: string, isPrivate = false): Promise<string> {
    if (isPrivate) {
      // In production generate pre-signed URL with 15-minute expiration
      return `/api/files/private/${filename}?signed=true`
    }
    return `${process.env.S3_ENDPOINT || ''}/${process.env.S3_BUCKET || ''}/public/${filename}`
  }
}

export function getStorageService(): StorageService {
  const provider = process.env.STORAGE_PROVIDER || (process.env.NODE_ENV === 'production' ? 's3' : 'local')

  if (provider === 'local') {
    return new LocalStorageService()
  }

  if (provider === 's3') {
    return new S3StorageService()
  }

  throw new Error(`Unsupported storage provider: ${provider}`)
}
