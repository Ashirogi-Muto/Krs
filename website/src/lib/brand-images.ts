import fs from 'node:fs/promises'
import path from 'node:path'
import { cache } from 'react'
import { getPayload } from 'payload'
import config from '@payload-config'
import { logger } from './logger'

/**
 * Site settings → Logos & icons (owner, 13 Oct 2026): browser-tab icons, the logo on link previews and emails, and the
 * logo for search engines. Each one is optional; empty (or the CMS unreachable, e.g. during `next build`) = built-in.
 */
export type BrandImageKey = 'krsIcon' | 'aurixIcon' | 'shareLogo' | 'emailLogo' | 'searchLogo'
export type BrandMedia = { url: string; filename: string; mimeType?: string }

const asMedia = (v: any): BrandMedia | undefined =>
  v && typeof v === 'object' && typeof v.url === 'string' && typeof v.filename === 'string' ? { url: v.url, filename: v.filename, mimeType: v.mimeType } : undefined

export const getBrandImages = cache(async (): Promise<Partial<Record<BrandImageKey, BrandMedia>>> => {
  try {
    const payload = await getPayload({ config })
    const doc: any = await payload.findGlobal({ slug: 'site-settings', depth: 1 })
    const g = doc?.brandImages || {}
    const out: Partial<Record<BrandImageKey, BrandMedia>> = {}
    for (const k of ['krsIcon', 'aurixIcon', 'shareLogo', 'emailLogo', 'searchLogo'] as BrandImageKey[]) {
      const m = asMedia(g[k])
      if (m) out[k] = m
    }
    return out
  } catch (err: any) {
    logger.warn(`Logos & icons not loaded, using the built-in images: ${err?.message || err}`)
    return {}
  }
})

/** The uploaded file of a Media document (Website → Media keeps originals in public/uploads). */
async function mediaFile(m: BrandMedia): Promise<Buffer> {
  return fs.readFile(path.resolve(process.cwd(), 'public/uploads', path.basename(m.filename)))
}

/**
 * A Media image as a PNG of the given box (whole image kept, transparent margins). Used for favicons and for the
 * link-preview card, whose renderer only reads PNG/JPEG. null when the file is missing or not an image.
 */
export async function brandPng(m: BrandMedia | undefined, width: number, height: number): Promise<Buffer | null> {
  if (!m) return null
  try {
    const sharp = (await import('sharp')).default
    return await sharp(await mediaFile(m), { limitInputPixels: 50_000_000 })
      .resize(width, height, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
      .png()
      .toBuffer()
  } catch (err: any) {
    logger.warn(`Logo/icon ${m.filename} could not be used: ${err?.message || err}`)
    return null
  }
}

/** An icon route's answer: the CMS image as PNG, or null to draw the built-in one. */
export async function cmsIcon(key: 'krsIcon' | 'aurixIcon', size: number): Promise<Response | null> {
  const png = await brandPng((await getBrandImages())[key], size, size)
  return png ? new Response(new Uint8Array(png), { headers: { 'Content-Type': 'image/png' } }) : null
}

/** Logo on the link-preview card (/og): the CMS "Logo on link previews" fitted in its 380 x 347 box, or null. */
export async function shareLogoDataUrl(): Promise<string | null> {
  const png = await brandPng((await getBrandImages()).shareLogo, 760, 694)
  return png ? `data:image/png;base64,${png.toString('base64')}` : null
}
