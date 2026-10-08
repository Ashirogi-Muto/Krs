/** Student ID files (team registration and ID re-upload): size limit and real-type check (server side). */
export const MAX_FILE_BYTES = 2 * 1024 * 1024

/** Detects the real file type from its first bytes; the browser-supplied type is not trusted. */
export function sniffMime(buf: Buffer): string | null {
  if (buf.length >= 3 && buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) return 'image/jpeg'
  if (buf.length >= 8 && buf.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])))
    return 'image/png'
  if (buf.length >= 12 && buf.subarray(0, 4).toString('latin1') === 'RIFF' && buf.subarray(8, 12).toString('latin1') === 'WEBP')
    return 'image/webp'
  if (buf.length >= 5 && buf.subarray(0, 5).toString('latin1') === '%PDF-') return 'application/pdf'
  return null
}

export const EXTENSIONS: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'application/pdf': 'pdf',
}

/** Real type of an image/PDF upload (CMS media): the browser's claim is not trusted. */
export function sniffUpload(buf: Buffer): string | null {
  const base = sniffMime(buf)
  if (base) return base
  if (buf.length >= 6 && /^GIF8[79]a$/.test(buf.subarray(0, 6).toString('latin1'))) return 'image/gif'
  // ISO-BMFF "ftyp" box with an AVIF brand
  if (buf.length >= 12 && buf.subarray(4, 8).toString('latin1') === 'ftyp' && /^avi[fs]$/.test(buf.subarray(8, 12).toString('latin1')))
    return 'image/avif'
  return null
}
