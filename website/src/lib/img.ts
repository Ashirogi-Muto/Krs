/**
 * Smaller copies of CMS uploads (Website → Media): photos are uploaded at full size (often 1–2 MB) but shown at a few
 * hundred pixels, so pages ask Next.js's image optimizer for a resized WebP/PNG instead. The stored file is never
 * touched. Only our own uploads are rewritten; anything else (built-in images, logos, external links) is returned as is.
 */
const WIDTHS = [16, 32, 48, 64, 96, 128, 256, 384, 640, 750, 828, 1080, 1200, 1920, 2048, 3840] // Next's default sizes

export function optimizedSrc(url: string | undefined, width: number): string | undefined {
  if (!url || !url.startsWith('/api/media/file/') || url.includes('?')) return url
  const w = WIDTHS.find((x) => x >= width) ?? WIDTHS[WIDTHS.length - 1]
  return `/_next/image?url=${encodeURIComponent(url)}&w=${w}&q=75`
}
