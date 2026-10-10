import { DeleteObjectCommand, GetObjectCommand, HeadObjectCommand, ListObjectsV2Command, PutObjectCommand, S3Client } from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'

/**
 * Cloudflare R2 (S3-compatible) for round submissions. Private bucket: files are only reachable through short-lived
 * signed links made here. Settings (server .env, from /opt/krs/creds/r2.env): R2_ACCOUNT_ID, R2_ACCESS_KEY_ID,
 * R2_SECRET_ACCESS_KEY, R2_BUCKET. R2_ENDPOINT / R2_SERVER_ENDPOINT override the endpoint (local tests only).
 */
const env = () => ({
  account: process.env.R2_ACCOUNT_ID || '',
  key: process.env.R2_ACCESS_KEY_ID || '',
  secret: process.env.R2_SECRET_ACCESS_KEY || '',
  bucket: process.env.R2_BUCKET || '',
  endpoint: process.env.R2_ENDPOINT || (process.env.R2_ACCOUNT_ID ? `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com` : ''),
  serverEndpoint: process.env.R2_SERVER_ENDPOINT || '',
})

export const isR2Configured = () => {
  const e = env()
  return Boolean(e.key && e.secret && e.bucket && e.endpoint)
}

let browserClient: S3Client | null = null
let serverClient: S3Client | null = null
const client = (forBrowser: boolean) => {
  const e = env()
  const make = (endpoint: string) =>
    new S3Client({ region: 'auto', endpoint, forcePathStyle: true, credentials: { accessKeyId: e.key, secretAccessKey: e.secret } })
  if (forBrowser) return (browserClient ||= make(e.endpoint))
  return (serverClient ||= make(e.serverEndpoint || e.endpoint))
}

/**
 * Signed PUT link (10 min). Content-Length and Content-Type are part of the signature, so the browser must send exactly
 * that many bytes of that type: the size limit is enforced by R2 itself.
 */
export async function signedPutUrl(key: string, contentType: string, size: number, expiresIn = 600): Promise<string> {
  return getSignedUrl(client(true), new PutObjectCommand({ Bucket: env().bucket, Key: key, ContentType: contentType, ContentLength: size }), {
    expiresIn,
    signableHeaders: new Set(['content-type', 'content-length']),
  })
}

/** Signed download link (5 min) that saves the file under its original name. */
export async function signedGetUrl(key: string, filename: string, expiresIn = 300): Promise<string> {
  return getSignedUrl(
    client(true),
    new GetObjectCommand({ Bucket: env().bucket, Key: key, ResponseContentDisposition: `attachment; filename="${filename.replace(/["\\]/g, '_')}"` }),
    { expiresIn },
  )
}

export async function headObject(key: string): Promise<{ size: number; contentType?: string } | null> {
  try {
    const r = await client(false).send(new HeadObjectCommand({ Bucket: env().bucket, Key: key }))
    return { size: Number(r.ContentLength || 0), contentType: r.ContentType }
  } catch {
    return null
  }
}

/** Bytes `range` ("bytes=0-15" or "bytes=-65536") of an object. */
export async function readRange(key: string, range: string): Promise<Buffer> {
  const r = await client(false).send(new GetObjectCommand({ Bucket: env().bucket, Key: key, Range: range }))
  return Buffer.from(await r.Body!.transformToByteArray())
}

export async function deleteObject(key: string): Promise<void> {
  await client(false).send(new DeleteObjectCommand({ Bucket: env().bucket, Key: key }))
}

/** Every object under `prefix` (paged, 1000 per call), with its upload time (ms). */
export async function listObjects(prefix: string): Promise<{ key: string; modified: number }[]> {
  const out: { key: string; modified: number }[] = []
  let token: string | undefined
  do {
    const r = await client(false).send(new ListObjectsV2Command({ Bucket: env().bucket, Prefix: prefix, ContinuationToken: token }))
    for (const o of r.Contents || []) if (o.Key) out.push({ key: o.Key, modified: o.LastModified ? o.LastModified.getTime() : 0 })
    token = r.IsTruncated ? r.NextContinuationToken : undefined
  } while (token)
  return out
}
