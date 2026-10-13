// Numbered so it never shares a route name with the site-wide AURIX icon one level up
import fs from 'node:fs/promises'
import path from 'node:path'
import { cmsIcon } from '@/lib/brand-images'

export const size = { width: 180, height: 180 }
export const contentType = 'image/png'
// Re-read the CMS icon at most every 5 minutes (saving Site settings also refreshes it)
export const revalidate = 300

/** KRS pages' Apple touch icon: Site settings → Logos & icons, else the built-in KRS mark. */
export default async function AppleIcon() {
  const custom = await cmsIcon('krsIcon', size.width)
  if (custom) return custom
  const png = await fs.readFile(path.resolve(process.cwd(), 'public/images/krs-apple-icon.png'))
  return new Response(new Uint8Array(png), { headers: { 'Content-Type': 'image/png' } })
}
